/* ============================================================
   SSABREE 데모 — 목업 데이터
   주인공: 김도영 (14기 구미 캠퍼스). 그 외 인물은 가상.
   게시판은 실제 앱과 동일하게 익명(싸용자/싸용자N) 표기.
   S.mock() 이 호출될 때마다 새 딥카피 상태를 반환한다.
   ============================================================ */
(function () {
  'use strict';
  var S = window.SSABREE;

  S.mock = function () {
    return {
      /* ── 인물 ── */
      users: {
        u1: { id: 'u1', name: '김도영', mmId: 'doyoung_kim', gen: 14, campus: '구미', cls: '2반' },
        u2: { id: 'u2', name: '박싸피', mmId: 'ssafy_park', gen: 14, campus: '구미', cls: '1반' },
        u3: { id: 'u3', name: '이구미', mmId: 'gumi_lee', gen: 14, campus: '구미', cls: '3반' },
      },

      /* ── 홈 ── */
      ddays: [
        { label: '관통 프로젝트 발표', days: 3 },
        { label: 'SW 역량테스트', days: 21 },
      ],
      ddayIndex: 0,
      campuses: ['구미', '서울', '대전', '광주', '부울경'],
      campusSel: '구미',
      meals: [
        { corner: '한식', menu: '제육볶음 · 미역국 · 계란찜', hue: 'a' },
        { corner: '일품', menu: '치즈돈까스 · 냉모밀', hue: 'b' },
        { corner: '분식', menu: '떡볶이 · 김말이 · 순대', hue: 'c' },
      ],

      /* ── 게시판 ── */
      boards: [
        { id: 'notice', name: '공지사항' },
        { id: 'free', name: '자유게시판' },
        { id: 'qna', name: '질문게시판' },
      ],
      boardFilter: 'all', // 'all' | 'hot' | boardId
      adminNotice: '7월 10일(금) 02:00~04:00 서버 점검이 예정되어 있습니다. 이용에 참고 부탁드립니다.',
      posts: [
        {
          id: 'p1', board: '자유', title: '2학기 반 대항전 종목 투표 받습니다!',
          body: '구미캠 반 대항전 종목을 정하려고 합니다. 후보는 풋살, E-스포츠, 볼링이에요. 제일 많이 나온 종목으로 운영진에 건의하겠습니다. 많이 참여해주세요!',
          author: '싸용자', time: '3시간 전', views: 213, likes: 24, liked: false,
          scraps: 5, scraped: false, isHot: true, blinded: false,
          poll: {
            options: [
              { label: '풋살', votes: 15 },
              { label: 'E-스포츠', votes: 11 },
              { label: '볼링', votes: 7 },
            ],
            votedIdx: null,
          },
          comments: [
            {
              id: 'c1', author: '싸용자1', text: '무조건 E-스포츠죠. 반 대표로 나가겠습니다', time: '2시간 전', likes: 6,
              replies: [{ author: '싸용자(작성자)', text: '자신감 좋습니다 ㅋㅋ 투표로 정해요!', time: '2시간 전', likes: 2 }],
            },
            { id: 'c2', author: '싸용자2', text: '풋살하면 구미 운동장 빌릴 수 있나요?', time: '1시간 전', likes: 1, replies: [] },
          ],
        },
        {
          id: 'p2', board: '공지', title: '서버 점검 안내 (7/10 02:00 ~ 04:00)',
          body: '안녕하세요, 싸브리타임 운영팀입니다. 서비스 안정화를 위한 서버 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 일시 중단될 수 있습니다.',
          author: '싸용자', time: '어제', views: 512, likes: 8, liked: false,
          scraps: 12, scraped: false, isHot: false, blinded: false, poll: null, comments: [],
        },
        {
          id: 'p3', board: '자유', title: '구미 기숙사 근처 맛집 공유해요',
          body: '금오산 입구 쪽 칼국수집이 진짜 맛있습니다. 점심 특선 8,000원이고 양도 많아요. 주말에 같이 가실 분 쪽지 주세요!',
          author: '싸용자', time: '5시간 전', views: 148, likes: 17, liked: false,
          scraps: 9, scraped: false, isHot: true, blinded: false, poll: null,
          comments: [
            { id: 'c3', author: '싸용자1', text: '오 저도 가봤는데 인정합니다', time: '4시간 전', likes: 3, replies: [] },
          ],
        },
        {
          id: 'p4', board: '질문', title: 'CS 스터디 자료 어떤 거 쓰시나요?',
          body: '운영체제 파트 정리된 자료 추천 부탁드립니다. 면접 대비용으로 보려고 합니다.',
          author: '싸용자', time: '어제', views: 96, likes: 5, liked: false,
          scraps: 2, scraped: false, isHot: false, blinded: false, poll: null, comments: [],
        },
      ],

      /* ── 그룹 (스터디 / 프로젝트) ── */
      groups: [
        {
          id: 'g1', kind: 'STUDY', title: '구미 알고리즘 스터디', category: '알고리즘',
          leaderId: 'u2', leaderName: '박싸피', leaderMmId: 'ssafy_park',
          cap: 6, members: ['박싸피', '김모각', '정테커'], dday: 5, endDate: '26/07/12',
          closed: false,
          desc: '매주 화/목 저녁 7시, 구미캠 205호에서 진행하는 알고리즘 스터디입니다.\n\n· 백준 골드 이상 문제 위주로 풀이\n· 주 1회 모의 코딩테스트 (삼성 SW 역량테스트 대비)\n· 풀이 공유는 GitHub 저장소로 관리합니다\n\n꾸준히 참여하실 분만 지원해주세요!',
          applicants: [],
        },
        {
          id: 'g2', kind: 'STUDY', title: 'CS 면접 스터디', category: 'CS',
          leaderId: 'x1', leaderName: '정면접', leaderMmId: 'cs_jung',
          cap: 4, members: ['정면접', '한네트'], dday: 12, endDate: '26/07/19',
          closed: false,
          desc: '운영체제·네트워크·DB 순환 발표 스터디입니다. 매주 월요일 점심시간 진행.',
          applicants: [],
        },
        {
          id: 'g3', kind: 'STUDY', title: 'SQLD 자격증 스터디', category: '자격증',
          leaderId: 'x2', leaderName: '오디비', leaderMmId: 'db_oh',
          cap: 5, members: ['오디비', '강쿼리', '남조인', '진인덱', '천튜플'], dday: -1, endDate: '26/06/28',
          closed: true, closedMessage: '모집 공고가 지났습니다.',
          desc: 'SQLD 시험 대비 문제풀이 스터디.',
          applicants: [],
        },
        {
          id: 'g4', kind: 'PROJECT', title: '구미 맛집 지도 만들기', category: '자유',
          leaderId: 'x3', leaderName: '최구미', leaderMmId: 'gumi_choi',
          cap: 5, members: ['최구미', '윤백엔'], dday: 3, endDate: '26/07/10',
          closed: false,
          desc: '구미캠 주변 맛집을 지도로 아카이빙하는 사이드 프로젝트입니다. FE/BE 각 1명 모집!',
          applicants: [],
        },
        {
          id: 'g5', kind: 'PROJECT', title: '공모전: 캠퍼스 안전 서비스', category: '공모전',
          leaderId: 'x4', leaderName: '서공모', leaderMmId: 'gong_seo',
          cap: 6, members: ['서공모', '문기획', '임디자', '배데브'], dday: 8, endDate: '26/07/15',
          closed: false,
          desc: '행안부 공공데이터 공모전에 나갈 팀입니다. 아이디어 기획부터 함께해요.',
          applicants: [],
        },
      ],
      groupFilter: '전체',

      /* 나의 그룹: userId → 소속 그룹 */
      myGroups: {
        u1: [{ groupId: 'gp1', kind: 'PROJECT', title: '관통 프로젝트 A203', category: '싸피', role: '팀원', members: ['정팀장', '김도영', '이프론', '박백엔', '최인프', '한데이'] }],
        u2: [{ groupId: 'g1', kind: 'STUDY', title: '구미 알고리즘 스터디', category: '알고리즘', role: '팀장', members: ['박싸피', '김모각', '정테커'] }],
      },
      myApplication: null, // { groupId, status: 'PENDING'|'APPROVED' }

      /* ── 쪽지 (userId 쌍 공유) ── */
      chats: [
        {
          id: 'ch1', a: 'u1', b: 'u2', aName: '김도영', bName: '박싸피', time: '어제',
          messages: [
            { from: 'u2', text: '안녕하세요! 구미 알고리즘 스터디장 박싸피입니다 :)', time: '어제 20:14' },
          ],
        },
        {
          id: 'ch2', a: 'u1', b: 'u3', aName: '김도영', bName: '이구미', time: '3일 전',
          messages: [
            { from: 'u3', text: '도영님 혹시 관통 프로젝트 자료 공유 가능하신가요?', time: '07.04 13:02' },
            { from: 'u1', text: '네! Mattermost로 보내드릴게요', time: '07.04 13:10' },
          ],
        },
      ],

      /* ── 알림 (userId 별) ── */
      notifications: {
        u1: [
          { type: '댓글', body: '게시글에 새 댓글이 달렸습니다: "오 저도 가봤는데 인정합니다"', time: '2026-07-07 09:12', unread: false },
          { type: '공지', body: '7월 10일 서버 점검 안내를 확인해주세요.', time: '2026-07-06 18:00', unread: false },
        ],
        u2: [
          { type: '인기글', body: '작성하신 게시글이 인기글로 선정되었습니다.', time: '2026-07-06 21:40', unread: false },
        ],
      },
      headsUp: { u1: null, u2: null },

      /* ── 마이페이지 / 포트폴리오 (u1 김도영) ── */
      portfolio: {
        title: '백엔드 개발자 김도영입니다',
        oneLiner: 'Spring과 알고리즘을 좋아하는 SSAFY 14기 교육생',
        stacks: [
          { name: 'Java', level: '상' }, { name: 'Spring Boot', level: '상' },
          { name: 'Kotlin', level: '중' }, { name: 'PostgreSQL', level: '중' },
          { name: 'Redis', level: '중' }, { name: 'Docker', level: '하' },
        ],
        swRating: 'A',
        solvedac: { handle: 'doyoung_kim', tier: 'Gold III', solved: 487 },
        links: ['github.com/doyoungkim-code', 'doyoung.tistory.com'],
        projects: [
          {
            title: '싸브리타임 — SSAFY 커뮤니티 플랫폼',
            oneLiner: '교육생 커뮤니티 · 그룹 매칭 · 실시간 채팅 서비스',
            detail: 'Spring Boot + PostgreSQL + Redis 기반 백엔드 개발 담당. Redis 큐 기반 FCM 알림 파이프라인과 WebSocket(STOMP) 채팅을 구현했습니다.',
            stacks: ['Spring Boot', 'PostgreSQL', 'Redis', 'Docker'],
          },
        ],
      },
      stats: { posts: 12, comments: 38, scraps: 9 },

      /* ── 데모 전용 ── */
      phone2Visible: false,
    };
  };
})();
