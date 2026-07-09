/* ============================================================
   SSABREE 데모 — 쪽지 · 채팅방 · 알림 · 마이페이지(포트폴리오)
   android features/message, messagedetail, notification, mypage 재현.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  /* ─── 쪽지 목록 (MessageScreen.kt) ─── */
  S.screens.chatList = {
    tab: 'msg',
    render: function (phone, s) {
      var h = S.appbar({ title: '쪽지' });
      h += '<div class="content chat-list">';
      var rooms = s.chats.filter(function (c) { return c.a === phone.userId || c.b === phone.userId; });
      if (!rooms.length) h += '<div class="empty">쪽지가 없습니다</div>';
      rooms.forEach(function (c, i) {
        var peer = S.chatPeer(c, phone.userId);
        var last = c.messages[c.messages.length - 1];
        h += '<div class="chat-row" data-nav="chatRoom" data-arg="' + c.id + '" id="chat-' + c.id + '">' +
          S.avatar(54) +
          '<span class="chat-col"><span class="chat-line1"><b>' + peer.name + '</b><i>' + c.time + '</i></span>' +
          '<span class="chat-last">' + (last ? S.esc(last.text) : '메시지가 없습니다') + '</span></span></div>';
        if (i < rooms.length - 1) h += '<div class="hr chat-hr"></div>';
      });
      h += '</div>';
      return h;
    },
  };

  /* ─── 채팅방 (MessageDetailScreen.kt) ─── */
  S.screens.chatRoom = {
    render: function (phone, s) {
      var c = s.chats.find(function (x) { return x.id === phone.params.id; });
      if (!c) return '<div class="content"><div class="empty">삭제된 채팅방입니다.</div></div>';
      var peer = S.chatPeer(c, phone.userId);

      var h = '<div class="appbar solid chatroom-bar">' +
        '<button class="icon-btn" data-back>' + S.icon('back', 24) + '</button>' +
        '<span class="chatroom-title"><b>' + peer.name + '</b><span class="conn">연결됨</span></span>' +
        '<span class="pillchip-wrap"><button class="icon-btn" data-action="chat-more">' + S.icon('more', 22) + '</button>';
      if (phone.local.menu === 'chatmore') {
        h += '<div class="menu-pop right"><div class="menu-item" data-action="chat-leave">채팅방 나가기</div></div>';
      }
      h += '</span></div>';

      h += '<div class="content chat-msgs" data-stick-bottom>';
      c.messages.forEach(function (m) {
        var mine = m.from === phone.userId;
        if (mine) {
          h += '<div class="msg mine"><div class="bubble mine">' + S.esc(m.text) + '</div><span class="msg-time">' + m.time + '</span></div>';
        } else {
          h += '<div class="msg other">' + S.avatar(40) +
            '<div class="msg-col"><b>' + peer.name + '</b><div class="bubble other">' + S.esc(m.text) + '</div>' +
            '<span class="msg-time">' + m.time + '</span></div></div>';
        }
      });
      if (!c.messages.length) h += '<div class="empty">메시지가 없습니다.<br/>첫 메시지를 보내보세요!</div>';
      h += '</div>';

      var val = phone.local.fields.chatmsg || '';
      h += '<div class="chat-inputbar">' +
        '<div class="chat-pill"><input placeholder="메시지를 입력하세요" data-field="chatmsg" data-enter="chat-send" maxlength="255" />' +
        '<button class="icon-btn send' + (val.trim() ? ' on' : '') + '" data-action="chat-send" data-send-state id="btn-chat-send">' + S.icon('send', 20) + '</button></div>' +
        '<div class="chat-limit"><span>최대 255자</span><span data-count-for="chatmsg">' + val.length + '/255</span></div>' +
        '</div>';
      return h;
    },
  };

  S.handlers['chat-more'] = function (phone) {
    phone.local.menu = phone.local.menu === 'chatmore' ? null : 'chatmore';
    phone.render();
  };
  S.handlers['chat-leave'] = function (phone) {
    phone.local.menu = null;
    phone.showDialog({
      title: '채팅방 나가기', msg: '정말로 채팅방을 나가시겠습니까?<br/>나가면 쪽지 복구가 어렵습니다.',
      confirm: '나가기', dismiss: '취소', danger: true,
      onConfirm: function () { phone.back(); },
    });
  };
  S.handlers['chat-send'] = function (phone) {
    var text = S.field(phone, 'chatmsg');
    if (!text) return;
    phone.local.fields.chatmsg = '';
    S.actions.sendChat(phone.params.id, phone.userId, text);
    /* 상대가 채팅방을 보고 있지 않으면 FCM 헤드업 (실제 앱: 열려있는 방은 억제) */
    var s = S.store.get();
    var c = s.chats.find(function (x) { return x.id === phone.params.id; });
    var peer = S.chatPeer(c, phone.userId);
    var other = S.phoneOf && S.phoneOf(peer.id);
    if (other && !(other.route === 'chatRoom' && other.params.id === c.id)) {
      S.actions.showHeadsUp(peer.id, { title: '새 쪽지', body: '새 메시지가 도착했습니다.' });
      S.actions.pushNotification(peer.id, { type: '쪽지', body: s.users[phone.userId].name + ': ' + text });
    }
  };

  /* ─── 알림 (NotificationScreen.kt) ─── */
  S.screens.notifications = {
    render: function (phone, s) {
      var h = S.appbar({ back: true, title: '알림' });
      h += '<div class="content noti-list">';
      var list = s.notifications[phone.userId] || [];
      if (!list.length) h += '<div class="empty">알림이 없습니다.</div>';
      list.forEach(function (n, i) {
        h += '<div class="noti-row' + (n.unread ? ' unread' : '') + '" data-action="noti-tap">' +
          '<div class="noti-head"><span class="noti-badge">' + n.type + '</span><span class="noti-time">' + n.time + '</span></div>' +
          '<div class="noti-body">' + S.esc(n.body) + '</div></div>';
        if (i < list.length - 1) h += '<div class="hr thin"></div>';
      });
      h += '</div>';
      return h;
    },
  };

  S.handlers['noti-tap'] = function (phone) {
    S.actions.markAllRead(phone.userId);
  };

  /* ─── 마이페이지 (MyPageScreen.kt + InfoCard) ─── */
  S.screens.mypage = {
    render: function (phone, s) {
      var me = s.users[phone.userId];
      var pf = s.portfolio;
      var h = S.appbar({
        back: true, solid: true, title: '마이페이지',
        actions: '<button class="icon-btn" data-action="demo-skip">' + S.icon('settings', 22) + '</button>',
      });
      h += '<div class="content my-body">';

      /* 프로필 헤더 */
      h += '<div class="my-profile"><span class="my-avatar">' + S.avatar(74) +
        '<span class="my-cam">' + S.icon('camera', 13) + '</span></span>' +
        '<span class="my-col"><b>' + me.name + '</b><span>@' + me.mmId + '</span><i>' + me.gen + '기 ' + me.campus + ' 캠퍼스</i></span></div>';

      /* 통계 행 */
      h += '<div class="stats-row">' +
        statItem('작성한 글', s.stats.posts) + '<span class="vdiv"></span>' +
        statItem('댓글', s.stats.comments) + '<span class="vdiv"></span>' +
        statItem('스크랩', s.stats.scraps) + '</div>';

      h += '<div class="hr wide my-hr"></div>';

      /* 내 포트폴리오 카드 (InfoCard) */
      h += '<div class="card pf-card" id="pf-card">' +
        '<div class="pf-head"><b>내 포트폴리오</b><span class="pf-pill" data-action="demo-skip">상세보기</span></div>';

      /* 기술 스택 */
      h += pfSection('code', '기술 스택',
        '<div class="pf-stacks">' + pf.stacks.map(function (st) {
          return '<span class="stack-chip">' + st.name + ' (' + st.level + ')</span>';
        }).join('') + '</div>');

      /* SW 역량 */
      h += pfSection('bulb', 'SW 역량', '<b class="pf-val">' + pf.swRating + '</b>');

      /* Solved.ac */
      h += pfSection('trophy', 'Solved.ac',
        '<div class="pf-solved" id="pf-solved"><span class="pf-solved-col">' +
        '<span>티어: <b>' + pf.solvedac.tier + '</b></span>' +
        '<span>푼 문제: <b>' + pf.solvedac.solved + '</b></span>' +
        '<span class="pf-handle">@' + pf.solvedac.handle + '</span></span>' +
        tierBadge() + '</div>');

      /* 링크 */
      h += pfSection('link', '관련 링크 (블로그, 깃허브 등)',
        pf.links.map(function (l) { return '<span class="pf-link">' + l + '</span>'; }).join(''));

      /* 프로젝트 경험 */
      h += pfSection('work', '프로젝트 경험',
        pf.projects.map(function (p, i) {
          return '<div class="pf-proj"><b>' + (i + 1) + '. ' + p.title + '</b><span>' + p.oneLiner + '</span>' +
            '<div class="pf-stacks sm">' + p.stacks.map(function (st) { return '<span class="stack-chip solid">' + st + '</span>'; }).join('') + '</div></div>';
        }).join(''));

      h += '</div>';

      h += '<button class="logout-btn" data-action="my-logout">로그아웃</button>';
      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  function statItem(label, val) {
    return '<span class="stat-item" data-action="demo-skip"><span>' + label + '</span><b>' + val + '</b></span>';
  }

  function pfSection(icon, label, content) {
    return '<div class="pf-sec"><div class="pf-sec-head">' + S.icon(icon, 18) + '<span>' + label + '</span></div>' +
      '<div class="pf-sec-body">' + content + '</div></div>';
  }

  /* solved.ac Gold III 티어 배지 (인라인 SVG 재현) */
  function tierBadge() {
    return '<svg class="tier-badge" width="30" height="38" viewBox="0 0 30 38" aria-label="Gold III">' +
      '<defs><linearGradient id="tierg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFC944"/><stop offset="1" stop-color="#E08A00"/></linearGradient></defs>' +
      '<path d="M15 1 28 8v14L15 37 2 22V8z" fill="url(#tierg)" stroke="#B87700" stroke-width="1.4"/>' +
      '<text x="15" y="22" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">III</text></svg>';
  }

  S.handlers['my-logout'] = function (phone) {
    phone.showDialog({
      title: '로그아웃', msg: '로그아웃 하시겠습니까?', confirm: '로그아웃', dismiss: '취소', danger: true,
      onConfirm: function () { phone.nav('login', {}, { replace: true }); },
    });
  };
})();
