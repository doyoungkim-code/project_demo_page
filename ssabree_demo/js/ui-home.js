/* ============================================================
   SSABREE 데모 — 스플래시 · 로그인 · 홈 대시보드
   android features/splash, features/login, features/home 재현.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  /* ─── 스플래시 (SplashScreen.kt) ─── */
  S.screens.splash = {
    render: function () {
      return '<div class="content sc-splash">' +
        '<div class="splash-inner">' +
        '<div class="splash-tile">' + S.logo(84) + '</div>' +
        '<div class="splash-name">싸브리타임</div>' +
        '<div class="splash-sub">SSAFY 캠퍼스 커뮤니티</div>' +
        '<div class="splash-progress"><i></i></div>' +
        '</div></div>';
    },
  };

  /* ─── 로그인 (LoginScreen.kt) ─── */
  S.screens.login = {
    render: function (phone) {
      var pwVisible = !!phone.local.pwVisible;
      return '<div class="content sc-login">' +
        '<div class="login-logo">' + S.logo(96) + '<div class="login-word">싸브리타임</div></div>' +
        '<div class="login-tagline">SSAFY 교육생들의 생활 플랫폼</div>' +
        '<div class="login-card">' +
        '<label class="fld-label">이메일</label>' +
        '<input class="fld" type="text" placeholder="이메일" data-field="email" autocomplete="off" />' +
        '<label class="fld-label">비밀번호</label>' +
        '<div class="fld-wrap">' +
        '<input class="fld" type="' + (pwVisible ? 'text' : 'password') + '" placeholder="비밀번호" data-field="pw" />' +
        '<button class="fld-eye" data-action="login-eye" aria-label="비밀번호 표시">' + S.icon(pwVisible ? 'eyeOff' : 'eye', 20) + '</button>' +
        '</div></div>' +
        '<button class="login-btn" data-action="login-submit">로그인</button>' +
        '<div class="login-find" data-action="demo-skip">이메일/비밀번호 찾기</div>' +
        '<div class="login-join">싸브리타임이 처음이신가요? <b data-action="demo-skip">회원가입</b></div>' +
        '</div>';
    },
  };

  S.handlers['login-eye'] = function (phone) {
    phone.local.pwVisible = !phone.local.pwVisible;
    phone.render();
  };
  S.handlers['login-submit'] = function (phone) {
    S.toast('환영합니다 싸용자님!');
    phone.nav('home', {}, { replace: true });
  };
  S.handlers['demo-skip'] = function () {
    S.toast('데모에서는 생략된 화면입니다');
  };

  /* ─── 홈 (HomeScreen.kt) ─── */
  S.screens.home = {
    tab: 'home',
    render: function (phone, s) {
      var me = s.users[phone.userId];
      var h = '';

      /* HomeTopBar */
      h += '<div class="home-topbar">' +
        S.logoWordmark() +
        '<span class="home-topbar-actions">' +
        '<button class="icon-btn" data-nav="notifications" aria-label="알림">' + S.icon('bell', 24) + '</button>' +
        '<button class="icon-btn" data-nav="mypage" aria-label="마이페이지">' + S.icon('account', 24) + '</button>' +
        '</span></div>';

      h += '<div class="content home-body">';

      /* 인사말 + D-Day 필 */
      h += '<div class="home-greet-row">' +
        '<div class="home-greet"><b>' + me.name + '님, 안녕하세요!</b><span>오늘도 싸브리타임과 함께 힘내요.</span></div>' +
        '<div class="dday-pill" data-action="demo-skip"><div class="dday-track">';
      s.ddays.forEach(function (d) {
        h += '<span class="dday-item">' + S.icon('calendar', 18) + '<span>' + d.label + '</span><b>D-' + d.days + '</b></span>';
      });
      /* 첫 항목 복제 → 끊김 없는 순환 */
      var d0 = s.ddays[0];
      h += '<span class="dday-item">' + S.icon('calendar', 18) + '<span>' + d0.label + '</span><b>D-' + d0.days + '</b></span>';
      h += '</div></div></div>';

      /* 프로젝트 / 스터디 그라데이션 배너 (HomeGradientCard) */
      var teamOpen = s.groups.filter(function (g) { return g.kind === 'PROJECT' && !g.closed; })[0];
      var studyOpen = s.groups.filter(function (g) { return g.kind === 'STUDY' && !g.closed; })[0];
      h += '<div class="home-banners" id="home-banners">';
      h += bannerCard('project', '프로젝트', teamOpen ?
        teamOpen.title + '<br/>' + (teamOpen.cap - teamOpen.members.length) + '명 모집 중' : '모집 중인 팀이 없습니다', 'groups');
      h += bannerCard('study', '스터디', studyOpen ?
        studyOpen.title + '<br/>' + (studyOpen.cap - studyOpen.members.length) + '명 모집 중' : '모집 중인 스터디가 없습니다', 'bookmark');
      h += '</div>';

      /* 점심 메뉴 (LunchSection) */
      h += '<div class="sec-title" id="home-lunch-title">점심 메뉴</div>';
      h += '<div class="card lunch-card" id="home-lunch">';
      h += '<div class="lunch-label">캠퍼스</div><div class="chip-row">';
      s.campuses.forEach(function (c) {
        h += '<button class="chip' + (c === s.campusSel ? ' on' : '') + '" data-action="home-campus" data-campus="' + c + '">' + c + '</button>';
      });
      h += '</div>';
      h += '<div class="lunch-head">' + s.campusSel + ' 캠퍼스 오늘의 점심</div>';
      h += '<div class="lunch-sub">표시된 메뉴는 실제 식단과 다를 수 있습니다.</div>';
      if (s.campusSel === '구미') {
        h += '<div class="lunch-strip">';
        s.meals.forEach(function (m) {
          h += '<div class="meal ' + m.hue + '"><b>' + m.corner + '</b><span>' + m.menu + '</span></div>';
        });
        h += '</div>';
      } else {
        h += '<div class="lunch-empty">등록된 점심 이미지가 없습니다.</div>';
      }
      h += '</div>';

      /* 전체 게시판 (BoardListSection) */
      h += '<div class="sec-title">전체 게시판</div>';
      h += '<div class="card board-sec" id="home-boards">';
      s.boards.forEach(function (b, i) {
        var recent = latestPostOf(s, b.name);
        h += '<div class="board-row" data-nav="board">' +
          '<span class="board-dot"></span>' +
          '<span class="board-col"><b>' + b.name + '</b><span>' + (recent || '최근 게시물이 없습니다.') + '</span></span>' +
          '</div>';
        if (i < s.boards.length - 1) h += '<div class="hr"></div>';
      });
      h += '</div>';

      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  function bannerCard(kind, title, sub, icon) {
    return '<div class="banner ' + kind + '" data-action="home-banner" data-kind="' + (kind === 'project' ? 'PROJECT' : 'STUDY') + '">' +
      '<div class="banner-top"><b>' + title + '</b>' + S.icon('chevron', 13) + '</div>' +
      '<div class="banner-sub">' + sub + '</div>' +
      '<div class="banner-icon">' + S.icon(icon, 34) + '</div>' +
      '</div>';
  }

  function latestPostOf(s, boardName) {
    var key = boardName.replace('게시판', '').replace('사항', '');
    var found = null;
    s.posts.some(function (p) {
      if (boardName.indexOf(p.board) === 0 || p.board === key) { found = p; return true; }
      return false;
    });
    if (!found) return null;
    return found.blinded ? '험한 말은 싸피봇이 처리했으니 안심하라구!' : found.title;
  }

  S.handlers['home-campus'] = function (phone, el) {
    S.store.set({ campusSel: el.getAttribute('data-campus') });
  };
  S.handlers['home-banner'] = function (phone, el) {
    phone.nav('groupList', { kind: el.getAttribute('data-kind') });
  };
})();
