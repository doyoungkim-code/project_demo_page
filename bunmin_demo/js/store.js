/* ============================================================
   BUNMIN 데모 — 공유 스토어
   frontend/src/stores/lectureStore.ts 의 필드명을 1:1 미러링한
   초경량 pub/sub. 강의자 뷰·수강자 뷰·PiP 미리보기가 같은
   인스턴스를 구독하므로 화면 간 동기화가 자동으로 이뤄진다.
   ============================================================ */
(function () {
  'use strict';
  window.BUNMIN = window.BUNMIN || {};

  function initialState() {
    return {
      // ── 강의 상태 머신 ──
      isConnected: true,
      isMicOn: false,
      isLectureStarted: false,
      isPaused: false,
      isLectureEnded: false,
      presentationMode: 'slide', // 'slide' | 'screen'
      isScreenSharing: false,

      // ── 슬라이드 ──
      slideStatus: 'none', // 'none' | 'uploading' | 'ready'
      uploadStage: null,   // { stage:'ocr'|'translate'|'bundling', percent, eta }
      slideTitle: '',
      slideFileName: '',
      currentPage: 1,
      totalPages: 0,
      materialMode: 'translated', // 'original' | 'translated' (수강자·미리보기)
      lecturerMaterialMode: 'original', // 강의자 스테이지 토글

      // ── 자막: {id, original, translated, partial, asrMs, nmtMs, timestamp} ──
      subtitles: [],
      activePartial: null, // 진행 중 ASR partial 텍스트
      ttsPlayingId: null,

      // ── 오디오 ──
      micLevelDb: null, // 현재 dB (null = 무신호)
      micGainPct: 100,
      vadActive: false,

      // ── 참가자/채팅 ──
      lecturerName: '김교수',
      studentName: '김학생',
      participants: [
        { name: 'Aisha', audioLang: 'en' },
        { name: 'Minh', audioLang: 'en' },
        { name: '박수민', audioLang: 'ko' },
      ],
      chatMessages: [], // {id, sender:'lecturer'|'student', name, text}
      connectionQuality: 'good', // 'good' | 'fair' | 'poor'

      // ── 포인터/판서 ──
      spotlightEnabled: false,
      spotlightColor: '#60A5FA',
      cursorPos: null, // {x, y} 0~1 정규화 (슬라이드 박스 기준)
      drawEnabled: false,
      drawTool: 'pencil', // 'pencil'|'highlighter'|'rect'|'eraser'
      drawColor: '#EF4444',
      // 페이지별 스트로크: { [page]: [{tool,color,points:[[x,y],...]}] }
      strokes: {},
      strokesVersion: 0, // 캔버스 다시 그리기 트리거
    };
  }

  function createStore() {
    let state = initialState();
    const subscribers = [];
    return {
      get() { return state; },
      set(patch) {
        state = Object.assign({}, state, patch);
        const keys = new Set(Object.keys(patch));
        subscribers.forEach(function (fn) { fn(state, keys); });
      },
      subscribe(fn) { subscribers.push(fn); },
      reset() {
        const fresh = initialState();
        const keys = new Set(Object.keys(fresh));
        state = fresh;
        subscribers.forEach(function (fn) { fn(state, keys); });
      },
    };
  }

  const store = createStore();
  let subtitleSeq = 0;
  let chatSeq = 0;

  function nowHMS() {
    const d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  // ── lectureStore 액션에 대응하는 편의 함수들 ──
  const actions = {
    addSubtitle(original, asrMs) {
      const sub = {
        id: ++subtitleSeq,
        original: original,
        translated: null,
        asrMs: asrMs || null,
        nmtMs: null,
        timestamp: nowHMS(),
        startedAt: Date.now(),
      };
      const subtitles = store.get().subtitles.concat([sub]).slice(-50);
      store.set({ subtitles: subtitles, activePartial: null });
      return sub.id;
    },
    setTranslation(id, translated, nmtMs) {
      const subtitles = store.get().subtitles.map(function (s) {
        return s.id === id ? Object.assign({}, s, { translated: translated, nmtMs: nmtMs || null }) : s;
      });
      store.set({ subtitles: subtitles });
    },
    addChat(sender, name, text) {
      const msg = { id: ++chatSeq, sender: sender, name: name, text: text, timestamp: nowHMS() };
      store.set({ chatMessages: store.get().chatMessages.concat([msg]) });
    },
    goPage(page) {
      const s = store.get();
      if (s.slideStatus !== 'ready') return;
      const p = Math.min(Math.max(1, page), s.totalPages);
      if (p !== s.currentPage) store.set({ currentPage: p });
    },
    addStroke(page, stroke) {
      const s = store.get();
      const strokes = Object.assign({}, s.strokes);
      strokes[page] = (strokes[page] || []).concat([stroke]);
      store.set({ strokes: strokes, strokesVersion: s.strokesVersion + 1 });
    },
    clearStrokes(page) {
      const s = store.get();
      const strokes = Object.assign({}, s.strokes);
      strokes[page] = [];
      store.set({ strokes: strokes, strokesVersion: s.strokesVersion + 1 });
    },
  };

  window.BUNMIN.store = store;
  window.BUNMIN.actions = actions;
})();
