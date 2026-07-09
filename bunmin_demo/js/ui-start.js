/* ============================================================
   BUNMIN 데모 — Start 뷰 (Start.tsx / LecturerHome.tsx)
   ============================================================ */
(function () {
  'use strict';
  const B = window.BUNMIN;

  const I18N = {
    ko: {
      brand1: '번역의', brand2: ' 민족',
      tagline: 'AI 기반 실시간 강의 번역 시스템',
      prompt: '강의 참여를 위해 이름을 입력해주세요.',
      namePh: '이름을 입력.',
      nameError: '이름을 입력하여야 강의에 참여할 수 있습니다.',
      audioLang: '음성 언어', subLang: '자막 언어',
      optEn: '영어 (English)', optOriginal: '원본 (Original)', optEn2: '영어 (English)', optKo: '한국어 (Korean)',
      remember: '다음에도 사용하기', join: '강의 참여',
      asLecturer: '강의자로 시작 (강의 준비) →',
      footer: 'Aunion AI X 번역의 민족',
    },
    en: {
      brand1: 'BUN', brand2: 'MIN',
      tagline: 'Real-time AI Lecture Translation',
      prompt: 'Please enter your name to join the lecture.',
      namePh: 'Enter your name.',
      nameError: 'You must enter a name to join the lecture.',
      audioLang: 'Audio', subLang: 'Subtitles',
      optEn: 'English', optOriginal: 'Original', optEn2: 'English', optKo: 'Korean',
      remember: 'Remember me', join: 'Join Lecture',
      asLecturer: 'Start as lecturer →',
      footer: 'Aunion AI X Bunmin',
    },
  };

  let lang = 'ko';

  function applyLang() {
    const dict = I18N[lang];
    document.querySelectorAll('#view-start [data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('#view-start [data-i18n-ph]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] != null) el.placeholder = dict[key];
    });
    const title = document.getElementById('start-title');
    title.classList.toggle('en', lang === 'en');
    document.querySelectorAll('#start-lang-toggle span').forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-lang') === lang);
    });
  }

  document.getElementById('start-lang-toggle').addEventListener('click', function () {
    lang = lang === 'ko' ? 'en' : 'ko';
    applyLang();
  });

  const nameInput = document.getElementById('start-name');
  const clearBtn = document.getElementById('start-name-clear');
  const errorEl = document.getElementById('start-name-error');

  nameInput.addEventListener('input', function () {
    clearBtn.classList.toggle('hidden', !nameInput.value);
    if (nameInput.value) errorEl.classList.add('hidden');
  });
  clearBtn.addEventListener('click', function () {
    nameInput.value = '';
    clearBtn.classList.add('hidden');
    nameInput.focus();
  });

  document.getElementById('start-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { errorEl.classList.remove('hidden'); return; }
    B.store.set({ studentName: name });
    B.setView('student');
    B.toast(name + ' 님, 강의에 참여했습니다. 강의자가 시작하면 화면이 나타납니다.');
  });

  document.getElementById('start-as-lecturer').addEventListener('click', function () {
    B.setView('lecturer');
  });

  applyLang();
})();
