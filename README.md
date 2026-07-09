# 프로젝트 데모 페이지 모음

두 프로젝트의 동작을 브라우저만으로 시연하는 **정적 데모 모음**과, 이를 한 화면에서 탐색하는 **인터랙티브 허브**입니다.
백엔드·빌드·프레임워크 없이 순수 HTML/CSS/JS로 만들어졌고, 외부 CDN·서버에 의존하지 않습니다.

**▶ 라이브: https://doyoungkim-code.github.io/project_demo_page/**

로컬에서는 루트 [`index.html`](index.html)을 더블클릭(file://)하면 바로 열립니다.

---

## 구성

| 폴더 | 프로젝트 | 한 줄 소개 |
|---|---|---|
| [`bunmin_demo/`](bunmin_demo/) | **번역의 민족 (BUNMIN)** | AI 기반 실시간 강의 번역 시스템 — 시작 / 강의자 / 수강자 뷰 |
| [`ssabree_demo/`](ssabree_demo/) | **싸브리타임 (SSABREE)** | SSAFY 교육생 커뮤니티 앱을 갤럭시 폰 프레임으로 재현 |

각 폴더의 `README.md`에 세부 기능과 URL 해시 옵션이 정리되어 있습니다.

## 루트 랜딩 (`index.html`)

포트폴리오용 단일 페이지로, **히어로 → 프로젝트 → 기술 → 연락** 섹션으로 구성됩니다.
프로젝트 카드에는 실제 UI를 축소한 **움직이는 미니 프리뷰**(강의 자막 화면 / 폰 채팅)가 들어 있습니다.

- **격자 정렬 카드 그리드** — 태그 칩으로 즉시 걸러보기 (프로젝트가 4개를 넘으면 검색창도 표시)
- **라이트/다크 토글** — 선택을 `localStorage`에 저장 (첫 방문은 OS 설정을 따름)
- **스크롤 등장 애니메이션 · 네비 스크롤스파이**, 모바일 1열 반응형, `prefers-reduced-motion` 대응
- 이름·소개·기술·링크는 `<script>` 상단의 `SITE` 객체에서 한 번에 수정

## 로컬 실행

```bash
# 방법 1: 그냥 더블클릭
index.html

# 방법 2: 정적 서버 (레포 루트에서)
npx serve .
```

## 새 프로젝트 추가

랜딩은 데이터로 카드를 생성합니다. [`index.html`](index.html)의 `PROJECTS` 배열에 객체 하나만 추가하면 카드가 생깁니다.

```js
{
  id: 'todo',
  name: '<em>투두</em> 앱',        // <em>…</em>는 포인트 컬러로 강조
  badge: '웹',                     // 카드 우상단 배지
  accent: '#0EA5A4',               // 카드 포인트 컬러
  desc: '한 줄 소개.',
  href: 'todo_demo/index.html',    // 데모 진입 경로
  folder: 'todo_demo',             // GitHub '소스' 링크에 사용
  emoji: '✅',                     // 커스텀 프리뷰가 없으면 이모지 카드로 대체
  tech: ['오프라인', 'PWA'],       // 태그 = 필터 키워드
  quick: [{ t: '▶ 자동재생', h: '#autoplay' }],   // 선택: 해시 바로가기
  // mock: 'bunmin' | 'ssabree'    // 기존 미니 프리뷰를 재사용할 때만
}
```

커밋·푸시하면 GitHub Actions가 몇 분 뒤 사이트에 카드를 자동 반영합니다.

## 배포 (GitHub Pages)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)이 `main` 푸시마다 사이트를 자동 배포합니다(정적 파일 그대로 업로드).
저장소는 **공개**여야 하고, **Settings → Pages → Source = "GitHub Actions"** 로 한 번만 설정되어 있으면 됩니다.
나중에 빌드 단계(예: Vite)가 생기면 워크플로의 *Prepare site* 스텝만 `npm ci && npm run build` 로 바꾸면 됩니다.

## 공통 동작

- 각 데모 하단의 데모 스트립에서 **▶ 데모 시작**을 누르면 자동 시연이 재생됩니다.
- 자동 시연 중 화면을 직접 클릭/입력하면 **자동으로 일시정지**되어 그대로 조작할 수 있고, ▶ 로 이어서 재생됩니다.
- 브랜드 폰트(번역의 민족의 paybooc·ELAND)는 기업 배포 폰트이므로 외부 공개 배포 시 라이선스를 확인하세요.
