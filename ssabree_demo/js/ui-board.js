/* ============================================================
   SSABREE 데모 — 게시판 (목록 · 상세 · 글 작성 · AI 검열)
   android features/board 재현. 작성자 표기는 실제 앱과 동일하게
   익명(싸용자 / 싸용자N / 싸용자(작성자)).
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  var BLIND_MSG = '험한 말은 싸피봇이 처리했으니 안심하라구!';
  var BAD_WORDS = ['바보', '멍청', '짜증', '최악', '뒤져', '험한', '싫어 죽', '빡치'];

  /* ─── 게시판 목록 (BoardScreen.kt) ─── */
  S.screens.board = {
    tab: 'board',
    render: function (phone, s) {
      var h = S.appbar({
        title: '게시판',
        actions: '<button class="icon-btn" data-action="demo-skip" aria-label="Search">' + S.icon('search', 22) + '</button>',
      });

      /* 필터 행: Hot 칩 + 게시판 선택 칩 */
      var filterLabel = s.boardFilter === 'all' ? '전체보기' : (s.boardFilter === 'hot' ? 'Hot 게시글' : s.boardFilter);
      h += '<div class="board-filters">';
      h += '<button class="pillchip' + (s.boardFilter === 'hot' ? ' on' : '') + '" data-action="board-hot" id="chip-hot">' +
        S.icon('hot', 16) + '<span>Hot</span></button>';
      h += '<span class="pillchip-wrap"><button class="pillchip' + (s.boardFilter !== 'hot' && s.boardFilter !== 'all' ? ' on' : '') + '" data-action="board-menu">' +
        '<span>' + filterLabel + '</span>' + S.icon('dropdown', 18) + '</button>';
      if (phone.local.menu === 'boardsel') {
        h += '<div class="menu-pop">';
        h += '<div class="menu-item" data-action="board-pick" data-val="all">전체보기</div>';
        s.boards.forEach(function (b) {
          h += '<div class="menu-item" data-action="board-pick" data-val="' + b.name + '">' + b.name + '</div>';
        });
        h += '</div>';
      }
      h += '</span></div>';

      h += '<div class="content board-list">';

      /* 관리자 공지 */
      h += '<div class="card admin-notice"><b>관리자 공지사항</b><span>' + s.adminNotice + '</span></div>';

      /* 게시글 목록 */
      var posts = s.posts.filter(function (p) {
        if (s.boardFilter === 'hot') return p.isHot;
        if (s.boardFilter !== 'all') return s.boardFilter.indexOf(p.board) === 0;
        return true;
      });
      posts.forEach(function (p) {
        h += postItem(p);
      });
      if (!posts.length) h += '<div class="empty">게시글이 없습니다.</div>';

      h += '<div style="height:88px"></div></div>';
      h += S.fab('edit', 'board-write');
      return h;
    },
  };

  function postItem(p) {
    var h = '<div class="card post-item" data-nav="boardDetail" data-arg="' + p.id + '" id="post-' + p.id + '">';
    h += '<div class="post-top"><span class="board-pill">' + p.board + '</span>' +
      (p.isHot ? '<span class="badge-pill">HOT</span>' : '') + '</div>';
    if (p.blinded) {
      h += '<div class="post-blind"><span>' + BLIND_MSG + '</span><span class="bot-face">' + S.icon('bot', 56) + '</span></div>';
    } else {
      h += '<div class="post-title">' + esc(p.title) + '</div>';
      h += '<div class="post-preview">' + esc(p.body).slice(0, 80) + (p.body.length > 80 ? '…' : '') + '</div>';
    }
    h += '<div class="post-meta"><span class="post-time">' + p.time + '</span><span class="spacer"></span>' +
      countChip('eye', p.views) + countChip('thumb', p.likes) + countChip('comment', countComments(p)) + '</div>';
    return h + '</div>';
  }

  function countChip(icon, n) {
    return '<span class="count-chip">' + S.icon(icon, 15) + '<b>' + n + '</b></span>';
  }
  function countComments(p) {
    return p.comments.reduce(function (acc, c) { return acc + 1 + c.replies.length; }, 0);
  }

  S.handlers['board-hot'] = function (phone, el) {
    var cur = S.store.get().boardFilter;
    S.store.set({ boardFilter: cur === 'hot' ? 'all' : 'hot' });
  };
  S.handlers['board-menu'] = function (phone) {
    phone.local.menu = phone.local.menu === 'boardsel' ? null : 'boardsel';
    phone.render();
  };
  S.handlers['board-pick'] = function (phone, el) {
    phone.local.menu = null;
    S.store.set({ boardFilter: el.getAttribute('data-val') });
  };
  S.handlers['board-write'] = function (phone) {
    phone.nav('boardWrite');
  };

  /* ─── 게시글 상세 (BoardDetailScreen.kt) ─── */
  S.screens.boardDetail = {
    render: function (phone, s) {
      var p = s.posts.find(function (x) { return x.id === phone.params.id; });
      if (!p) return '<div class="content"><div class="empty">삭제된 게시글입니다.</div></div>';

      var h = S.appbar({
        back: true,
        actions: '<button class="icon-btn" data-action="demo-skip" aria-label="쪽지">' + S.icon('email', 22) + '</button>',
      });

      h += '<div class="content post-detail">';

      /* 작성자 행 */
      h += '<div class="author-row">' + S.avatar(44, 'filled') +
        '<span class="author-col"><b>' + p.author + '</b><span>' + p.time + '</span></span>' +
        '<span class="pillchip-wrap"><button class="icon-btn" data-action="post-more" aria-label="더보기">' + S.icon('more', 22) + '</button>';
      if (phone.local.menu === 'postmore') {
        h += '<div class="menu-pop right"><div class="menu-item" data-action="post-report">신고</div></div>';
      }
      h += '</span></div>';

      if (p.blinded) {
        h += '<div class="post-blind detail"><span>' + BLIND_MSG + '</span><span class="bot-face">' + S.icon('bot', 84) + '</span></div>';
      } else {
        h += '<div class="detail-title">' + esc(p.title) + '</div>';
        h += '<div class="detail-body">' + esc(p.body) + '</div>';
      }

      /* 투표 카드 (PollCard) — 옵션 탭 = 즉시 투표 */
      if (p.poll && !p.blinded) {
        var total = p.poll.options.reduce(function (a, o) { return a + o.votes; }, 0);
        h += '<div class="poll-card" id="poll-card"><b class="poll-head">투표</b>';
        p.poll.options.forEach(function (o, i) {
          var mine = p.poll.votedIdx === i;
          var pct = total ? Math.round(o.votes / total * 100) : 0;
          h += '<div class="poll-opt' + (mine ? ' mine' : '') + '" data-action="poll-vote" data-idx="' + i + '">' +
            '<div class="poll-opt-row"><span>' + o.label + '</span><i>' + o.votes + '표</i></div>' +
            '<div class="poll-bar"><i style="width:' + (p.poll.votedIdx != null ? pct : 0) + '%"></i></div>' +
            '</div>';
        });
        h += '<span class="poll-total">총 ' + total + '표</span></div>';
      }

      /* 액션 행: 좋아요 · 댓글 수 · 스크랩 */
      h += '<div class="act-row">' +
        '<button class="act' + (p.liked ? ' on' : '') + '" data-action="post-like" id="btn-like">' +
        S.icon(p.liked ? 'thumb' : 'thumbOff', 18) + '<b>' + p.likes + '</b></button>' +
        '<span class="act plain">' + S.icon('comment', 18) + '<b>' + countComments(p) + '</b></span>' +
        '<button class="act' + (p.scraped ? ' on' : '') + '" data-action="post-scrap" id="btn-scrap">' +
        S.icon(p.scraped ? 'star' : 'starOff', 19) + '<b>' + p.scraps + '</b></button>' +
        '</div><div class="hr wide"></div>';

      /* 댓글 */
      p.comments.forEach(function (c) {
        h += commentItem(c, false);
        c.replies.forEach(function (r) { h += commentItem(r, true); });
      });
      if (!p.comments.length) h += '<div class="empty small">첫 댓글을 남겨보세요.</div>';
      h += '<div style="height:12px"></div></div>';

      /* 댓글 입력 바 */
      var rt = phone.local.replyTo;
      h += '<div class="comment-bar">';
      if (rt) {
        h += '<div class="reply-banner"><span>' + rt.author + '님에게 답글 작성 중</span>' +
          '<button class="icon-btn sm" data-action="reply-cancel">' + S.icon('close', 16) + '</button></div>';
      }
      h += '<div class="comment-inrow">' +
        '<input class="comment-input" placeholder="' + (rt ? '답글을 입력하세요' : '댓글을 입력하세요') + '" data-field="comment" data-enter="comment-send" />' +
        '<button class="icon-btn primary" data-action="comment-send" id="btn-comment-send">' + S.icon('edit', 20) + '</button>' +
        '</div></div>';
      return h;
    },
  };

  function commentItem(c, isReply) {
    var h = '<div class="cmt' + (isReply ? ' reply' : '') + '">';
    h += '<div class="cmt-head">' + S.avatar(isReply ? 28 : 32) +
      '<b>' + c.author + '</b><span class="spacer"></span>';
    if (!isReply && c.id) h += '<button class="icon-btn sm" data-action="reply-to" data-cid="' + c.id + '" data-author="' + c.author + '" aria-label="답글">' + S.icon('comment', 16) + '</button>';
    h += '<button class="icon-btn sm" data-action="demo-skip" aria-label="좋아요">' + S.icon('thumbOff', 16) + '</button>';
    h += '</div>';
    h += '<div class="cmt-body">' + esc(c.text) + '</div>';
    h += '<div class="cmt-meta">' + c.time + (c.likes ? ' <span class="cmt-like">' + S.icon('thumb', 11) + c.likes + '</span>' : '') + '</div>';
    return h + '</div>';
  }

  S.handlers['post-more'] = function (phone) {
    phone.local.menu = phone.local.menu === 'postmore' ? null : 'postmore';
    phone.render();
  };
  S.handlers['post-report'] = function (phone) {
    phone.local.menu = null;
    phone.render();
    S.toast('신고가 접수되었습니다.');
  };
  S.handlers['poll-vote'] = function (phone, el) {
    S.actions.votePoll(phone.params.id, Number(el.getAttribute('data-idx')));
  };
  S.handlers['post-like'] = function (phone) {
    S.actions.toggleLike(phone.params.id);
  };
  S.handlers['post-scrap'] = function (phone) {
    S.actions.toggleScrap(phone.params.id);
  };
  S.handlers['reply-to'] = function (phone, el) {
    phone.local.replyTo = { id: el.getAttribute('data-cid'), author: el.getAttribute('data-author') };
    phone.render();
    var inp = phone.screenEl.querySelector('[data-field="comment"]');
    if (inp) inp.focus();
  };
  S.handlers['reply-cancel'] = function (phone) {
    phone.local.replyTo = null;
    phone.render();
  };
  S.handlers['comment-send'] = function (phone) {
    var text = S.field(phone, 'comment');
    if (!text) return;
    var s = S.store.get();
    var p = s.posts.find(function (x) { return x.id === phone.params.id; });
    var author = myAnonName(p);
    var rt = phone.local.replyTo;
    phone.local.fields.comment = '';
    phone.local.replyTo = null;
    if (rt) S.actions.addReply(phone.params.id, rt.id, author, text);
    else S.actions.addComment(phone.params.id, author, text);
  };

  /* 내 익명 번호: 기존 싸용자N 최대치 + 1 (게시글마다 고정) */
  function myAnonName(p) {
    if (p._myAnon) return p._myAnon;
    var maxN = 0;
    p.comments.forEach(function (c) {
      var m = /^싸용자(\d+)$/.exec(c.author);
      if (m) maxN = Math.max(maxN, Number(m[1]));
      c.replies.forEach(function (r) {
        var m2 = /^싸용자(\d+)$/.exec(r.author);
        if (m2) maxN = Math.max(maxN, Number(m2[1]));
      });
    });
    p._myAnon = '싸용자' + (maxN + 1);
    return p._myAnon;
  }

  /* ─── 글 작성 (BoardWriteScreen.kt) ─── */
  S.screens.boardWrite = {
    render: function (phone, s) {
      var boardSel = phone.local.boardSel || '자유게시판';
      var canSubmit = S.field(phone, 'wtitle') && S.field(phone, 'wbody');
      var h = S.appbar({
        back: true, solid: true, title: '글 작성',
        actions: '<button class="txt-btn' + (canSubmit ? ' on' : '') + '" data-action="write-submit" id="btn-submit">등록</button>',
      });
      h += '<div class="content write-body">';

      h += '<label class="w-label">게시판</label>' +
        '<span class="pillchip-wrap block"><button class="w-select" data-action="write-board-menu">' +
        '<span>' + boardSel + '</span>' + S.icon('dropdown', 20) + '</button>';
      if (phone.local.menu === 'wboard') {
        h += '<div class="menu-pop">';
        s.boards.forEach(function (b) {
          h += '<div class="menu-item" data-action="write-board-pick" data-val="' + b.name + '">' + b.name + '</div>';
        });
        h += '</div>';
      }
      h += '</span>';

      h += '<label class="w-label">제목</label>' +
        '<input class="w-field" placeholder="제목을 입력하세요" data-field="wtitle" />';
      h += '<label class="w-label">내용</label>' +
        '<textarea class="w-field area" placeholder="내용을 입력하세요" data-field="wbody"></textarea>';

      if (phone.local.voteOn) {
        h += '<div class="card vote-set"><b>투표 설정</b>' +
          '<input class="w-field sm" placeholder="투표 제목을 입력하세요" data-field="vtitle" />' +
          '<input class="w-field sm" placeholder="항목 1" data-field="vopt1" />' +
          '<input class="w-field sm" placeholder="항목 2" data-field="vopt2" />' +
          '<button class="txt-btn add" data-action="demo-skip">' + S.icon('add', 16) + ' 항목 추가</button></div>';
      }

      h += '<div class="card feature-card">' +
        frow('image', '사진 첨부', 'demo-skip') + '<div class="hr"></div>' +
        frow('camera', '카메라 촬영', 'demo-skip') + '<div class="hr"></div>' +
        frow('vote', phone.local.voteOn ? '투표 삭제' : '투표 추가', 'write-vote-toggle', phone.local.voteOn) +
        '</div>';

      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  function frow(icon, label, action, on) {
    return '<div class="feature-row' + (on ? ' on' : '') + '" data-action="' + action + '">' +
      S.icon(icon, 20) + '<span>' + label + '</span></div>';
  }

  S.handlers['write-board-menu'] = function (phone) {
    phone.local.menu = phone.local.menu === 'wboard' ? null : 'wboard';
    phone.render();
  };
  S.handlers['write-board-pick'] = function (phone, el) {
    phone.local.boardSel = el.getAttribute('data-val');
    phone.local.menu = null;
    phone.render();
  };
  S.handlers['write-vote-toggle'] = function (phone) {
    phone.local.voteOn = !phone.local.voteOn;
    phone.render();
  };
  S.handlers['write-submit'] = function (phone) {
    var title = S.field(phone, 'wtitle');
    var body = S.field(phone, 'wbody');
    if (!title || !body) return;
    var boardName = (phone.local.boardSel || '자유게시판').replace('게시판', '').replace('사항', '');
    var isBad = BAD_WORDS.some(function (w) { return (title + body).indexOf(w) !== -1; });
    phone.showDialog({
      title: '알림', msg: '게시글을 등록했습니다.', confirm: '확인',
      onConfirm: function () {
        var id = S.actions.submitPost(title, body, boardName);
        S.store.set({ boardFilter: 'all' });   /* 새 글이 보이도록 전체보기로 */
        phone.nav('board', {}, { back: true });
        if (isBad) {
          /* 서버측 Gemini 검열이 비동기로 블라인드 처리하는 흐름 (그 사이 리셋되면 생략) */
          setTimeout(function () {
            var p = S.store.get().posts.find(function (x) { return x.id === id; });
            if (!p || p.blinded) return;
            S.actions.blindPost(id);
            S.toast('🤖 싸피봇이 부적절한 게시글을 가렸습니다 (Gemini AI 검열)');
          }, 2600);
        }
      },
    });
  };

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  }
  S.esc = esc;
})();
