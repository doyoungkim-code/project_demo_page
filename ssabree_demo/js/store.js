/* ============================================================
   SSABREE 데모 — 공유 스토어 + 액션
   bunmin_demo/js/store.js 의 초경량 pub/sub 패턴.
   폰 1(김도영)·폰 2(박싸피)가 같은 인스턴스를 구독하므로
   채팅·알림·그룹 수락이 자동으로 "실시간" 동기화된다.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  function createStore() {
    var state = S.mock();
    var subscribers = [];
    return {
      get: function () { return state; },
      set: function (patch) {
        state = Object.assign({}, state, patch);
        var keys = new Set(Object.keys(patch));
        subscribers.forEach(function (fn) { fn(state, keys); });
      },
      subscribe: function (fn) { subscribers.push(fn); },
      reset: function () {
        state = S.mock();
        var keys = new Set(Object.keys(state));
        subscribers.forEach(function (fn) { fn(state, keys); });
      },
    };
  }

  var store = createStore();
  var seq = 100;
  var headsUpTimers = { u1: null, u2: null };

  function nowHM() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function nowStamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* 게시글/그룹 불변 업데이트 헬퍼 */
  function patchPost(postId, fn) {
    var posts = store.get().posts.map(function (p) {
      return p.id === postId ? fn(Object.assign({}, p)) : p;
    });
    store.set({ posts: posts });
  }
  function patchGroup(groupId, fn) {
    var groups = store.get().groups.map(function (g) {
      return g.id === groupId ? fn(Object.assign({}, g)) : g;
    });
    store.set({ groups: groups });
  }

  var actions = {

    /* ── 게시판 ── */
    votePoll: function (postId, idx) {
      patchPost(postId, function (p) {
        if (!p.poll || p.poll.votedIdx != null) return p;
        var poll = { votedIdx: idx, options: p.poll.options.map(function (o, i) {
          return { label: o.label, votes: o.votes + (i === idx ? 1 : 0) };
        }) };
        p.poll = poll;
        return p;
      });
    },

    toggleLike: function (postId) {
      patchPost(postId, function (p) {
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
        return p;
      });
    },

    toggleScrap: function (postId) {
      patchPost(postId, function (p) {
        p.scraped = !p.scraped;
        p.scraps += p.scraped ? 1 : -1;
        return p;
      });
    },

    addComment: function (postId, author, text) {
      patchPost(postId, function (p) {
        p.comments = p.comments.concat([{ id: 'c' + (++seq), author: author, text: text, time: '방금', likes: 0, replies: [] }]);
        return p;
      });
    },

    addReply: function (postId, commentId, author, text) {
      patchPost(postId, function (p) {
        p.comments = p.comments.map(function (c) {
          if (c.id !== commentId) return c;
          var c2 = Object.assign({}, c);
          c2.replies = c.replies.concat([{ author: author, text: text, time: '방금', likes: 0 }]);
          return c2;
        });
        return p;
      });
    },

    /* 글 등록 → 서버 AI 검열(Gemini)이 비동기로 블라인드 처리하는 흐름 재현 */
    submitPost: function (title, body, boardName) {
      var id = 'p' + (++seq);
      var post = {
        id: id, board: boardName || '자유', title: title, body: body,
        author: '싸용자', time: '방금', views: 1, likes: 0, liked: false,
        scraps: 0, scraped: false, isHot: false, blinded: false, poll: null, comments: [],
      };
      store.set({ posts: [post].concat(store.get().posts) });
      return id;
    },

    blindPost: function (postId) {
      patchPost(postId, function (p) { p.blinded = true; return p; });
    },

    /* ── 그룹 매칭 ── */
    applyToGroup: function (groupId, applicant) {
      patchGroup(groupId, function (g) {
        g.applicants = g.applicants.concat([Object.assign({ status: 'PENDING' }, applicant)]);
        return g;
      });
      store.set({ myApplication: { groupId: groupId, status: 'PENDING' } });
    },

    acceptApplicant: function (groupId, userId) {
      var s = store.get();
      var user = s.users[userId];
      patchGroup(groupId, function (g) {
        g.applicants = g.applicants.map(function (a) {
          return a.userId === userId ? Object.assign({}, a, { status: 'APPROVED' }) : a;
        });
        g.members = g.members.concat([user.name]);
        return g;
      });
      s = store.get();
      var g = s.groups.find(function (x) { return x.id === groupId; });
      /* 지원자의 나의 그룹에 추가 */
      var mine = Object.assign({}, s.myGroups);
      mine[userId] = (mine[userId] || []).concat([{
        groupId: groupId, kind: g.kind, title: g.title, category: g.category, role: '팀원', members: g.members,
      }]);
      store.set({ myGroups: mine, myApplication: { groupId: groupId, status: 'APPROVED' } });
      /* 지원자에게 푸시 */
      actions.pushNotification(userId, { type: '알림', body: '[' + g.title + '] 지원이 수락되었습니다.' });
      actions.showHeadsUp(userId, { title: '지원 수락', body: '지원이 수락되었습니다.' });
    },

    /* ── 쪽지 ── */
    sendChat: function (chatId, fromUserId, text) {
      var s = store.get();
      var chats = s.chats.map(function (c) {
        if (c.id !== chatId) return c;
        var c2 = Object.assign({}, c);
        c2.messages = c.messages.concat([{ from: fromUserId, text: text, time: nowHM() }]);
        c2.time = '지금';
        return c2;
      });
      store.set({ chats: chats });
    },

    /* ── 알림 / FCM ── */
    pushNotification: function (userId, n) {
      var s = store.get();
      var notif = Object.assign({}, s.notifications);
      notif[userId] = [Object.assign({ time: nowStamp(), unread: true }, n)].concat(notif[userId] || []);
      store.set({ notifications: notif });
    },

    markAllRead: function (userId) {
      var s = store.get();
      var notif = Object.assign({}, s.notifications);
      notif[userId] = (notif[userId] || []).map(function (n) { return Object.assign({}, n, { unread: false }); });
      store.set({ notifications: notif });
    },

    showHeadsUp: function (userId, n, ttl) {
      var hu = Object.assign({}, store.get().headsUp);
      hu[userId] = n;
      store.set({ headsUp: hu });
      if (headsUpTimers[userId]) clearTimeout(headsUpTimers[userId]);
      headsUpTimers[userId] = setTimeout(function () {
        var cur = Object.assign({}, store.get().headsUp);
        cur[userId] = null;
        store.set({ headsUp: cur });
      }, ttl || 3400);
    },

    setPhone2: function (visible) {
      store.set({ phone2Visible: !!visible });
    },
  };

  S.store = store;
  S.actions = actions;
})();
