/* ============================================================
   BUNMIN 데모 — 강의자 뷰 (Lecturer.tsx)
   마이크/레벨미터, 강의 상태 머신, 슬라이드 업로드 시뮬레이션,
   페이지 내비, 판서 캔버스, 커서 스팟라이트, 모달, 채팅.
   ============================================================ */
(function () {
  'use strict';
  const B = window.BUNMIN;
  const store = B.store;
  const actions = B.actions;

  const $ = function (id) { return document.getElementById(id); };

  /* ─── 공용 판서 렌더러 (수강자/PiP 캔버스도 사용) ─── */
  B.draw = {
    render(canvas, strokes, livePoints, liveTool, liveColor) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      function paint(stroke) {
        const pts = stroke.points;
        if (!pts || pts.length < 2) return;
        ctx.save();
        ctx.lineJoin = 'round';
        if (stroke.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = w * 0.044;
          ctx.lineCap = 'round';
        } else if (stroke.tool === 'highlighter') {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = w * 0.018;
          ctx.lineCap = 'butt';
        } else {
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = w * 0.004;
          ctx.lineCap = 'round';
        }
        if (stroke.tool === 'rect') {
          const a = pts[0], b = pts[pts.length - 1];
          ctx.strokeRect(a[0] * w, a[1] * h, (b[0] - a[0]) * w, (b[1] - a[1]) * h);
        } else {
          ctx.beginPath();
          ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
          ctx.stroke();
        }
        ctx.restore();
      }
      (strokes || []).forEach(paint);
      if (livePoints && livePoints.length > 1) paint({ tool: liveTool, color: liveColor, points: livePoints });
    },
    fit(canvas) {
      const box = canvas.parentElement.getBoundingClientRect();
      if (box.width > 0) { canvas.width = box.width; canvas.height = box.height; }
    },
  };

  /* ─── 마이크 + 레벨 미터 ─── */
  const micBtn = $('mic-btn');
  micBtn.addEventListener('click', function () {
    store.set({ isMicOn: !store.get().isMicOn });
  });

  $('gain-slider').addEventListener('input', function (e) {
    store.set({ micGainPct: Number(e.target.value) });
    $('gain-pct').textContent = e.target.value + '%';
  });

  // 가짜 오디오 레벨 rAF 루프 — vadActive(발화 중)면 말소리 파형, 아니면 저레벨 노이즈
  let peakPct = 0, peakHold = 0, levelPhase = 0;
  (function levelLoop() {
    requestAnimationFrame(levelLoop);
    const s = store.get();
    const unlit = $('level-unlit'), dbEl = $('level-db'), peakEl = $('level-peak');
    if (!s.isMicOn) {
      unlit.style.width = '100%';
      dbEl.textContent = '—';
      dbEl.className = 'level-db';
      peakEl.style.left = '0%';
      peakPct = 0;
      return;
    }
    levelPhase += 0.13;
    let db;
    if (s.vadActive) {
      db = -19 + Math.sin(levelPhase) * 4 + Math.sin(levelPhase * 2.7) * 3 + (Math.random() - 0.5) * 4;
    } else {
      db = -48 + Math.sin(levelPhase * 0.6) * 3 + (Math.random() - 0.5) * 3;
    }
    db = db * (100 / Math.max(1, s.micGainPct)) * (s.micGainPct / 100); // 게인 반영(표시용)
    db = Math.min(0, db + (s.micGainPct - 100) * 0.06);
    const pct = Math.max(0, Math.min(100, (db + 60) / 60 * 100));
    unlit.style.width = (100 - pct) + '%';
    if (pct >= peakPct) { peakPct = pct; peakHold = 30; }
    else if (--peakHold <= 0) { peakPct = Math.max(0, peakPct - 0.6); }
    peakEl.style.left = peakPct + '%';
    dbEl.textContent = db.toFixed(1) + ' dB';
    dbEl.className = 'level-db' + (db >= -6 ? ' warn' : (db >= -20 && db <= -15 ? ' good' : ''));
  })();

  /* ─── 슬라이드 업로드 시뮬레이션 ─── */
  const STAGES = [
    { key: 'pending', label: '준비 중', until: 5 },
    { key: 'ocr', label: '텍스트 인식', until: 45 },
    { key: 'translate', label: '번역', until: 85 },
    { key: 'bundling', label: 'PDF 생성', until: 100 },
  ];
  let uploadTimer = null;

  function simulateUpload(durationMs, onDone) {
    if (store.get().slideStatus !== 'none') return;
    durationMs = durationMs || 4500;
    store.set({ slideStatus: 'uploading' });
    $('upload-dropzone').classList.add('hidden');
    $('upload-progress').classList.remove('hidden');
    let t0 = null;
    uploadTimer = setInterval(function () {
      // 진행 중 리셋/취소되면 (slideStatus가 uploading이 아니게 됨) 조용히 종료
      if (store.get().slideStatus !== 'uploading') {
        clearInterval(uploadTimer);
        uploadTimer = null;
        return;
      }
      const now = performance.now();
      if (t0 === null) t0 = now;
      const raw = Math.min(1, (now - t0) / durationMs);
      const pct = Math.round(raw * 100);
      const stage = STAGES.find(function (st) { return pct <= st.until; }) || STAGES[STAGES.length - 1];
      const remain = Math.max(0, Math.ceil((durationMs - (now - t0)) / 1000));
      $('upload-stage-text').textContent = stage.label + ' ' + pct + '% · 약 ' + remain + '초 남음';
      $('upload-progress-bar').style.width = pct + '%';
      if (raw < 1) return;
      clearInterval(uploadTimer);
      uploadTimer = null;
      finishUpload();
      if (onDone) onDone();
    }, 50);
  }

  function finishUpload() {
    store.set({
      slideStatus: 'ready',
      totalPages: B.slides.pages.length,
      currentPage: 1,
      slideFileName: '7주차_이진탐색트리.pdf',
      slideTitle: $('lect-title-input').value || '자료구조 7주차 — 이진 탐색 트리',
    });
    B.toast('슬라이드 번역 완료 — 5페이지 준비됨');
  }
  B.lecturer = { simulateUpload: simulateUpload };

  $('upload-dropzone').addEventListener('click', function () { simulateUpload(); });
  $('library-item-1').addEventListener('click', function () {
    // 라이브러리에서 즉시 로드 (이미 번역된 자료)
    if (store.get().slideStatus !== 'none') return;
    finishUpload();
  });
  $('upload-cancel').addEventListener('click', function () {
    if (uploadTimer) clearInterval(uploadTimer);
    uploadTimer = null;
    store.set({ slideStatus: 'none' });
    $('upload-dropzone').classList.remove('hidden');
    $('upload-progress').classList.add('hidden');
  });
  $('lect-change-material').addEventListener('click', function () {
    if (store.get().isLectureStarted) {
      B.toast('데모에서는 강의 중 자료 변경을 지원하지 않습니다', 'warn');
      return;
    }
    store.set({ slideStatus: 'none', totalPages: 0, currentPage: 1, strokes: {}, strokesVersion: store.get().strokesVersion + 1 });
    $('upload-dropzone').classList.remove('hidden');
    $('upload-progress').classList.add('hidden');
  });

  /* ─── 모드 토글 (강의자료/화면공유) ─── */
  $('lect-mode-toggle').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    store.set({ presentationMode: btn.getAttribute('data-mode') });
  });

  /* ─── 화면공유 ─── */
  $('lect-screen-start').addEventListener('click', function () {
    if (!store.get().isLectureStarted) {
      const tip = $('lect-screen-tooltip');
      tip.classList.remove('hidden');
      setTimeout(function () { tip.classList.add('hidden'); }, 2200);
      return;
    }
    B.openModal('modal-screenpicker');
  });
  $('picker-share-btn').addEventListener('click', function () {
    B.closeModal('modal-screenpicker');
    store.set({ isScreenSharing: true });
  });
  $('lect-screen-stop').addEventListener('click', function () {
    store.set({ isScreenSharing: false, presentationMode: 'slide' });
  });

  /* ─── 페이지 내비게이션 ─── */
  $('lect-prev').addEventListener('click', function () { actions.goPage(store.get().currentPage - 1); });
  $('lect-next').addEventListener('click', function () { actions.goPage(store.get().currentPage + 1); });
  document.addEventListener('keydown', function (e) {
    if (document.body.getAttribute('data-view') !== 'lecturer') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      actions.goPage(store.get().currentPage - 1);
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      actions.goPage(store.get().currentPage + 1);
    }
  });

  /* ─── 원본/번역 토글 (강의자 스테이지) ─── */
  $('lect-material-toggle').addEventListener('click', function () {
    const cur = store.get().lecturerMaterialMode;
    store.set({ lecturerMaterialMode: cur === 'original' ? 'translated' : 'original' });
  });

  /* ─── 강의 시작/일시정지/종료 ─── */
  $('lect-start-btn').addEventListener('click', function () {
    if (store.get().slideStatus !== 'ready') return;
    store.set({ isLectureStarted: true, isPaused: false, isLectureEnded: false });
    B.setPhase('강의 진행 중 — 마이크로 말하면 자막이 생성됩니다');
  });
  $('lect-pause-btn').addEventListener('click', function () {
    store.set({ isPaused: !store.get().isPaused });
  });
  $('lect-end-btn').addEventListener('click', function () {
    $('lect-end-confirm').classList.toggle('hidden');
  });
  $('lect-end-confirm-btn').addEventListener('click', function () {
    $('lect-end-confirm').classList.add('hidden');
    endLecture();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#lect-end-wrap')) $('lect-end-confirm').classList.add('hidden');
  });

  function endLecture() {
    store.set({ isLectureStarted: false, isPaused: false, isLectureEnded: true, isMicOn: false, vadActive: false, isScreenSharing: false });
    $('transcript-modal-title').textContent = '강의 자막 저장';
    $('transcript-modal-body').textContent = '강의 중 인식된 자막을 파일로 다운로드합니다.';
    B.openModal('modal-transcript');
    B.setPhase('강의 종료 — 자막 TXT/SRT 다운로드 가능 (수강자도 동일)');
  }
  B.lecturer.endLecture = endLecture;

  /* ─── 헤더: 링크 복사 / 용어집 / 참가자 / 나가기 ─── */
  $('lect-copy-link').addEventListener('click', function () {
    const btn = $('lect-copy-link');
    const url = 'http://192.168.0.12:48000/';
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
    btn.classList.add('copied');
    btn.querySelector('span').textContent = '복사됨';
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.querySelector('span').textContent = '링크 복사';
    }, 1800);
    B.toast('학생 접속 링크가 복사되었습니다: ' + url);
  });
  $('lect-glossary-btn').addEventListener('click', function () { B.openModal('modal-glossary'); });
  $('lect-participants-btn').addEventListener('click', function () {
    $('lect-participants').classList.toggle('hidden');
    $('lect-participants-btn').classList.toggle('active');
  });
  document.querySelector('#lect-participants .participants-close').addEventListener('click', function () {
    $('lect-participants').classList.add('hidden');
    $('lect-participants-btn').classList.remove('active');
  });
  $('lect-exit-btn').addEventListener('click', function () { B.setView('start'); });
  $('lect-name-input').addEventListener('change', function (e) {
    store.set({ lecturerName: e.target.value.trim() || '교수' });
  });

  /* ─── 커서 스팟라이트 ─── */
  $('spotlight-toggle').addEventListener('click', function () {
    store.set({ spotlightEnabled: !store.get().spotlightEnabled });
  });
  $('spotlight-swatches').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-color]');
    if (!btn) return;
    store.set({ spotlightColor: btn.getAttribute('data-color'), spotlightEnabled: true });
  });

  const lectStage = $('lect-stage');
  lectStage.addEventListener('pointermove', function (e) {
    const s = store.get();
    if (!s.spotlightEnabled || s.isPaused) return;
    const box = lectStage.getBoundingClientRect();
    store.set({ cursorPos: { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height } });
  });
  lectStage.addEventListener('pointerleave', function () {
    if (store.get().spotlightEnabled) store.set({ cursorPos: null });
  });

  /* ─── 판서 ─── */
  const canvas = $('lect-canvas');
  let drawing = false, livePoints = [];

  $('draw-toggle').addEventListener('click', function () {
    store.set({ drawEnabled: !store.get().drawEnabled });
  });
  $('draw-tools').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-tool]');
    if (!btn) return;
    const tool = btn.getAttribute('data-tool');
    if (tool === 'clear') {
      actions.clearStrokes(store.get().currentPage);
      return;
    }
    store.set({ drawTool: tool, drawEnabled: true });
  });
  $('draw-swatches').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-color]');
    if (!btn) return;
    store.set({ drawColor: btn.getAttribute('data-color') });
    $('draw-color-custom').value = btn.getAttribute('data-color');
  });
  $('draw-color-custom').addEventListener('input', function (e) {
    store.set({ drawColor: e.target.value });
  });

  function canvasPos(e) {
    const box = canvas.getBoundingClientRect();
    return [(e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height];
  }
  canvas.addEventListener('pointerdown', function (e) {
    const s = store.get();
    if (!s.drawEnabled || s.slideStatus !== 'ready') return;
    drawing = true;
    livePoints = [canvasPos(e)];
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    livePoints.push(canvasPos(e));
    const s = store.get();
    B.draw.render(canvas, s.strokes[s.currentPage], livePoints, s.drawTool, s.drawColor);
  });
  canvas.addEventListener('pointerup', function () {
    if (!drawing) return;
    drawing = false;
    const s = store.get();
    if (livePoints.length > 1) {
      actions.addStroke(s.currentPage, { tool: s.drawTool, color: s.drawColor, points: livePoints });
    }
    livePoints = [];
  });

  /* ─── 자료 다운로드 (SVG를 파일로) ─── */
  function downloadSlide(mode) {
    const s = store.get();
    if (s.slideStatus !== 'ready') return;
    const page = B.slides.pages[s.currentPage - 1];
    const a = document.createElement('a');
    a.href = mode === 'original' ? page.koUrl : page.enUrl;
    a.download = (s.slideFileName || 'slide').replace('.pdf', '') + '_p' + s.currentPage + '_' + mode + '.svg';
    a.click();
  }
  $('dl-original').addEventListener('click', function () { downloadSlide('original'); });
  $('dl-translated').addEventListener('click', function () { downloadSlide('translated'); });

  /* ─── TXT / SRT 다운로드 ─── */
  function downloadTranscript(format) {
    const subs = store.get().subtitles;
    if (!subs.length) { B.toast('저장할 자막이 없습니다', 'warn'); return; }
    let content = '';
    if (format === 'txt') {
      content = subs.map(function (s) {
        return '[' + s.timestamp + ']\n[한] ' + s.original + '\n[EN] ' + (s.translated || '-') + '\n';
      }).join('\n');
    } else {
      content = subs.map(function (s, i) {
        const t0 = i * 4, t1 = t0 + 3.5;
        function fmt(sec) {
          const h = String(Math.floor(sec / 3600)).padStart(2, '0');
          const m = String(Math.floor(sec % 3600 / 60)).padStart(2, '0');
          const ss = String(Math.floor(sec % 60)).padStart(2, '0');
          const ms = String(Math.round(sec % 1 * 1000)).padStart(3, '0');
          return h + ':' + m + ':' + ss + ',' + ms;
        }
        return (i + 1) + '\n' + fmt(t0) + ' --> ' + fmt(t1) + '\n' + (s.translated || s.original) + '\n';
      }).join('\n');
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lecture_transcript.' + format;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  $('dl-txt').addEventListener('click', function () { downloadTranscript('txt'); });
  $('dl-srt').addEventListener('click', function () { downloadTranscript('srt'); });

  /* ─── 용어집 ─── */
  $('glossary-add-btn').addEventListener('click', function () {
    $('glossary-add-form').classList.toggle('hidden');
  });
  $('glossary-cancel').addEventListener('click', function () {
    $('glossary-add-form').classList.add('hidden');
  });
  $('glossary-save').addEventListener('click', function () {
    const ko = $('glossary-new-ko').value.trim();
    const en = $('glossary-new-en').value.trim();
    const cat = $('glossary-new-cat').value.trim() || '기타';
    if (!ko || !en) { B.toast('한글/영어를 모두 입력하세요', 'warn'); return; }
    const tr = document.createElement('tr');
    tr.innerHTML = '<td></td><td></td><td></td><td><button class="glossary-del" type="button">삭제</button></td>';
    tr.children[0].textContent = ko;
    tr.children[1].textContent = en;
    tr.children[2].textContent = cat;
    $('glossary-tbody').appendChild(tr);
    $('glossary-new-ko').value = ''; $('glossary-new-en').value = '';
    $('glossary-add-form').classList.add('hidden');
    updateGlossaryCount();
    filterGlossary();
  });
  document.getElementById('glossary-tbody').addEventListener('click', function (e) {
    if (!e.target.classList.contains('glossary-del')) return;
    e.target.closest('tr').remove();
    updateGlossaryCount();
  });
  function filterGlossary() {
    const q = $('glossary-search').value.trim().toLowerCase();
    const cat = $('glossary-category').value;
    document.querySelectorAll('#glossary-tbody tr').forEach(function (tr) {
      const rowCat = tr.children[2] ? tr.children[2].textContent.trim() : '';
      const okCat = cat === '전체' || rowCat === cat;
      const okText = !q || tr.textContent.toLowerCase().includes(q);
      tr.style.display = (okCat && okText) ? '' : 'none';
    });
  }
  $('glossary-search').addEventListener('input', filterGlossary);
  $('glossary-category').addEventListener('change', filterGlossary);
  function updateGlossaryCount() {
    $('glossary-count').textContent = '총 ' + document.querySelectorAll('#glossary-tbody tr').length + '개 용어';
  }

  /* ─── 렌더 (store → DOM) ─── */
  function render(s, keys) {
    const all = keys.size === 0 || keys.size > 20;
    const has = function (k) { return all || keys.has(k); };

    // 배지
    if (has('isLectureStarted') || has('isPaused')) {
      $('lect-badge-live').classList.toggle('hidden', !(s.isLectureStarted && !s.isPaused));
      $('lect-badge-paused').classList.toggle('hidden', !(s.isLectureStarted && s.isPaused));
    }

    // 마이크
    if (has('isMicOn')) {
      micBtn.classList.toggle('on', s.isMicOn);
      micBtn.querySelector('.mic-icon-on').classList.toggle('hidden', !s.isMicOn);
      micBtn.querySelector('.mic-icon-off').classList.toggle('hidden', s.isMicOn);
      const st = $('mic-status');
      st.textContent = s.isMicOn ? 'ON' : 'OFF';
      st.className = 'mic-status ' + (s.isMicOn ? 'on' : 'off');
    }

    // 스테이지 상태 전환
    if (has('presentationMode') || has('slideStatus') || has('isScreenSharing')) {
      const slideMode = s.presentationMode === 'slide';
      $('lect-placeholder').classList.toggle('hidden', !slideMode || s.slideStatus === 'ready');
      $('lect-stage').classList.toggle('hidden', !slideMode || s.slideStatus !== 'ready');
      $('lect-screen').classList.toggle('hidden', slideMode);
      $('lect-screen-idle').classList.toggle('hidden', s.isScreenSharing);
      $('lect-screen-live').classList.toggle('hidden', !s.isScreenSharing);
      document.querySelectorAll('#lect-mode-toggle button').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === s.presentationMode);
      });
      $('thumb-strip').classList.toggle('hidden', !(slideMode && s.slideStatus === 'ready'));
      if (slideMode && s.slideStatus === 'ready') requestAnimationFrame(function () { B.draw.fit(canvas); redrawCanvas(s); });
    }

    // 썸네일 + 슬라이드 이미지
    if (has('slideStatus') || has('currentPage') || has('lecturerMaterialMode')) {
      if (s.slideStatus === 'ready') {
        renderThumbs(s);
        const page = B.slides.pages[s.currentPage - 1];
        $('lect-slide-img').src = s.lecturerMaterialMode === 'original' ? page.koUrl : page.enUrl;
        document.querySelectorAll('#lect-material-toggle span').forEach(function (sp) {
          sp.classList.toggle('active', sp.getAttribute('data-mode') === s.lecturerMaterialMode);
        });
      }
    }

    // 하단 바
    if (has('slideStatus') || has('isLectureStarted') || has('isPaused') || has('isConnected')) {
      const canStart = s.isConnected && s.slideStatus === 'ready' && !s.isLectureStarted;
      $('lect-start-btn').disabled = !canStart;
      $('lect-start-btn').classList.toggle('hidden', s.isLectureStarted);
      $('lect-pause-btn').classList.toggle('hidden', !s.isLectureStarted);
      $('lect-end-wrap').classList.toggle('hidden', !s.isLectureStarted);
      $('lect-change-material').classList.toggle('hidden', s.slideStatus !== 'ready');
      const hint = $('lect-start-hint');
      if (s.isLectureStarted) { hint.textContent = ''; }
      else if (s.slideStatus === 'uploading') { hint.textContent = '슬라이드 처리 중...'; }
      else if (s.slideStatus !== 'ready') { hint.textContent = '슬라이드를 선택하거나 업로드하세요'; }
      else { hint.textContent = '준비 완료 — 강의를 시작하세요'; }
      const pauseBtn = $('lect-pause-btn');
      pauseBtn.textContent = s.isPaused ? '다시 시작' : '일시정지';
      pauseBtn.classList.toggle('resumed', s.isPaused);
      // 강의 중 사이드바 카드 공개
      $('card-spotlight').classList.toggle('hidden', !s.isLectureStarted);
      $('card-draw').classList.toggle('hidden', !s.isLectureStarted);
      $('lect-chat-card').classList.toggle('hidden', !s.isLectureStarted && s.chatMessages.length === 0);
      $('card-material').classList.toggle('hidden', s.slideStatus !== 'ready');
      $('card-transcript').classList.toggle('hidden', !s.isLectureStarted && s.subtitles.length === 0);
      $('mic-hint').textContent = s.isLectureStarted ? '음성이 실시간으로 번역됩니다' : '강의 시작 전 오디오 테스트';
    }

    // 스팟라이트
    if (has('spotlightEnabled') || has('spotlightColor')) {
      const t = $('spotlight-toggle');
      t.textContent = s.spotlightEnabled ? 'ON' : 'OFF';
      t.classList.toggle('on', s.spotlightEnabled);
      document.querySelectorAll('#spotlight-swatches button').forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-color') === s.spotlightColor);
      });
    }
    if (has('cursorPos') || has('spotlightEnabled') || has('spotlightColor')) {
      const el = $('lect-spotlight');
      if (s.spotlightEnabled && s.cursorPos) {
        el.classList.remove('hidden');
        el.style.left = (s.cursorPos.x * 100) + '%';
        el.style.top = (s.cursorPos.y * 100) + '%';
        applySpotlightColor(el, s.spotlightColor);
      } else {
        el.classList.add('hidden');
      }
    }

    // 판서
    if (has('drawEnabled') || has('drawTool') || has('drawColor')) {
      const t = $('draw-toggle');
      t.textContent = s.drawEnabled ? 'ON' : 'OFF';
      t.classList.toggle('on', s.drawEnabled);
      document.querySelectorAll('#draw-tools button[data-tool]').forEach(function (b) {
        b.classList.toggle('active', s.drawEnabled && b.getAttribute('data-tool') === s.drawTool);
      });
      document.querySelectorAll('#draw-swatches button').forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-color').toUpperCase() === s.drawColor.toUpperCase());
      });
      const isEraser = s.drawTool === 'eraser';
      $('draw-color-label').classList.toggle('dim', isEraser);
      $('draw-swatches').classList.toggle('dim', isEraser);
      $('draw-color-custom').classList.toggle('dim', isEraser);
      canvas.classList.toggle('active', s.drawEnabled && s.slideStatus === 'ready');
      canvas.classList.toggle('eraser', isEraser);
    }
    if (has('strokesVersion') || has('currentPage')) redrawCanvas(s);

    // CC 자막 오버레이 (강의자: 한국어 주 / 영어 보조)
    if (has('subtitles') || has('activePartial') || has('isLectureStarted')) {
      renderCC(s);
      renderTranscript(s);
    }

    // 채팅 / 참가자
    if (has('chatMessages')) renderChat(s);
    if (has('participants') || has('lecturerName')) renderParticipants(s);
    if (has('slideFileName')) $('material-filename').textContent = s.slideFileName || '';
  }

  function applySpotlightColor(el, color) {
    el.style.border = '2px solid ' + color;
    el.style.background = 'radial-gradient(circle, ' + color + '66 0%, ' + color + '22 50%, ' + color + '00 70%)';
    el.style.boxShadow = '0 0 20px ' + color + '88, inset 0 0 13px ' + color + '44';
  }
  B.applySpotlightColor = applySpotlightColor;

  function redrawCanvas(s) {
    if (s.slideStatus !== 'ready') return;
    B.draw.fit(canvas);
    B.draw.render(canvas, s.strokes[s.currentPage]);
  }

  function renderThumbs(s) {
    const strip = $('thumb-strip');
    if (strip.children.length !== s.totalPages) {
      strip.innerHTML = '';
      B.slides.pages.forEach(function (p) {
        const btn = document.createElement('button');
        btn.className = 'thumb-item';
        btn.type = 'button';
        const img = document.createElement('img');
        img.src = p.koUrl;
        img.alt = p.pageNumber + '페이지';
        const num = document.createElement('span');
        num.className = 'thumb-num';
        num.textContent = p.pageNumber;
        btn.appendChild(img); btn.appendChild(num);
        btn.addEventListener('click', function () { actions.goPage(p.pageNumber); });
        strip.appendChild(btn);
      });
    }
    Array.prototype.forEach.call(strip.children, function (el, i) {
      el.classList.toggle('active', i + 1 === s.currentPage);
    });
  }

  function renderCC(s) {
    const cc = $('lect-cc');
    if (!s.isLectureStarted) { cc.classList.add('hidden'); return; }
    const last = s.subtitles[s.subtitles.length - 1];
    const primary = cc.querySelector('.stage-subtitle-primary');
    const secondary = cc.querySelector('.stage-subtitle-secondary');
    if (s.activePartial) {
      cc.classList.remove('hidden');
      primary.innerHTML = '<span class="partial"></span>';
      primary.firstChild.textContent = s.activePartial + ' …';
      secondary.textContent = '';
    } else if (last) {
      cc.classList.remove('hidden');
      primary.textContent = last.original;
      secondary.textContent = last.translated || '';
    } else {
      cc.classList.add('hidden');
    }
  }

  function renderTranscript(s) {
    const list = $('lect-transcript');
    list.innerHTML = '';
    if (!s.subtitles.length) {
      list.innerHTML = '<p class="transcript-empty">자막이 여기에 표시됩니다</p>';
      return;
    }
    s.subtitles.slice(-3).forEach(function (sub) {
      const item = document.createElement('div');
      item.className = 'transcript-item';
      const ko = document.createElement('p');
      ko.className = 'transcript-ko';
      ko.innerHTML = '<span class="transcript-tag">[한]</span>';
      ko.appendChild(document.createTextNode(sub.original));
      item.appendChild(ko);
      if (sub.translated) {
        const en = document.createElement('p');
        en.className = 'transcript-en';
        en.innerHTML = '<span class="transcript-tag">[EN]</span>';
        en.appendChild(document.createTextNode(sub.translated));
        item.appendChild(en);
        const total = ((sub.asrMs || 0) + (sub.nmtMs || 0)) / 1000;
        const cls = total < 3 ? 'lat-good' : (total < 6 ? 'lat-mid' : 'lat-bad');
        const lat = document.createElement('p');
        lat.className = 'transcript-latency';
        lat.innerHTML = 'ASR ' + (sub.asrMs || 0) + 'ms · MT ' + (sub.nmtMs || 0) + 'ms · <span class="' + cls + '">전체 ' + total.toFixed(1) + 's</span>';
        item.appendChild(lat);
      } else {
        const pending = document.createElement('p');
        pending.className = 'transcript-pending';
        pending.textContent = '번역 중...';
        item.appendChild(pending);
      }
      list.appendChild(item);
    });
    list.scrollTop = list.scrollHeight;
  }

  /* 채팅/참가자 렌더는 강의자·수강자 공용 → BUNMIN에 공유 */
  function renderChat(s) {
    document.querySelectorAll('[data-chat-list]').forEach(function (list) {
      list.innerHTML = '';
      if (!s.chatMessages.length) {
        const empty = document.createElement('p');
        empty.className = 'chat-empty';
        empty.textContent = list.closest('#view-student') ? 'No messages yet' : '아직 채팅이 없습니다';
        list.appendChild(empty);
        return;
      }
      s.chatMessages.forEach(function (m) {
        const wrap = document.createElement('div');
        const name = document.createElement('p');
        name.className = 'chat-msg-name' + (m.sender === 'lecturer' ? ' lecturer' : '');
        const icon = m.sender === 'lecturer'
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
        name.innerHTML = icon;
        name.appendChild(document.createTextNode(m.name));
        if (m.sender === 'lecturer') {
          const tag = document.createElement('span');
          tag.className = 'chat-tag';
          tag.textContent = '강사';
          name.appendChild(tag);
        }
        const body = document.createElement('p');
        body.className = 'chat-msg-body';
        body.textContent = m.text;
        wrap.appendChild(name); wrap.appendChild(body);
        list.appendChild(wrap);
      });
      list.scrollTop = list.scrollHeight;
    });
  }

  function renderParticipants(s) {
    document.querySelectorAll('[data-participants-list]').forEach(function (list) {
      list.innerHTML = '';
      const lect = document.createElement('div');
      lect.className = 'participant-row';
      lect.innerHTML =
        '<span class="participant-avatar lecturer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg></span>' +
        '<span class="participant-name"></span><span class="participant-dot"></span>';
      lect.querySelector('.participant-name').textContent = s.lecturerName || '교수';
      list.appendChild(lect);
      const students = s.participants.concat([{ name: s.studentName, audioLang: 'en', me: true }]);
      students.forEach(function (p) {
        const row = document.createElement('div');
        row.className = 'participant-row';
        const av = document.createElement('span');
        av.className = 'participant-avatar';
        av.textContent = (p.name || 'G').charAt(0);
        const nm = document.createElement('span');
        nm.className = 'participant-name';
        nm.textContent = p.name || '게스트';
        const lang = document.createElement('span');
        lang.className = 'participant-lang';
        lang.textContent = p.audioLang === 'en' ? '번역' : '원본';
        nm.appendChild(lang);
        const dot = document.createElement('span');
        dot.className = 'participant-dot';
        row.appendChild(av); row.appendChild(nm); row.appendChild(dot);
        list.appendChild(row);
      });
    });
    document.querySelectorAll('.participant-count').forEach(function (el) {
      el.textContent = s.participants.length + 2;   /* 강의자 + 참가자들 + 나 */
    });
  }

  /* 채팅 폼 (강의자/수강자 공용 바인딩) */
  document.querySelectorAll('[data-chat-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const sender = form.getAttribute('data-sender');
      const s = store.get();
      actions.addChat(sender, sender === 'lecturer' ? (s.lecturerName || '교수') : s.studentName, text);
      input.value = '';
      // 수강자가 보내면 1.5초 후 강사 자동 응답 (그 사이 리셋되면 생략)
      if (sender === 'student') {
        setTimeout(function () {
          if (!store.get().chatMessages.length) return;
          actions.addChat('lecturer', store.get().lecturerName || '교수', '네, 확인했습니다. 좋은 질문이에요!');
        }, 1500);
      }
    });
  });

  store.subscribe(render);
  window.addEventListener('resize', function () { redrawCanvas(store.get()); });
})();
