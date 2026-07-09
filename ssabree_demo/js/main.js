/* ============================================================
   SSABREE 데모 — 부트스트랩
   폰 2대 생성, 스토어 구독, 데모 스트립, 테마, 스테이지 스케일링.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;
  var $ = function (id) { return document.getElementById(id); };

  /* ─── 폰 생성 ─── */
  var p1 = new S.Phone($('phone1-wrap'), 'u1', 'splash');
  var p2 = new S.Phone($('phone2-wrap'), 'u2', 'home');
  S.phone1 = p1;
  S.phone2 = p2;
  S.phoneOf = function (userId) { return userId === 'u1' ? p1 : p2; };

  /* 상태바 아이콘 + 시계 */
  document.querySelectorAll('[data-sbicons]').forEach(function (el) {
    el.innerHTML = S.statusIcons();
  });
  function tickClock() {
    var d = new Date();
    var t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = t; });
  }
  tickClock();
  setInterval(tickClock, 20000);

  /* 데모 스트립 로고 */
  var brand = document.querySelector('[data-strip-logo]');
  brand.innerHTML = S.logo(22) + '<span>싸브리타임 데모</span>';

  /* ─── 스토어 구독: 두 폰 리렌더 + 폰2 표시 + 헤드업 ─── */
  var stage = $('stage');
  S.store.subscribe(function (state, keys) {
    if (keys.has('phone2Visible')) {
      stage.classList.toggle('dual', state.phone2Visible);
      fitStage();
    }
    if (keys.has('headsUp')) {
      p1.renderHeadsUp(state.headsUp.u1);
      p2.renderHeadsUp(state.headsUp.u2);
      if (keys.size === 1) return;   /* 헤드업만 갱신 시 화면 리렌더 생략 */
    }
    p1.render();
    if (state.phone2Visible) p2.render();
  });

  /* ─── 토스트 ─── */
  var toastTimer = null;
  S.toast = function (msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 2600);
  };

  /* ─── 데모 스트립 ─── */
  S.setPhase = function (text) { $('demo-phase').textContent = text; };
  S.onScenarioState = function (playing) {
    var btn = $('demo-play');
    btn.textContent = playing ? '⏸ 일시정지' : '▶ 데모 시작';
    btn.classList.toggle('playing', playing);
  };
  S.onScenarioDone = function () { /* 종료 시각 훅 (필요 시 확장) */ };

  $('demo-play').addEventListener('click', function () { S.scenario.play(); });
  $('demo-reset').addEventListener('click', function () { S.scenario.reset(); });

  var SPEEDS = [1, 2, 0.5];
  var speedIdx = 0;
  $('demo-speed').addEventListener('click', function () {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    S.scenario.setSpeed(SPEEDS[speedIdx]);
    $('demo-speed').textContent = SPEEDS[speedIdx] + 'x';
  });

  /* 라이트/다크 토글 */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('demo-theme').textContent = theme === 'dark' ? '☀️ 라이트' : '🌙 다크';
  }
  $('demo-theme').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* 폰 2대 수동 토글 */
  $('demo-dual').addEventListener('click', function () {
    S.actions.setPhone2(!S.store.get().phone2Visible);
  });

  /* ─── 자동 시연 중 직접 조작 → 자동 일시정지 ───
     시나리오의 typeInto 가 합성하는 이벤트는 isTrusted=false 라 걸러지고,
     데모 스트립(재생/리셋/배속 등)은 시연 컨트롤이므로 제외 */
  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!e.isTrusted || !S.scenario.isPlaying()) return;
      if (e.target.closest && e.target.closest('.demo-strip')) return;
      S.scenario.pause();
      S.setPhase('직접 조작 모드 — 시연을 일시정지했습니다. 자유롭게 조작한 뒤 ▶ 를 누르면 이어서 재생됩니다');
    }, true);
  });

  /* ─── 스테이지 스케일링 ─── */
  function fitStage() {
    var outer = document.querySelector('.stage-outer');
    var availW = outer.clientWidth - 48;
    var availH = outer.clientHeight - 32;
    var dual = stage.classList.contains('dual');
    var natW = dual ? (380 * 2 + 44) : 380;
    var natH = 800 + 34;   /* 폰 + 라벨 */
    var scale = Math.min(1, availW / natW, availH / natH);
    stage.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fitStage);

  /* ─── 부트 ─── */
  S.scenario.reset(true);   /* 스크립트 빌드 + 스토어 리셋 + 폰 초기 라우트 */
  p1.render();
  p2.render();
  fitStage();
  S.setPhase('데모 준비 완료 — ▶ 를 누르면 전체 기능 시연이 시작됩니다 (시연 중 폰을 클릭하면 직접 조작)');

  /* URL 해시 옵션 (+ 로 조합): #autoplay #dark #dual */
  var tokens = (location.hash || '').replace('#', '').split('+').filter(Boolean);
  if (tokens.indexOf('dark') !== -1) setTheme('dark');
  if (tokens.indexOf('dual') !== -1) S.actions.setPhone2(true);
  if (tokens.indexOf('autoplay') !== -1) S.scenario.play();
})();
