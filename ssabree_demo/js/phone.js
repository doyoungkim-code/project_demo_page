/* ============================================================
   SSABREE 데모 — 폰 셸 (라우터 · 렌더러 · 공통 컴포넌트)
   각 화면은 S.screens[route] = { render(phone, state), tab } 로 등록.
   수동 클릭과 시나리오가 같은 공개 API(nav/actions)를 사용한다.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  S.screens = {};   // route → { render, tab }
  S.handlers = {};  // data-action 이름 → fn(phone, el)

  /* ─── 공통 컴포넌트 ─── */

  /* 상단 앱바: TopAppBar (18sp Bold, 뒤로가기 화살표) */
  S.appbar = function (opts) {
    opts = opts || {};
    var h = '<div class="appbar' + (opts.solid ? ' solid' : '') + '">';
    if (opts.back) h += '<button class="icon-btn" data-back aria-label="뒤로가기">' + S.icon('back', 24) + '</button>';
    else h += '<span class="appbar-pad"></span>';
    h += '<span class="appbar-title">' + (opts.title || '') + '</span>';
    h += '<span class="appbar-actions">' + (opts.actions || '') + '</span>';
    h += '</div>';
    return h;
  };

  /* 하단 네비게이션 (SsabreeBottomBar: 68dp, HOME 원형 강조) */
  var NAV_TABS = [
    { key: 'manage', route: 'myGroups', label: '나의 그룹', icon: 'supervisor' },
    { key: 'group', route: 'groupSelect', label: '그룹 찾기', icon: 'groups' },
    { key: 'home', route: 'home', label: 'HOME', icon: 'home' },
    { key: 'board', route: 'board', label: '게시판', icon: 'list' },
    { key: 'msg', route: 'chatList', label: '쪽지', icon: 'email' },
  ];

  S.bottomNav = function (active) {
    var h = '<nav class="bottomnav">';
    NAV_TABS.forEach(function (t) {
      var sel = t.key === active;
      if (t.key === 'home' && sel) {
        h += '<button class="nav-item nav-home-sel" data-tab="' + t.route + '">' +
          '<span class="nav-home-circle">' + S.icon(t.icon, 26) + '<i>' + t.label + '</i></span></button>';
      } else {
        h += '<button class="nav-item' + (sel ? ' sel' : '') + '" data-tab="' + t.route + '">' +
          S.icon(t.icon, 26) + '<i>' + t.label + '</i></button>';
      }
    });
    return h + '</nav>';
  };

  S.fab = function (icon, action, big) {
    return '<button class="fab' + (big ? ' big' : '') + '" data-action="' + action + '">' +
      S.icon(icon, big ? 32 : 24) + '</button>';
  };

  /* SsabreeDialog */
  function dialogHTML(phone) {
    var d = phone.dialogState;
    if (!d) return '';
    var h = '<div class="dlg-scrim" data-action="dlg-scrim"><div class="dlg">';
    h += '<div class="dlg-title">' + d.title + '</div>';
    h += '<div class="dlg-msg">' + (d.msg || '') + '</div>';
    h += '<div class="dlg-btns">';
    if (d.dismiss) h += '<button class="dlg-btn dismiss" data-action="dlg-dismiss">' + d.dismiss + '</button>';
    h += '<button class="dlg-btn confirm' + (d.danger ? ' danger' : '') + '" data-action="dlg-confirm">' + (d.confirm || '확인') + '</button>';
    h += '</div></div></div>';
    return h;
  }

  /* ─── Phone 팩토리 ─── */
  function Phone(wrapEl, userId, bootRoute) {
    this.el = wrapEl;
    this.screenEl = wrapEl.querySelector('[data-screen]');
    this.headsupEl = wrapEl.querySelector('[data-headsup]');
    this.userId = userId;
    this.route = bootRoute || 'splash';
    this.params = {};
    this.backstack = [];
    this.local = { fields: {} };   // 화면 전용 임시 상태 (입력값 등)
    this.dialogState = null;
    this.pendingAnim = '';
    this.scrollMem = {};
    this._splashTimer = null;
    this._bindEvents();
  }

  Phone.prototype.nav = function (route, params, opts) {
    opts = opts || {};
    params = params || {};
    if (this.route === route && JSON.stringify(this.params) === JSON.stringify(params) && !opts.force) return;
    if (!opts.back && !opts.replace) this.backstack.push({ route: this.route, params: this.params });
    if (opts.replace) this.backstack = [];
    if (this._splashTimer) { clearTimeout(this._splashTimer); this._splashTimer = null; }
    this.route = route;
    this.params = params;
    this.local = { fields: {} };
    this.dialogState = null;
    this.pendingAnim = opts.back ? 'enter-back' : 'enter-fwd';
    this.render();
  };

  Phone.prototype.back = function () {
    var prev = this.backstack.pop();
    if (!prev) return;
    this.route = prev.route;
    this.params = prev.params;
    this.local = { fields: {} };
    this.dialogState = null;
    this.pendingAnim = 'enter-back';
    this.render();
  };

  /* 하단 탭 이동: 백스택 초기화 (앱의 popUpTo 동작) */
  Phone.prototype.navTab = function (route) {
    this.backstack = [];
    this.nav(route, {}, { replace: true, force: true });
  };

  Phone.prototype.showDialog = function (d) {
    this.dialogState = d;
    this.render();
  };
  Phone.prototype.closeDialog = function () {
    this.dialogState = null;
    this.render();
  };

  Phone.prototype.render = function () {
    var scr = S.screens[this.route];
    if (!scr) return;
    var s = S.store.get();

    /* 입력 포커스·스크롤 스냅샷 */
    var focusEl = document.activeElement;
    var focusField = (focusEl && this.screenEl.contains(focusEl)) ? focusEl.getAttribute('data-field') : null;
    var focusPos = focusField ? focusEl.selectionEnd : 0;
    var contentEl = this.screenEl.querySelector('.content');
    if (contentEl) this.scrollMem[this.route + JSON.stringify(this.params)] = contentEl.scrollTop;

    var anim = this.pendingAnim;
    this.pendingAnim = '';
    this.screenEl.innerHTML =
      '<div class="page ' + anim + '">' +
      scr.render(this, s) +
      (scr.tab ? S.bottomNav(scr.tab) : '') +
      '</div>' + dialogHTML(this);

    /* 입력값 복원 */
    var self = this;
    this.screenEl.querySelectorAll('[data-field]').forEach(function (inp) {
      var name = inp.getAttribute('data-field');
      if (self.local.fields[name] != null) inp.value = self.local.fields[name];
    });
    if (focusField && !anim) {
      var again = this.screenEl.querySelector('[data-field="' + focusField + '"]');
      if (again) {
        again.focus();
        try { again.setSelectionRange(focusPos, focusPos); } catch (e) { /* number 입력 등 */ }
      }
    }

    /* 스크롤 복원 / 채팅은 맨 아래로 */
    contentEl = this.screenEl.querySelector('.content');
    if (contentEl) {
      if (contentEl.hasAttribute('data-stick-bottom')) {
        contentEl.scrollTop = contentEl.scrollHeight;
      } else if (!anim) {
        contentEl.scrollTop = this.scrollMem[this.route + JSON.stringify(this.params)] || 0;
      }
    }

    /* 스플래시 자동 이동 (실제 앱 2000ms) */
    if (this.route === 'splash' && !this._splashTimer) {
      this._splashTimer = setTimeout(function () {
        self._splashTimer = null;
        if (self.route === 'splash') self.nav('login', {}, { replace: true });
      }, 2000);
    }
  };

  Phone.prototype.renderHeadsUp = function (n) {
    if (!n) {
      this.headsupEl.classList.remove('show');
      return;
    }
    this.headsupEl.innerHTML =
      '<div class="hu-app">' + S.logo(15) + '<span>싸브리타임 · 지금</span></div>' +
      '<div class="hu-title">' + n.title + '</div>' +
      '<div class="hu-body">' + n.body + '</div>';
    this.headsupEl.classList.add('show');
  };

  /* 시나리오용: 요소 하이라이트 */
  Phone.prototype.flash = function (sel) {
    var el = this.screenEl.querySelector(sel);
    if (!el) return;
    el.classList.remove('demo-flash');
    void el.offsetWidth;
    el.classList.add('demo-flash');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  Phone.prototype.scrollTo = function (sel) {
    var el = this.screenEl.querySelector(sel);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  Phone.prototype._bindEvents = function () {
    var self = this;

    this.screenEl.addEventListener('click', function (ev) {
      var t = ev.target;

      /* 다이얼로그 */
      var act = closestAttr(t, 'data-action');
      if (act) {
        var name = act.getAttribute('data-action');
        if (name === 'dlg-scrim') {
          if (ev.target === act) self.closeDialog();
          return;
        }
        if (name === 'dlg-confirm') {
          var d = self.dialogState;
          self.dialogState = null;
          if (d && d.onConfirm) d.onConfirm(self); else self.render();
          return;
        }
        if (name === 'dlg-dismiss') {
          var d2 = self.dialogState;
          self.dialogState = null;
          if (d2 && d2.onDismiss) d2.onDismiss(self); else self.render();
          return;
        }
        var fn = S.handlers[name];
        if (fn) { fn(self, act); return; }
      }

      var back = closestAttr(t, 'data-back');
      if (back) { self.back(); return; }

      var tab = closestAttr(t, 'data-tab');
      if (tab) { self.navTab(tab.getAttribute('data-tab')); return; }

      var nav = closestAttr(t, 'data-nav');
      if (nav) {
        var params = {};
        if (nav.hasAttribute('data-arg')) params.id = nav.getAttribute('data-arg');
        self.nav(nav.getAttribute('data-nav'), params);
        return;
      }

      /* 열린 메뉴 밖 클릭 → 닫기 */
      if (self.local.menu && !closestClass(t, 'menu-pop')) {
        self.local.menu = null;
        self.render();
      }
    });

    this.screenEl.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute && ev.target.getAttribute('data-field');
      if (f) {
        self.local.fields[f] = ev.target.value;
        /* 글자수 카운터 등 라이브 표시 */
        var counter = self.screenEl.querySelector('[data-count-for="' + f + '"]');
        if (counter) counter.textContent = ev.target.value.length + '/255';
        var sendBtn = self.screenEl.querySelector('[data-send-state]');
        if (sendBtn) sendBtn.classList.toggle('on', ev.target.value.trim().length > 0);
      }
    });

    this.screenEl.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.getAttribute && ev.target.getAttribute('data-enter')) {
        ev.preventDefault();
        var fn = S.handlers[ev.target.getAttribute('data-enter')];
        if (fn) fn(self, ev.target);
      }
    });
  };

  function closestAttr(el, attr) {
    while (el && el.nodeType === 1) {
      if (el.hasAttribute(attr)) return el;
      el = el.parentElement;
    }
    return null;
  }
  function closestClass(el, cls) {
    while (el && el.nodeType === 1) {
      if (el.classList.contains(cls)) return el;
      el = el.parentElement;
    }
    return null;
  }

  S.Phone = Phone;

  /* ─── 자주 쓰는 조각 ─── */

  /* 상대 유저 찾기 (쪽지방) */
  S.chatPeer = function (chat, meId) {
    return chat.a === meId ? { id: chat.b, name: chat.bName } : { id: chat.a, name: chat.aName };
  };

  /* 필드값 읽기 (local 우선) */
  S.field = function (phone, name) {
    return (phone.local.fields[name] || '').trim();
  };
})();
