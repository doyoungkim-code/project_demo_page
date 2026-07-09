/* ============================================================
   BUNMIN 데모 — 부트스트랩
   뷰 라우터, 테마 사이클, 데모 컨트롤 스트립, 토스트, 모달.
   ============================================================ */
(function () {
  'use strict';
  const B = window.BUNMIN;

  const $ = function (id) { return document.getElementById(id); };

  /* ─── 뷰 라우터 ─── */
  let pipEnabled = false;

  B.setView = function (view) {
    document.body.setAttribute('data-view', view);
    ['start', 'lecturer', 'student'].forEach(function (v) {
      $('view-' + v).classList.toggle('hidden', v !== view);
    });
    document.querySelectorAll('.demo-tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === view);
    });
    updatePipVisibility();
    // 캔버스는 뷰가 보여야 크기를 잡을 수 있으므로 전환 직후 리사이즈 렌더 트리거
    requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
    });
  };

  /* ─── PiP (수강자 미리보기) — 강의자 탭에서만 표시 ─── */
  B.togglePip = function (on) {
    pipEnabled = on != null ? on : !pipEnabled;
    $('demo-pip').style.opacity = pipEnabled ? '1' : '0.6';
    updatePipVisibility();
  };
  function updatePipVisibility() {
    const view = document.body.getAttribute('data-view');
    $('pip').classList.toggle('hidden', !(pipEnabled && view === 'lecturer'));
  }

  /* ─── 테마 사이클 (light → dark → gradient) ─── */
  const THEMES = ['light', 'dark', 'gradient'];
  function cycleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    document.documentElement.setAttribute('data-theme', next);
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.querySelector('.icon-sun').classList.toggle('hidden', next !== 'light');
      btn.querySelector('.icon-moon').classList.toggle('hidden', next !== 'dark');
      btn.querySelector('.icon-sparkles').classList.toggle('hidden', next !== 'gradient');
    });
  }
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', cycleTheme);
  });

  /* ─── 토스트 ─── */
  let toastTimer = null;
  B.toast = function (msg, kind) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast' + (kind === 'warn' ? ' warn' : '');
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 2600);
  };

  /* ─── 모달 ─── */
  B.openModal = function (id) { $(id).classList.remove('hidden'); };
  B.closeModal = function (id) { $(id).classList.add('hidden'); };
  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { B.closeModal(btn.getAttribute('data-close')); });
  });
  document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(function (m) {
      m.classList.add('hidden');
    });
  });

  /* ─── 데모 컨트롤 스트립 ─── */
  document.querySelectorAll('.demo-tabs button').forEach(function (b) {
    b.addEventListener('click', function () { B.setView(b.getAttribute('data-view')); });
  });

  B.setPhase = function (text) { $('demo-phase').textContent = text; };
  B.onScenarioState = function (playing) {
    const btn = $('demo-play');
    btn.textContent = playing ? '⏸ 일시정지' : '▶ 데모 시작';
    btn.classList.toggle('playing', playing);
  };

  $('demo-play').addEventListener('click', function () { B.scenario.play(); });
  $('demo-reset').addEventListener('click', function () { B.scenario.reset(); });

  const SPEEDS = [1, 2, 0.5];
  let speedIdx = 0;
  $('demo-speed').addEventListener('click', function () {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    B.scenario.setSpeed(SPEEDS[speedIdx]);
    $('demo-speed').textContent = SPEEDS[speedIdx] + 'x';
  });

  $('demo-tts').addEventListener('click', function () {
    const next = !B.tts.isEnabled();
    B.tts.setEnabled(next);
    const btn = $('demo-tts');
    btn.textContent = next ? '🔊 TTS' : '🔇 TTS';
    btn.classList.toggle('muted', !next);
    if (next) B.toast('영어 TTS 소리가 켜졌습니다 (브라우저 음성 합성 사용)');
  });

  $('demo-pip').addEventListener('click', function () { B.togglePip(); });

  /* ─── 자동 시연 중 직접 조작 → 자동 일시정지 ───
     시나리오가 합성하는 이벤트는 isTrusted=false 라 걸러지고,
     데모 스트립(재생/리셋/배속 등)은 시연 컨트롤이므로 제외 */
  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!e.isTrusted || !B.scenario.isPlaying()) return;
      if (e.target.closest && e.target.closest('.demo-strip')) return;
      B.scenario.pause();
      B.setPhase('직접 조작 모드 — 시연을 일시정지했습니다. 자유롭게 조작한 뒤 ▶ 를 누르면 이어서 재생됩니다');
    }, true);
  });

  /* ─── 부트 ─── */
  B.scenario.reset(true);       // 스크립트 빌드 + 초기 상태
  B.store.reset();              // 전체 키로 첫 렌더 트리거

  // URL 해시로 초기 뷰/테마/자동재생 지정 (+ 로 조합):
  //   #lecturer  #student  #dark  #gradient  #autoplay  #autoplay-student
  //   예) index.html#student+dark  /  index.html#autoplay+gradient
  const tokens = (location.hash || '').replace('#', '').split('+').filter(Boolean);
  let bootView = 'start';
  tokens.forEach(function (tk) {
    if (tk === 'lecturer' || tk === 'student') bootView = tk;
    if (tk === 'dark' || tk === 'gradient') {
      // light → 목표 테마까지 사이클
      while (document.documentElement.getAttribute('data-theme') !== tk) cycleTheme();
    }
  });
  B.setView(bootView);
  B.setPhase('데모 준비 완료 — ▶ 를 누르면 강의 시뮬레이션이 시작됩니다 (시연 중 클릭하면 직접 조작)');
  if (tokens.indexOf('autoplay') !== -1) { B.setView('lecturer'); B.scenario.play(); }
  if (tokens.indexOf('autoplay-student') !== -1) { B.setView('student'); B.scenario.play(); }
})();
