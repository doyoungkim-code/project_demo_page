/* ============================================================
   SSABREE 데모 — 시나리오 엔진
   bunmin_demo/js/scenario.js 의 가상 시간 스케줄러 이식.
   수동 클릭과 동일한 공개 API(nav / handlers / actions)만 호출하므로
   일시정지 후 자유 조작 → 재개가 가능하다.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  /* ─── 타임라인 ─── */
  function buildScript() {
    var ev = [];
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    function phase(t, text) { at(t, function () { S.setPhase(text); }); }
    var p1 = function () { return S.phone1; };
    var p2 = function () { return S.phone2; };
    var A = S.actions;

    /* ① 앱 시작 */
    phase(0, '① 앱 시작 — 스플래시 & Mattermost 인증 로그인');
    at(100, function () { p1().nav('splash', {}, { replace: true, force: true }); });
    /* (스플래시가 2초 뒤 스스로 로그인으로 이동) */
    at(2600, function () { typeInto(p1(), 'email', 'doyoung@ssafy.com', 1200); });
    at(4100, function () { typeInto(p1(), 'pw', 'ssafy1234!', 900); });
    at(5300, function () { p1().flash('.login-btn'); });
    at(6000, function () { S.handlers['login-submit'](p1()); });

    /* ② 홈 대시보드 */
    phase(7200, '② 홈 대시보드 — 인사말 · D-Day · 모집 배너 · 식단 · 게시판');
    at(7500, function () { p1().flash('.dday-pill'); });
    at(9300, function () { p1().flash('#home-banners'); });
    at(11200, function () { p1().flash('#home-lunch'); });
    at(13700, function () { p1().flash('#home-boards'); });

    /* ③ 게시판 */
    phase(16000, '③ 게시판 — Hot 게시글 · 투표(Poll) · 좋아요 · 댓글/대댓글');
    at(16300, function () { p1().navTab('board'); });
    at(17500, function () { p1().flash('#chip-hot'); });
    at(18100, function () { S.handlers['board-hot'](p1()); });
    at(19500, function () { p1().nav('boardDetail', { id: 'p1' }); });
    at(20700, function () { p1().scrollTo('#poll-card'); });
    at(21500, function () { A.votePoll('p1', 0); });
    at(23000, function () { p1().flash('#btn-like'); });
    at(23400, function () { A.toggleLike('p1'); });
    at(24300, function () { p1().flash('#btn-scrap'); });
    at(24700, function () { A.toggleScrap('p1'); });
    at(25800, function () { typeInto(p1(), 'comment', '구미 1반도 참여 가능한가요?', 2000); });
    at(28400, function () { S.handlers['comment-send'](p1()); });
    at(30200, function () {
      /* 작성자의 대댓글이 실시간으로 달림 */
      var post = S.store.get().posts.find(function (p) { return p.id === 'p1'; });
      var last = post.comments[post.comments.length - 1];
      A.addReply('p1', last.id, '싸용자(작성자)', '네! 구미캠 전체 참여 가능합니다 :)');
    });
    at(32300, function () { p1().back(); });

    /* ④ AI 검열 */
    phase(34000, '④ AI 콘텐츠 검열 — 부적절한 글은 싸피봇(Gemini)이 블라인드');
    at(34300, function () { p1().flash('.fab'); });
    at(34900, function () { p1().nav('boardWrite'); });
    at(35900, function () { typeInto(p1(), 'wtitle', '오늘 알고리즘 문제 뭐냐 진짜', 1300); });
    at(37700, function () { typeInto(p1(), 'wbody', '아 진짜 짜증나네!! 이런 문제를 누가 풀라고 만든거야?? 출제자 바보 아니냐고!!', 2600); });
    at(41000, function () { p1().flash('#btn-submit'); });
    at(41600, function () { S.handlers['write-submit'](p1()); });
    at(43000, function () { confirmDialog(p1()); });   /* 등록 완료 → 목록 (2.6초 뒤 블라인드) */
    at(46600, function () {
      var blinded = S.store.get().posts.find(function (p) { return p.blinded; });
      if (blinded) p1().flash('#post-' + blinded.id);
    });

    /* ⑤ 그룹 매칭 */
    phase(48500, '⑤ 그룹 매칭 — 스터디 모집글 확인 후 포트폴리오와 함께 지원');
    at(48800, function () { p1().navTab('groupSelect'); });
    at(50000, function () { p1().flash('#sel-study'); });
    at(50600, function () { p1().nav('groupList', { kind: 'STUDY' }); });
    at(52100, function () { p1().flash('#grp-g1'); });
    at(52800, function () { p1().nav('groupDetail', { id: 'g1' }); });
    at(54300, function () { p1().scrollTo('.gd-desc'); });
    at(55700, function () { p1().flash('#btn-apply'); });
    at(56200, function () { S.handlers['grp-apply'](p1()); });
    at(57200, function () { typeInto(p1(), 'atitle', '열심히 하는 지원자입니다!', 1300); });
    at(58900, function () { typeInto(p1(), 'abody', '현재 solved.ac 골드3이고, SW 역량테스트를 대비 중입니다. 매주 화/목 모임 참여 가능합니다!', 2400); });
    at(61800, function () { typeInto(p1(), 'apos', '알고리즘', 600); });
    at(62800, function () { p1().flash('#btn-apply-submit'); });
    at(63300, function () { S.handlers['apply-submit'](p1()); });
    at(64700, function () { confirmDialog(p1()); });

    /* ⑥ 상대방 등장 — 리더의 수락 */
    phase(66000, '⑥ 실시간 수락 — 스터디장 박싸피의 폰에 FCM 푸시 도착');
    at(66200, function () { S.actions.setPhone2(true); });
    at(67800, function () { A.showHeadsUp('u2', { title: '새 지원자', body: '새로운 지원자가 있습니다.' }); });
    at(69800, function () { p2().navTab('myGroups'); });
    at(70600, function () { p2().flash('#mygrp-g1'); });
    at(71600, function () { p2().nav('myGroupDetail', { id: 'g1' }); });
    at(73000, function () { p2().flash('#btn-members'); });
    at(73600, function () { p2().nav('memberManage', { id: 'g1' }); });
    at(75000, function () { p2().flash('#btn-accept'); });
    at(75700, function () { S.handlers['mm-accept'](p2(), fakeEl({ 'data-uid': 'u1', 'data-name': '김도영' })); });
    at(77200, function () { confirmDialog(p2()); });   /* 수락 → 폰1에 헤드업 */

    /* ⑦ 실시간 쪽지 */
    phase(79500, '⑦ 실시간 쪽지 — WebSocket(STOMP) 채팅, 두 폰이 즉시 동기화');
    at(79800, function () { p1().navTab('chatList'); });
    at(81000, function () { p1().nav('chatRoom', { id: 'ch1' }); });
    at(82000, function () { p2().nav('chatRoom', { id: 'ch1' }); });
    at(83200, function () { A.sendChat('ch1', 'u2', '도영님 환영합니다! 🎉 스터디 합류 축하드려요'); });
    at(85600, function () { typeInto(p1(), 'chatmsg', '감사합니다! 열심히 하겠습니다 💪', 1800); });
    at(87900, function () { S.handlers['chat-send'](p1()); });
    at(89900, function () { A.sendChat('ch1', 'u2', '첫 모임은 목요일 저녁 7시, 구미캠 205호입니다'); });
    at(92400, function () { typeInto(p1(), 'chatmsg', '넵! 목요일에 뵙겠습니다 😀', 1500); });
    at(94300, function () { S.handlers['chat-send'](p1()); });

    /* ⑧ 알림 & 마이페이지 */
    phase(96500, '⑧ 알림함 & 마이페이지 — 포트폴리오 · solved.ac 연동');
    at(96800, function () { S.actions.setPhone2(false); });
    at(97600, function () { p1().nav('notifications'); });
    at(99300, function () { p1().flash('.noti-row.unread'); });
    at(100800, function () { S.handlers['noti-tap'](p1()); });
    at(102200, function () { p1().nav('mypage'); });
    at(103800, function () { p1().flash('#pf-card'); });
    at(105400, function () { p1().flash('#pf-solved'); });
    at(107600, function () { p1().navTab('home'); });
    phase(108400, '데모 종료 — ⟲ 리셋 후 다시 재생하거나 폰을 직접 조작해보세요');
    at(108600, function () { S.onScenarioDone(); });

    return ev;
  }

  /* 다이얼로그 확인 버튼 누르기 */
  function confirmDialog(phone) {
    var d = phone.dialogState;
    if (!d) return;
    phone.dialogState = null;
    if (d.onConfirm) d.onConfirm(phone); else phone.render();
  }

  /* data-* 속성만 흉내낸 가짜 엘리먼트 (핸들러 재사용용) */
  function fakeEl(attrs) {
    return { getAttribute: function (k) { return attrs[k]; } };
  }

  /* 한 글자씩 자동 타이핑 */
  function typeInto(phone, field, text, dur) {
    var i = 0;
    var step = Math.max(24, (dur || 1200) / text.length / speed);
    var input = phone.screenEl.querySelector('[data-field="' + field + '"]');
    if (input) input.focus();
    var id = setInterval(function () {
      if (!playing) { clearInterval(id); return; }
      i++;
      var val = text.slice(0, i);
      phone.local.fields[field] = val;
      var inp = phone.screenEl.querySelector('[data-field="' + field + '"]');
      if (inp) {
        inp.value = val;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (i >= text.length) clearInterval(id);
    }, step);
    animTimers.push(id);
  }

  /* ─── 스케줄러 (setInterval + performance.now 가상 시간) ─── */
  var TICK_MS = 33;
  var script = [];
  var fired = 0;
  var vtime = 0;
  var lastReal = null;
  var playing = false;
  var speed = 1;
  var timer = null;
  var animTimers = [];

  function tick() {
    if (!playing) return;
    var now = performance.now();
    if (lastReal === null) lastReal = now;
    vtime += Math.max(0, now - lastReal) * speed;
    lastReal = now;
    while (fired < script.length && script[fired].t <= vtime) {
      try { script[fired].fn(); } catch (e) { /* 데모 방어 */ }
      fired++;
    }
    if (fired >= script.length) stop(false);
  }

  function play() {
    if (playing) { pause(); return; }
    if (fired >= script.length || script.length === 0) reset(true);
    playing = true;
    lastReal = null;
    timer = setInterval(tick, TICK_MS);
    S.onScenarioState(true);
  }
  function pause() {
    playing = false;
    if (timer) clearInterval(timer);
    S.onScenarioState(false);
    S.setPhase('일시정지됨 — 폰을 직접 조작해볼 수 있습니다. ▶ 를 누르면 계속');
  }
  function stop(resetPhase) {
    playing = false;
    if (timer) clearInterval(timer);
    animTimers.forEach(clearInterval);
    animTimers = [];
    S.onScenarioState(false);
    if (resetPhase) S.setPhase('데모 준비 완료 — ▶ 를 누르면 전체 기능 시연이 시작됩니다 (시연 중 폰을 클릭하면 직접 조작)');
  }
  function reset(silent) {
    stop(false);
    script = buildScript();
    fired = 0;
    vtime = 0;
    /* 라우트를 먼저 초기화한 뒤 스토어 리셋 (리셋 렌더가 새 데이터로 그려지도록) */
    [[S.phone1, 'splash'], [S.phone2, 'home']].forEach(function (pair) {
      var ph = pair[0];
      if (!ph) return;
      ph.backstack = [];
      ph.route = pair[1];
      ph.params = {};
      ph.local = { fields: {} };
      ph.dialogState = null;
      ph.pendingAnim = '';
      ph.scrollMem = {};
      if (ph._splashTimer) { clearTimeout(ph._splashTimer); ph._splashTimer = null; }
    });
    S.store.reset();
    if (!silent) S.setPhase('리셋 완료 — ▶ 를 누르면 처음부터 재생됩니다');
  }
  function setSpeed(v) { speed = v; }

  S.scenario = {
    play: play,
    pause: pause,
    reset: reset,
    setSpeed: setSpeed,
    isPlaying: function () { return playing; },
  };
})();
