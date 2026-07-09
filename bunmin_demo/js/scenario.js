/* ============================================================
   BUNMIN 데모 — 시나리오 엔진
   rAF 기반 가상 시간 스케줄러. 배속/일시정지/리셋 지원.
   utterance 이벤트는 VAD → ASR partial → ASR final →
   NMT 번역 → TTS 재생의 실제 파이프라인 흐름으로 전개된다.
   ============================================================ */
(function () {
  'use strict';
  const B = window.BUNMIN;

  /* ─── 발화 대본: "자료구조 — 이진 탐색 트리" ─── */
  const UTTERANCES = [
    {
      ko: '안녕하세요 여러분, 오늘은 자료구조 일곱 번째 시간입니다.',
      en: 'Hello everyone, this is our seventh session on data structures.',
      dur: 3600, asrMs: 310, nmtMs: 640,
    },
    {
      ko: '이진 탐색 트리는 왼쪽 자식이 항상 부모보다 작고, 오른쪽 자식은 큽니다.',
      en: 'In a binary search tree, the left child is always smaller than its parent, and the right child is larger.',
      dur: 4300, asrMs: 350, nmtMs: 720,
    },
    {
      ko: '그래서 중위 순회를 하면 정렬된 결과를 얻을 수 있습니다.',
      en: 'So an in-order traversal gives us the elements in sorted order.',
      dur: 3400, asrMs: 290, nmtMs: 580,
    },
    {
      ko: '화면의 트리를 보시면 루트가 8이고, 왼쪽 서브트리는 모두 8보다 작습니다.',
      en: 'Looking at the tree on screen, the root is 8, and every node in the left subtree is smaller than 8.',
      dur: 4300, asrMs: 340, nmtMs: 690,
    },
    {
      ko: '여기 강조한 루트 노드가 모든 탐색의 시작점이 됩니다.',
      en: 'This highlighted root node is where every search begins.',
      dur: 3300, asrMs: 300, nmtMs: 610,
    },
    {
      ko: '탐색과 삽입, 삭제 모두 평균적으로 로그 시간이 걸립니다.',
      en: 'Search, insertion, and deletion all take logarithmic time on average.',
      dur: 3700, asrMs: 320, nmtMs: 650,
    },
    {
      ko: '하지만 트리가 한쪽으로 치우치면 최악의 경우 선형 시간이 됩니다.',
      en: 'But if the tree becomes skewed, the worst case degrades to linear time.',
      dur: 3900, asrMs: 330, nmtMs: 670,
    },
    {
      ko: '오늘 내용을 정리하고, 다음 시간에는 균형 트리를 배우겠습니다. 과제 잊지 마세요!',
      en: "Let's wrap up today's material. Next time we will cover balanced trees — don't forget the assignment!",
      dur: 4600, asrMs: 360, nmtMs: 740,
    },
  ];

  /* ─── 타임라인 (절대 ms) ─── */
  function buildScript() {
    const ev = [];
    ev.push({ t: 0, type: 'phase', text: '① 강의자료 업로드 → OCR → VLM 번역 시뮬레이션' });
    ev.push({ t: 0, type: 'goto_lecturer' });
    ev.push({ t: 300, type: 'upload' });          // 약 4.2초 소요
    ev.push({ t: 5000, type: 'phase', text: '② 마이크 켜고 강의 시작' });
    ev.push({ t: 5200, type: 'mic_on' });
    ev.push({ t: 6200, type: 'lecture_start' });
    ev.push({ t: 7200, type: 'chat', sender: 'student', name: '박수민', text: '교수님 잘 들려요!' });

    let t = 7800;
    // 발화 1 (표지)
    t = pushUtterance(ev, t, UTTERANCES[0]);
    ev.push({ t: t + 200, type: 'phase', text: '③ 발화가 끝날 때마다 ASR → NMT → 자막 → TTS 로 전달' });
    ev.push({ t: t + 400, type: 'page', page: 2 });
    // 발화 2, 3 (정의)
    t = pushUtterance(ev, t + 900, UTTERANCES[1]);
    t = pushUtterance(ev, t + 700, UTTERANCES[2]);
    ev.push({ t: t + 300, type: 'page', page: 3 });
    ev.push({ t: t + 600, type: 'phase', text: '④ 커서 스팟라이트와 판서가 수강자 화면에 동기화' });
    ev.push({ t: t + 700, type: 'cursor_on' });
    ev.push({ t: t + 800, type: 'cursor_path', path: circlePath(0.5, 0.42, 0.1), dur: 2400 });
    // 발화 4 (다이어그램)
    t = pushUtterance(ev, t + 900, UTTERANCES[3]);
    ev.push({ t: t + 200, type: 'draw', tool: 'highlighter', color: '#FBBF24', points: linePoints(0.42, 0.36, 0.58, 0.36, 14), dur: 700 });
    // 발화 5
    t = pushUtterance(ev, t + 600, UTTERANCES[4]);
    ev.push({ t: t + 200, type: 'cursor_off' });
    ev.push({ t: t + 300, type: 'page', page: 4 });
    // 발화 6 (복잡도)
    t = pushUtterance(ev, t + 800, UTTERANCES[5]);
    ev.push({ t: t + 100, type: 'draw', tool: 'rect', color: '#EF4444', points: [[0.55, 0.33], [0.83, 0.44]], dur: 500 });
    ev.push({ t: t + 300, type: 'connection', quality: 'fair' });
    ev.push({ t: t + 350, type: 'phase', text: '⑤ 회선 품질 변화도 헤더 칩으로 표시 (P90 적응형 딜레이)' });
    // 발화 7
    t = pushUtterance(ev, t + 700, UTTERANCES[6]);
    ev.push({ t: t + 200, type: 'connection', quality: 'good' });
    ev.push({ t: t + 400, type: 'chat', sender: 'student', name: 'Aisha', text: 'Does an AVL tree solve the skewed case?' });
    ev.push({ t: t + 1500, type: 'chat', sender: 'lecturer', name: null, text: '네! 다음 시간에 AVL 트리로 균형을 맞추는 방법을 배웁니다.' });
    ev.push({ t: t + 2400, type: 'phase', text: '⑥ 일시정지 — 수강자 화면에 Paused 오버레이' });
    ev.push({ t: t + 2600, type: 'pause' });
    ev.push({ t: t + 5200, type: 'resume' });
    ev.push({ t: t + 5600, type: 'page', page: 5 });
    // 발화 8 (마무리)
    t = pushUtterance(ev, t + 6200, UTTERANCES[7]);
    ev.push({ t: t + 500, type: 'chat', sender: 'lecturer', name: null, text: '과제는 다음 주 월요일까지입니다. 수고했어요!' });
    ev.push({ t: t + 1600, type: 'phase', text: '⑦ 강의 종료 — 자막 TXT/SRT 다운로드' });
    ev.push({ t: t + 1900, type: 'lecture_end' });
    ev.push({ t: t + 2200, type: 'done' });
    return ev;
  }

  // utterance 매크로 → vad/partial/final/nmt/tts 서브 이벤트로 전개. 다음 시작 시각 반환.
  function pushUtterance(ev, t0, u) {
    ev.push({ t: t0, type: 'vad', on: true });
    const words = u.ko.split(' ');
    [0.35, 0.65, 0.88].forEach(function (frac) {
      const n = Math.max(1, Math.round(words.length * frac));
      ev.push({ t: t0 + u.dur * frac, type: 'asr_partial', text: words.slice(0, n).join(' ') });
    });
    ev.push({ t: t0 + u.dur, type: 'vad', on: false });
    ev.push({ t: t0 + u.dur + u.asrMs, type: 'asr_final', ko: u.ko, asrMs: u.asrMs });
    ev.push({ t: t0 + u.dur + u.asrMs + u.nmtMs, type: 'nmt', en: u.en, nmtMs: u.nmtMs });
    const ttsDur = Math.min(6000, u.en.length * 52);
    ev.push({ t: t0 + u.dur + u.asrMs + u.nmtMs + 150, type: 'tts_start', en: u.en, dur: ttsDur });
    ev.push({ t: t0 + u.dur + u.asrMs + u.nmtMs + 150 + ttsDur, type: 'tts_end' });
    return t0 + u.dur + u.asrMs + u.nmtMs + 400;
  }

  function linePoints(x0, y0, x1, y1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
    return pts;
  }
  function circlePath(cx, cy, r) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.15]);
    }
    return pts;
  }

  /* ─── 스케줄러 ───
     setInterval + performance.now 델타 기반 가상 시간.
     (rAF 는 백그라운드 탭/헤드리스에서 멈추므로 타이머 사용) */
  const TICK_MS = 33;
  let script = [];
  let fired = 0;
  let vtime = 0;
  let lastReal = null;
  let playing = false;
  let speed = 1;
  let timer = null;
  let subId = null;          // 현재 발화의 자막 id
  let animTimers = [];       // 커서/판서 리플레이용 보조 인터벌들

  function tick() {
    if (!playing) return;
    const now = performance.now();
    if (lastReal === null) lastReal = now;
    vtime += Math.max(0, now - lastReal) * speed;
    lastReal = now;
    while (fired < script.length && script[fired].t <= vtime) {
      try { handle(script[fired]); } catch (err) { /* 직접 조작과 겹쳐도 시연은 계속 */ }
      fired++;
    }
    if (fired >= script.length) stop(false);
  }

  function handle(e) {
    const store = B.store, actions = B.actions;
    switch (e.type) {
      case 'phase': B.setPhase(e.text); break;
      case 'goto_lecturer':
        // 수강자 탭에서 시청 중이면 (autoplay-student) 뷰를 뺏지 않는다
        if (document.body.getAttribute('data-view') !== 'student') B.setView('lecturer');
        B.togglePip(true);
        break;
      case 'upload': B.lecturer.simulateUpload(4200 / speed); break;
      case 'mic_on': store.set({ isMicOn: true }); break;
      case 'lecture_start': store.set({ isLectureStarted: true, isPaused: false, isLectureEnded: false }); break;
      case 'vad': store.set({ vadActive: e.on }); break;
      case 'asr_partial': store.set({ activePartial: e.text }); break;
      case 'asr_final': subId = actions.addSubtitle(e.ko, e.asrMs); break;
      case 'nmt': if (subId != null) actions.setTranslation(subId, e.en, e.nmtMs); break;
      case 'tts_start':
        store.set({ ttsPlayingId: subId });
        B.tts.speak(e.en);
        break;
      case 'tts_end': store.set({ ttsPlayingId: null }); break;
      case 'page': actions.goPage(e.page); break;
      case 'chat':
        actions.addChat(e.sender, e.name || store.get().lecturerName || '교수', e.text);
        break;
      case 'cursor_on': store.set({ spotlightEnabled: true, spotlightColor: '#F472B6' }); break;
      case 'cursor_off': store.set({ spotlightEnabled: false, cursorPos: null }); break;
      case 'cursor_path': replayCursor(e.path, e.dur / speed); break;
      case 'draw': replayDraw(e, e.dur / speed); break;
      case 'connection': store.set({ connectionQuality: e.quality }); break;
      case 'pause': store.set({ isPaused: true }); break;
      case 'resume': store.set({ isPaused: false }); break;
      case 'lecture_end': B.lecturer.endLecture(); break;
      case 'done':
        B.setPhase('데모 종료 — ⟲ 리셋 후 다시 재생하거나 직접 조작해보세요');
        break;
    }
  }

  // 커서 좌표를 dur 동안 경로를 따라 이동
  function replayCursor(path, dur) {
    let t0 = null;
    const id = setInterval(function () {
      if (!playing) { clearInterval(id); return; }
      const now = performance.now();
      if (t0 === null) t0 = now;
      const frac = Math.min(1, (now - t0) / dur);
      const idx = Math.min(path.length - 1, Math.floor(frac * (path.length - 1)));
      B.store.set({ cursorPos: { x: path[idx][0], y: path[idx][1] } });
      if (frac >= 1) clearInterval(id);
    }, TICK_MS);
    animTimers.push(id);
  }

  // 판서 스트로크를 dur 동안 점진적으로 그린 뒤 store에 확정
  function replayDraw(e, dur) {
    const store = B.store;
    const page = store.get().currentPage;
    const canvas = document.getElementById('lect-canvas');
    let t0 = null;
    const id = setInterval(function () {
      if (!playing) { clearInterval(id); return; }
      const now = performance.now();
      if (t0 === null) t0 = now;
      const frac = Math.min(1, (now - t0) / dur);
      const n = Math.max(2, Math.ceil(e.points.length * frac));
      const partial = e.points.slice(0, n);
      const s = store.get();
      if (s.currentPage === page && s.slideStatus === 'ready') {
        B.draw.render(canvas, s.strokes[page], partial, e.tool, e.color);
      }
      if (frac >= 1) {
        clearInterval(id);
        B.actions.addStroke(page, { tool: e.tool, color: e.color, points: e.points });
      }
    }, TICK_MS);
    animTimers.push(id);
  }

  /* ─── 공개 API ─── */
  function play() {
    if (playing) { pause(); return; }
    if (fired >= script.length || script.length === 0) reset(true);
    playing = true;
    lastReal = null;
    timer = setInterval(tick, TICK_MS);
    B.onScenarioState(true);
  }
  function pause() {
    playing = false;
    if (timer) clearInterval(timer);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    B.onScenarioState(false);
    B.setPhase('일시정지됨 — ▶ 를 눌러 계속');
  }
  function stop(resetPhase) {
    playing = false;
    if (timer) clearInterval(timer);
    animTimers.forEach(clearInterval);
    animTimers = [];
    B.onScenarioState(false);
    if (resetPhase) B.setPhase('데모 준비 완료 — ▶ 를 누르면 강의 시뮬레이션이 시작됩니다 (시연 중 클릭하면 직접 조작)');
  }
  function reset(silent) {
    stop(false);
    script = buildScript();
    fired = 0; vtime = 0; subId = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    B.store.reset();
    // 업로드 UI 원복
    const dz = document.getElementById('upload-dropzone');
    const up = document.getElementById('upload-progress');
    if (dz) dz.classList.remove('hidden');
    if (up) up.classList.add('hidden');
    if (!silent) B.setPhase('리셋 완료 — ▶ 를 누르면 처음부터 재생됩니다');
  }
  function setSpeed(v) { speed = v; }

  B.scenario = { play: play, pause: pause, reset: reset, setSpeed: setSpeed, isPlaying: function () { return playing; } };

  /* ─── TTS (선택적 speechSynthesis) ─── */
  let ttsEnabled = false;
  B.tts = {
    speak(text) {
      if (!ttsEnabled || !('speechSynthesis' in window)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = Math.min(2, 1.1 * speed);
        window.speechSynthesis.speak(u);
      } catch (err) { /* 미지원 환경 — 조용히 무시 */ }
    },
    setEnabled(v) {
      ttsEnabled = v;
      if (!v && window.speechSynthesis) window.speechSynthesis.cancel();
    },
    isEnabled() { return ttsEnabled; },
  };
})();
