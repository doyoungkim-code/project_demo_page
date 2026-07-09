/* ============================================================
   SSABREE 데모 — 그룹 매칭 (그룹 찾기 · 목록 · 상세 · 지원 ·
   나의 그룹 · 멤버 관리[리더의 수락/거절])
   android features/group, features/mygroup 재현.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  var KIND_LABEL = { STUDY: '스터디', PROJECT: '프로젝트' };
  var FILTERS = {
    STUDY: ['전체', '알고리즘', 'CS', '자격증', '기타'],
    PROJECT: ['전체', '싸피', '공모전', '자유'],
  };

  /* 그룹 공지·일정 목업 (그룹 상세용) */
  var GROUP_EXTRA = {
    g1: {
      notices: [
        { title: '이번 주 목요일 저녁 7시 첫 모임입니다!', time: '2시간 전', pinned: true },
        { title: 'GitHub 저장소 초대 링크 확인해주세요', time: '어제', pinned: false },
      ],
      tasks: [
        { title: 'BOJ 골드 5문제 풀어오기', author: '박싸피', status: '진행', range: '07/07 ~ 07/10' },
        { title: '모의 코딩테스트 1회차', author: '김모각', status: '예정', range: '07/12 ~ 07/12' },
      ],
    },
    gp1: {
      notices: [{ title: '발표 리허설 수요일 오후 2시', time: '3시간 전', pinned: true }],
      tasks: [
        { title: '최종 발표 자료 만들기', author: '정팀장', status: '진행', range: '07/06 ~ 07/09' },
        { title: 'README 정리', author: '김도영', status: '완료', range: '07/01 ~ 07/05' },
      ],
    },
  };

  /* ─── 그룹 찾기 (SelectGroupScreen.kt) ─── */
  S.screens.groupSelect = {
    tab: 'group',
    render: function () {
      var h = S.appbar({ title: '그룹 찾기' });
      h += '<div class="content grp-select">';
      h += '<div class="grp-sel-head">어떤 그룹을 찾고 있나요?</div>';
      h += '<div class="grp-sel-sub">프로젝트와 스터디 중 하나만 선택해 주세요.</div>';
      h += bigBanner('project', '프로젝트', '아이디어부터 협업까지 함께', 'groups', 'PROJECT');
      h += bigBanner('study', '스터디', '알고리즘 · CS · 면접 준비까지', 'bookmark', 'STUDY');
      h += '</div>';
      return h;
    },
  };

  function bigBanner(cls, title, sub, icon, kind) {
    return '<div class="banner big ' + cls + '" data-action="grp-kind" data-kind="' + kind + '" id="sel-' + cls + '">' +
      '<div class="banner-top"><b>' + title + '</b>' + S.icon('chevron', 14) + '</div>' +
      '<div class="banner-sub">' + sub + '</div>' +
      '<div class="banner-icon">' + S.icon(icon, 38) + '</div></div>';
  }

  S.handlers['grp-kind'] = function (phone, el) {
    phone.nav('groupList', { kind: el.getAttribute('data-kind') });
  };

  /* ─── 그룹 목록 (GroupScreen.kt) ─── */
  S.screens.groupList = {
    render: function (phone, s) {
      var kind = phone.params.kind || 'STUDY';
      var label = KIND_LABEL[kind];
      var filter = phone.local.filter || '전체';

      var h = S.appbar({
        back: true, title: label,
        actions: '<button class="icon-btn" data-action="demo-skip">' + S.icon('search', 22) + '</button>',
      });

      h += '<div class="grp-header"><b>' + label + '</b><span>모집</span></div>';

      h += '<div class="chip-row pad">';
      FILTERS[kind].forEach(function (f) {
        h += '<button class="chip sq' + (f === filter ? ' on' : '') + '" data-action="grp-filter" data-val="' + f + '">' + f + '</button>';
      });
      h += '</div>';

      h += '<div class="content grp-list">';
      var groups = s.groups.filter(function (g) {
        return g.kind === kind && (filter === '전체' || g.category === filter);
      });
      /* 모집 중 먼저, 마감 그룹 뒤로 */
      groups.filter(function (g) { return !g.closed; }).forEach(function (g) { h += groupCard(g); });
      groups.filter(function (g) { return g.closed; }).forEach(function (g) { h += groupCard(g); });
      if (!groups.length) h += '<div class="empty">모집 중인 그룹이 없습니다.</div>';
      h += '<div style="height:96px"></div></div>';

      h += S.fab('add', 'demo-skip', true);
      return h;
    },
  };

  function groupCard(g) {
    var h = '<div class="card grp-card' + (g.closed ? ' closed' : '') + '"' +
      (g.closed ? '' : ' data-nav="groupDetail" data-arg="' + g.id + '"') + ' id="grp-' + g.id + '">';
    h += '<span class="grp-arrow">' + S.icon('chevron', 14) + '</span>';
    h += '<div class="grp-title">' + g.title + '</div>';
    h += '<div class="grp-row"><span class="grp-cat">' + g.category + '</span>' +
      '<span class="grp-dday">' + (g.closed ? '모집 종료' : 'D-' + g.dday) + '</span></div>';
    h += '<div class="grp-row cap">' + S.icon('groups', 15) + '<span>' + g.members.length + '/' + g.cap + '명</span></div>';
    if (g.closed) h += '<div class="grp-closed-msg">' + (g.closedMessage || '모집 공고가 지났습니다.') + '</div>';
    return h + '</div>';
  }

  S.handlers['grp-filter'] = function (phone, el) {
    phone.local.filter = el.getAttribute('data-val');
    phone.render();
  };

  /* ─── 그룹 상세 (GroupDetailScreen.kt) ─── */
  S.screens.groupDetail = {
    render: function (phone, s) {
      var g = s.groups.find(function (x) { return x.id === phone.params.id; });
      if (!g) return '<div class="content"><div class="empty">삭제된 그룹입니다.</div></div>';

      var h = S.appbar({ back: true, title: '상세보기' });
      h += '<div class="content grp-detail">';
      h += '<div class="gd-title">' + g.title + '</div>';

      h += '<div class="gd-leader">' + S.avatar(60) +
        '<span class="gd-leader-col"><b>' + g.leaderName + '</b><span>@' + g.leaderMmId + '</span><i>팀장</i></span></div>';

      h += '<div class="gd-cards">' +
        '<div class="card gd-info">' + S.icon('calendar', 30) + '<span>모집 종료일</span><b>' + g.endDate + '</b><i>' + (g.closed ? '마감' : 'D-' + g.dday) + '</i></div>' +
        '<div class="card gd-info">' + S.icon('groups', 30) + '<span>그룹 인원</span><b>' + g.members.length + '/' + g.cap + '명</b></div>' +
        '</div>';

      h += '<div class="card gd-desc"><b>상세 설명</b><span>' + S.esc(g.desc) + '</span></div>';
      h += '<div style="height:80px"></div></div>';

      h += '<div class="apply-bar"><button class="apply-btn" data-action="grp-apply" id="btn-apply">지원하기</button></div>';
      return h;
    },
  };

  S.handlers['grp-apply'] = function (phone) {
    var s = S.store.get();
    var gid = phone.params.id;
    var mine = (s.myGroups[phone.userId] || []).some(function (m) { return m.groupId === gid; });
    if (mine) {
      phone.showDialog({ title: '알림', msg: '이미 속한 그룹입니다.', confirm: '확인' });
      return;
    }
    if (s.myApplication && s.myApplication.groupId === gid && s.myApplication.status === 'PENDING') {
      phone.showDialog({ title: '알림', msg: '승인 대기중인 그룹입니다.', confirm: '확인' });
      return;
    }
    phone.nav('groupApply', { id: gid });
  };

  /* ─── 지원 폼 (GroupApplyScreen.kt) ─── */
  S.screens.groupApply = {
    render: function (phone, s) {
      var pf = s.portfolio;
      var can = S.field(phone, 'atitle') && S.field(phone, 'abody') && S.field(phone, 'apos');
      var h = S.appbar({
        back: true, solid: true, title: '지원하기',
        actions: '<button class="txt-btn' + (can ? ' on' : '') + '" data-action="apply-submit" id="btn-apply-submit">등록</button>',
      });
      h += '<div class="content write-body">';
      h += '<label class="w-label">제목</label><input class="w-field" placeholder="제목을 입력하세요" data-field="atitle" />';
      h += '<label class="w-label">상세 내용</label><textarea class="w-field area sm2" placeholder="상세 내용을 입력하세요" data-field="abody"></textarea>';
      h += '<label class="w-label">포지션</label><input class="w-field" placeholder="예: BE" data-field="apos" />';

      /* 첨부되는 내 포트폴리오 요약 */
      h += '<div class="card pf-mini"><div class="pf-mini-head"><b>내 포트폴리오</b><span class="pf-pill" data-action="demo-skip">상세보기</span></div>' +
        '<div class="pf-mini-row">' + S.icon('code', 16) + '<span>' +
        pf.stacks.slice(0, 3).map(function (st) { return st.name; }).join(' · ') + ' 외 ' + (pf.stacks.length - 3) + '건</span></div>' +
        '<div class="pf-mini-row">' + S.icon('trophy', 16) + '<span>solved.ac ' + pf.solvedac.tier + ' · ' + pf.solvedac.solved + '문제</span></div>' +
        '</div>';
      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  S.handlers['apply-submit'] = function (phone) {
    var title = S.field(phone, 'atitle');
    var body = S.field(phone, 'abody');
    var pos = S.field(phone, 'apos');
    if (!title || !body || !pos) return;
    var gid = phone.params.id;
    var s = S.store.get();
    var me = s.users[phone.userId];
    var g = s.groups.find(function (x) { return x.id === gid; });
    S.actions.applyToGroup(gid, { userId: phone.userId, name: me.name, position: pos, title: title, body: body });
    /* 리더에게 FCM 푸시 */
    S.actions.pushNotification(g.leaderId, { type: '알림', body: '[' + g.title + '] 새로운 지원자가 있습니다.' });
    S.actions.showHeadsUp(g.leaderId, { title: '새 지원자', body: '새로운 지원자가 있습니다.' });
    phone.showDialog({
      title: '알림', msg: '지원이 완료되었습니다.', confirm: '확인',
      onConfirm: function () { phone.back(); },
    });
  };

  /* ─── 나의 그룹 (MyGroupScreen / GroupManageScreen) ─── */
  S.screens.myGroups = {
    tab: 'manage',
    render: function (phone, s) {
      var mine = s.myGroups[phone.userId] || [];
      var h = S.appbar({ title: '나의 그룹' });
      h += '<div class="content mygrp-body">';

      ['PROJECT', 'STUDY'].forEach(function (kind) {
        var list = mine.filter(function (m) { return m.kind === kind; });
        h += '<div class="mygrp-sec"><b>' + KIND_LABEL[kind] + '</b><span>참여 중</span></div>';
        if (!list.length) {
          h += '<div class="empty small">참여 중인 ' + KIND_LABEL[kind] + '가 없습니다.</div>';
          return;
        }
        h += '<div class="mygrp-grid">';
        list.forEach(function (m) {
          var g = s.groups.find(function (x) { return x.id === m.groupId; });
          var pending = g ? g.applicants.filter(function (a) { return a.status === 'PENDING'; }).length : 0;
          h += '<div class="card mygrp-card" data-nav="myGroupDetail" data-arg="' + m.groupId + '" id="mygrp-' + m.groupId + '">' +
            '<div class="mygrp-title">' + m.title + '</div>' +
            '<div class="mygrp-row"><span class="role-pill' + (m.role === '팀장' ? ' leader' : '') + '">' + m.role + '</span>' +
            '<span class="mygrp-cat">' + m.category + '</span></div>' +
            '<div class="mygrp-row">' + S.icon('groups', 15) + '<span>' + m.members.length + '명</span>' +
            (pending ? '<span class="applicant-badge">지원자 ' + pending + '</span>' : '') + '</div>' +
            '<div class="avatar-stack">' + m.members.slice(0, 4).map(function () { return S.avatar(24); }).join('') + '</div>' +
            '</div>';
        });
        h += '</div>';
      });

      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  /* ─── 나의 그룹 상세 (MyGroupDetailScreen.kt) ─── */
  S.screens.myGroupDetail = {
    render: function (phone, s) {
      var gid = phone.params.id;
      var mine = (s.myGroups[phone.userId] || []).find(function (m) { return m.groupId === gid; });
      var g = s.groups.find(function (x) { return x.id === gid; });
      var title = g ? g.title : (mine ? mine.title : '그룹');
      var members = g ? g.members : (mine ? mine.members : []);
      var leaderName = g ? g.leaderName : (mine ? mine.members[0] : '');
      var isLeader = mine && mine.role === '팀장';
      var pending = g ? g.applicants.filter(function (a) { return a.status === 'PENDING'; }).length : 0;
      var extra = GROUP_EXTRA[gid] || { notices: [], tasks: [] };
      var taskTab = phone.local.taskTab || '전체';

      var h = S.appbar({
        back: true, solid: true, title: '그룹 상세',
        actions: isLeader ?
          '<button class="txt-btn on member-manage" data-action="go-members" id="btn-members">멤버 관리' +
          (pending ? '<span class="dot-badge">' + pending + '</span>' : '') + '</button>' :
          '<button class="txt-btn danger" data-action="grp-leave">나가기</button>',
      });

      h += '<div class="content mygrpd-body">';

      /* 그룹 정보 헤더 카드 */
      h += '<div class="card mygrpd-head"><span class="status-pill">진행중</span>' +
        '<div class="mygrpd-title">' + title + '</div>' +
        '<div class="mygrpd-mem-label">멤버 목록</div>';
      members.forEach(function (name, i) {
        h += '<div class="mem-row">' + S.avatar(34) + '<b>' + name + '</b>' +
          (name === leaderName ? '<span class="role-pill leader sm">팀장</span>' : '') + '</div>';
        if (i < members.length - 1) h += '<div class="hr"></div>';
      });
      h += '</div>';

      /* 공지사항 */
      h += '<div class="sec-row"><b>공지사항</b><span data-action="demo-skip">전체보기</span></div>';
      h += '<div class="card">';
      if (extra.notices.length) {
        extra.notices.slice(0, 2).forEach(function (n, i) {
          h += '<div class="notice-row">' + S.icon('campaign', 20) +
            '<span class="notice-col"><b>' + n.title + '</b><span>' + n.time + '</span></span></div>';
          if (i === 0 && extra.notices.length > 1) h += '<div class="hr"></div>';
        });
      } else h += '<div class="empty small">등록된 공지사항이 없습니다.</div>';
      h += '</div>';

      /* 일정 */
      h += '<div class="sec-row"><b>일정</b><span class="add-circle" data-action="demo-skip">' + S.icon('add', 18) + '</span></div>';
      h += '<div class="task-tabs">';
      ['전체', '예정', '진행', '완료'].forEach(function (t) {
        h += '<button class="task-tab' + (t === taskTab ? ' on' : '') + '" data-action="task-tab" data-val="' + t + '">' + t + '</button>';
      });
      h += '</div>';
      var tasks = extra.tasks.filter(function (t) { return taskTab === '전체' || t.status === taskTab; });
      if (tasks.length) {
        tasks.forEach(function (t) {
          h += '<div class="card task-item">' + S.avatar(34) +
            '<span class="task-col"><b>' + t.title + '</b><span>작성자: ' + t.author + ' · ' + t.range + '</span></span>' +
            '<span class="task-pill ' + t.status + '">' + t.status + '</span></div>';
        });
      } else {
        h += '<div class="empty small">등록된 일정이 없습니다.</div>';
      }

      h += '<div style="height:24px"></div></div>';
      return h;
    },
  };

  S.handlers['task-tab'] = function (phone, el) {
    phone.local.taskTab = el.getAttribute('data-val');
    phone.render();
  };
  S.handlers['go-members'] = function (phone) {
    phone.nav('memberManage', { id: phone.params.id });
  };
  S.handlers['grp-leave'] = function (phone) {
    phone.showDialog({ title: '알림', msg: '정말 그룹을 나가시겠습니까?', confirm: '나가기', dismiss: '취소', danger: true,
      onConfirm: function () { S.toast('데모에서는 생략된 동작입니다'); phone.render(); } });
  };

  /* ─── 멤버 관리 (MemberManageScreen.kt) — 리더의 수락/거절 ─── */
  S.screens.memberManage = {
    render: function (phone, s) {
      var g = s.groups.find(function (x) { return x.id === phone.params.id; });
      if (!g) return '<div class="content"><div class="empty">그룹 정보를 찾을 수 없습니다.</div></div>';
      var pendings = g.applicants.filter(function (a) { return a.status === 'PENDING'; });

      var h = S.appbar({ back: true, solid: true, title: '멤버 관리' });
      h += '<div class="content mm-body">';

      h += '<div class="mm-sec">멤버 요청</div>';
      if (pendings.length) {
        pendings.forEach(function (a) {
          h += '<div class="card mm-req" id="req-' + a.userId + '">' + S.avatar(46) +
            '<span class="mm-req-col"><b>' + a.name + '</b><span class="pos-pill">' + (a.position || 'BE') + '</span></span>' +
            '<button class="btn-accept" data-action="mm-accept" data-uid="' + a.userId + '" data-name="' + a.name + '" id="btn-accept">수락</button>' +
            '<button class="btn-reject" data-action="mm-reject" data-uid="' + a.userId + '" data-name="' + a.name + '">거절</button>' +
            '</div>';
        });
      } else {
        h += '<div class="empty small">아직 지원자가 없습니다.</div>';
      }

      h += '<div class="mm-sec">멤버 목록</div><div class="card">';
      g.members.forEach(function (name, i) {
        h += '<div class="mem-row lg">' + S.avatar(44) + '<b>' + name + '</b>' +
          (name === g.leaderName ? '<span class="role-pill leader sm">팀장</span>' :
            '<span class="spacer"></span><button class="btn-kick" data-action="demo-skip">내보내기</button>') +
          '</div>';
        if (i < g.members.length - 1) h += '<div class="hr"></div>';
      });
      h += '</div><div style="height:24px"></div></div>';
      return h;
    },
  };

  S.handlers['mm-accept'] = function (phone, el) {
    var uid = el.getAttribute('data-uid');
    var name = el.getAttribute('data-name');
    var gid = phone.params.id;
    phone.showDialog({
      title: '수락 확인', msg: name + ' 님의 지원을 수락하시겠습니까?', confirm: '수락', dismiss: '취소',
      onConfirm: function () {
        S.actions.acceptApplicant(gid, uid);
        S.toast(name + ' 님이 그룹에 합류했습니다');
      },
    });
  };
  S.handlers['mm-reject'] = function (phone, el) {
    var name = el.getAttribute('data-name');
    phone.showDialog({
      title: '거절 확인', msg: name + ' 님의 지원을 거절하시겠습니까?', confirm: '거절', dismiss: '취소', danger: true,
      onConfirm: function () { S.toast('데모에서는 생략된 동작입니다'); phone.render(); },
    });
  };
})();
