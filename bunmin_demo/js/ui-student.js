/* ============================================================
   BUNMIN 데모 — 수강자 뷰 (Student.tsx)
   대기/LIVE/일시정지/종료 상태, 자막 오버레이(스타일/크기/언어),
   하단 컨트롤 바, 설정 메뉴, 자료 목록, 판서·커서 미러링, PiP.
   ============================================================ */
(function () {
  'use strict';
  const B = window.BUNMIN;
  const store = B.store;

  const $ = function (id) { return document.getElementById(id); };

  /* 수강자 로컬 설정 (preferencesStore 대응) */
  const prefs = {
    audioLang: 'en',       // 'original' | 'en'
    subtitleLang: 'en',    // 'off' | 'ko' | 'en'
    secondaryLang: 'ko',   // 'off' | 'ko' | 'en'
    ccEnabled: true,
    muted: false,
    volume: 80,
    fontSize: 18,
    style: 'outline',      // plain | outline | glow | background
    aspect: '4/3',
  };
  B.studentPrefs = prefs;

  const stage = $('stu-stage');
  const subtitleEl = $('stu-subtitle');
  const stuCanvas = $('stu-canvas');
  const pipCanvas = $('pip-canvas');

  /* ─── 하단 컨트롤 바 ─── */
  $('stu-mute-btn').addEventListener('click', function () {
    prefs.muted = !prefs.muted;
    document.querySelector('#stu-mute-btn .spk-on').classList.toggle('hidden', prefs.muted);
    document.querySelector('#stu-mute-btn .spk-off').classList.toggle('hidden', !prefs.muted);
  });
  $('stu-volume').addEventListener('input', function (e) { prefs.volume = Number(e.target.value); });

  $('stu-cc-btn').addEventListener('click', function () {
    prefs.ccEnabled = !prefs.ccEnabled;
    $('stu-cc-btn').classList.toggle('active', prefs.ccEnabled);
    renderSubtitle(store.get());
  });

  $('stu-fullscreen-btn').addEventListener('click', function () {
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); }
    else if (stage.requestFullscreen) { stage.requestFullscreen().catch(function () {}); }
  });

  /* ─── 설정 메뉴 ─── */
  const settings = $('stu-settings');
  $('stu-settings-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    settings.classList.toggle('hidden');
    showPanel('main');
    document.querySelector('#view-student .stage-controls').classList.toggle('force-visible', !settings.classList.contains('hidden'));
  });
  document.addEventListener('click', function (e) {
    if (!settings.classList.contains('hidden') && !e.target.closest('#stu-settings') && !e.target.closest('#stu-settings-btn')) {
      settings.classList.add('hidden');
      document.querySelector('#view-student .stage-controls').classList.remove('force-visible');
    }
  });

  function showPanel(name) {
    settings.querySelectorAll('.settings-panel').forEach(function (p) {
      p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
    });
  }
  settings.addEventListener('click', function (e) {
    const goto = e.target.closest('[data-goto]');
    if (goto) { showPanel(goto.getAttribute('data-goto')); return; }

    const aspectBtn = e.target.closest('[data-aspect]');
    if (aspectBtn) {
      prefs.aspect = aspectBtn.getAttribute('data-aspect');
      settings.querySelectorAll('[data-aspect]').forEach(function (b) { b.classList.toggle('selected', b === aspectBtn); });
      $('set-aspect-value').textContent = prefs.aspect.replace('/', ':') + ' ›';
      stage.style.aspectRatio = prefs.aspect;
      requestAnimationFrame(function () { redrawStudentCanvas(store.get()); });
      return;
    }

    const styleBtn = e.target.closest('[data-style]');
    if (styleBtn) {
      prefs.style = styleBtn.getAttribute('data-style');
      settings.querySelectorAll('[data-style]').forEach(function (b) { b.classList.toggle('selected', b === styleBtn); });
      $('set-style-value').textContent = styleBtn.textContent.trim() + ' ›';
      applySubtitleStyle();
      return;
    }

    const langBtn = e.target.closest('[data-group]');
    if (langBtn) {
      const group = langBtn.getAttribute('data-group');
      const val = langBtn.getAttribute('data-val');
      if (group === 'audio') prefs.audioLang = val;
      if (group === 'sub') prefs.subtitleLang = val;
      if (group === 'sub2') prefs.secondaryLang = val;
      settings.querySelectorAll('[data-group="' + group + '"]').forEach(function (b) { b.classList.toggle('selected', b === langBtn); });
      renderSubtitle(store.get());
    }
  });

  $('set-fontsize').addEventListener('input', function (e) {
    prefs.fontSize = Number(e.target.value);
    $('set-fontsize-px').textContent = prefs.fontSize + 'px';
    $('set-fontsize-value').textContent = prefs.fontSize + 'px ›';
    subtitleEl.style.fontSize = prefs.fontSize + 'px';
  });

  function applySubtitleStyle() {
    subtitleEl.className = subtitleEl.className.replace(/sub-\w+/g, '').trim();
    subtitleEl.classList.add('sub-' + prefs.style);
    renderSubtitle(store.get());
  }

  /* ─── 헤더: 이름 편집 / 나가기 / 다운로드 / 참가자 ─── */
  $('stu-name-badge').addEventListener('click', function () {
    const cur = store.get().studentName;
    const next = window.prompt('이름 변경', cur);
    if (next && next.trim()) store.set({ studentName: next.trim() });
  });
  $('stu-leave-btn').addEventListener('click', function () { B.setView('start'); });
  $('stu-download-btn').addEventListener('click', function () {
    $('transcript-modal-title').textContent = 'Save Lecture Subtitles';
    $('transcript-modal-body').textContent = 'Download the subtitles recognized during the lecture.';
    B.openModal('modal-transcript');
  });
  $('stu-participants-btn').addEventListener('click', function () {
    $('stu-participants').classList.toggle('hidden');
    $('stu-participants-btn').classList.toggle('active');
  });
  document.querySelector('#stu-participants .participants-close').addEventListener('click', function () {
    $('stu-participants').classList.add('hidden');
    $('stu-participants-btn').classList.remove('active');
  });

  /* ─── 원본/번역 토글 ─── */
  $('stu-material-toggle').addEventListener('click', function () {
    const cur = store.get().materialMode;
    store.set({ materialMode: cur === 'original' ? 'translated' : 'original' });
  });

  /* ─── 자막 텍스트 선택 ─── */
  function pickText(sub, lang) {
    if (!sub || lang === 'off') return '';
    return lang === 'ko' ? (sub.original || '') : (sub.translated || '');
  }

  function renderSubtitle(s) {
    const last = s.subtitles[s.subtitles.length - 1];
    const primary = subtitleEl.querySelector('.stage-subtitle-primary');
    const secondary = subtitleEl.querySelector('.stage-subtitle-secondary');
    // 강의 중에만 표시 (종료 후에는 사이드바 히스토리와 다운로드로 확인)
    const showable = s.isLectureStarted;

    if (!prefs.ccEnabled || !showable || prefs.subtitleLang === 'off') {
      subtitleEl.classList.add('hidden');
      renderPipSubtitle(s);
      return;
    }
    let ptext = '', stext = '';
    if (s.activePartial) {
      ptext = prefs.subtitleLang === 'ko' ? s.activePartial + ' …' : '';
      if (!ptext && last) ptext = pickText(last, prefs.subtitleLang);
    } else if (last) {
      ptext = pickText(last, prefs.subtitleLang);
      if (!ptext) ptext = last.original; // 번역 도착 전 폴백
      stext = pickText(last, prefs.secondaryLang);
      if (stext === ptext) stext = '';
    }
    if (!ptext && !stext) { subtitleEl.classList.add('hidden'); renderPipSubtitle(s); return; }
    subtitleEl.classList.remove('hidden');
    if (prefs.style === 'background') {
      primary.innerHTML = ptext ? '<span></span>' : '';
      if (ptext) primary.firstChild.textContent = ptext;
      secondary.innerHTML = stext ? '<span></span>' : '';
      if (stext) secondary.firstChild.textContent = stext;
    } else {
      primary.textContent = ptext;
      secondary.textContent = stext;
    }
    renderPipSubtitle(s);
  }

  /* ─── PiP 미리보기 (강의자 탭에서 수강자 화면 축소판) ─── */
  function renderPipSubtitle(s) {
    const pipSub = $('pip-subtitle');
    if (!s.isLectureStarted) { pipSub.classList.add('hidden'); return; }
    const last = s.subtitles[s.subtitles.length - 1];
    const p = pipSub.querySelector('.pip-sub-primary');
    const sec = pipSub.querySelector('.pip-sub-secondary');
    let ptext = '';
    if (s.activePartial) ptext = '';
    else if (last) ptext = last.translated || last.original;
    if (!ptext) { pipSub.classList.add('hidden'); return; }
    pipSub.classList.remove('hidden');
    p.textContent = ptext;
    sec.textContent = last && last.translated ? last.original : '';
  }

  function renderPip(s) {
    const waiting = $('pip-waiting');
    const img = $('pip-slide-img');
    if (s.presentationMode === 'slide' && s.slideStatus === 'ready') {
      const page = B.slides.pages[s.currentPage - 1];
      img.src = s.materialMode === 'original' ? page.koUrl : page.enUrl;
      img.classList.remove('hidden');
      waiting.classList.add('hidden');
      requestAnimationFrame(function () {
        B.draw.fit(pipCanvas);
        B.draw.render(pipCanvas, s.strokes[s.currentPage]);
      });
    } else {
      img.classList.add('hidden');
      waiting.classList.remove('hidden');
      waiting.textContent = s.isLectureStarted ? 'Screen sharing...' : 'Waiting...';
    }
  }

  /* ─── 수강자 스테이지 렌더 ─── */
  function redrawStudentCanvas(s) {
    if (s.slideStatus !== 'ready') return;
    B.draw.fit(stuCanvas);
    B.draw.render(stuCanvas, s.strokes[s.currentPage]);
  }

  function render(s, keys) {
    const all = keys.size === 0 || keys.size > 20;
    const has = function (k) { return all || keys.has(k); };

    // 헤더 배지/칩
    if (has('isLectureStarted') || has('isPaused') || has('isLectureEnded')) {
      $('stu-badge-live').classList.toggle('hidden', !(s.isLectureStarted && !s.isPaused));
      $('stu-badge-paused').classList.toggle('hidden', !(s.isLectureStarted && s.isPaused));
      $('stu-wifi-chip').classList.toggle('hidden', !s.isLectureStarted);
      $('stu-download-btn').classList.toggle('hidden', !(s.isLectureEnded && s.subtitles.length > 0));
      $('stu-pause-overlay').classList.toggle('hidden', !(s.isLectureStarted && s.isPaused));
    }
    if (has('connectionQuality')) {
      const chip = $('stu-wifi-chip');
      chip.className = 'chip chip-wifi ' + s.connectionQuality + (s.isLectureStarted ? '' : ' hidden');
      chip.title = '회선 품질: ' + (s.connectionQuality === 'good' ? '좋음 (손실률 0.3%)' : s.connectionQuality === 'fair' ? '보통 (손실률 2.1%)' : '나쁨 (손실률 7.4%)');
    }
    if (has('currentPage') || has('totalPages') || has('slideStatus')) {
      const show = s.slideStatus === 'ready' && s.totalPages > 0;
      $('stu-page-chip').classList.toggle('hidden', !show);
      $('stu-page-cur').textContent = s.currentPage;
      $('stu-page-total').textContent = s.totalPages;
    }
    if (has('ttsPlayingId')) {
      $('stu-tts-chip').classList.toggle('hidden', !s.ttsPlayingId || prefs.audioLang !== 'en');
    }

    // 스테이지 상태
    if (has('slideStatus') || has('presentationMode') || has('isScreenSharing') || has('isLectureStarted') || has('currentPage') || has('materialMode')) {
      const slideReady = s.presentationMode === 'slide' && s.slideStatus === 'ready';
      const screenLive = s.presentationMode === 'screen' && s.isScreenSharing;
      $('stu-waiting').classList.toggle('hidden', slideReady || screenLive);
      $('stu-slide-img').classList.toggle('hidden', !slideReady);
      stuCanvas.classList.toggle('hidden', !slideReady);
      $('stu-screen').classList.toggle('hidden', !screenLive);
      $('stu-material-toggle').classList.toggle('hidden', !slideReady);
      if (slideReady) {
        const page = B.slides.pages[s.currentPage - 1];
        $('stu-slide-img').src = s.materialMode === 'original' ? page.koUrl : page.enUrl;
        document.querySelectorAll('#stu-material-toggle span').forEach(function (sp) {
          sp.classList.toggle('active', sp.getAttribute('data-mode') === s.materialMode);
        });
        requestAnimationFrame(function () { redrawStudentCanvas(s); });
      }
      const waitText = $('stu-waiting-text');
      if (!s.isConnected) waitText.textContent = 'Connecting to server...';
      else if (!s.isLectureStarted) waitText.textContent = s.isLectureEnded ? 'The lecture has ended.' : 'Waiting for the lecture to start...';
      else waitText.textContent = 'Loading lecture material...';
    }

    // 판서/커서 미러링
    if (has('strokesVersion')) { redrawStudentCanvas(s); }
    if (has('cursorPos') || has('spotlightEnabled') || has('spotlightColor') || has('isPaused')) {
      const el = $('stu-spotlight');
      if (s.spotlightEnabled && s.cursorPos && !s.isPaused) {
        el.classList.remove('hidden');
        el.style.left = (s.cursorPos.x * 100) + '%';
        el.style.top = (s.cursorPos.y * 100) + '%';
        B.applySpotlightColor(el, s.spotlightColor);
      } else {
        el.classList.add('hidden');
      }
    }

    // 자막
    if (has('subtitles') || has('activePartial') || has('isLectureStarted')) {
      renderSubtitle(s);
      renderStudentTranscript(s);
    }

    // 자료 목록
    if (has('slideStatus') || has('slideFileName')) renderMaterials(s);

    // 이름
    if (has('studentName')) $('stu-name-text').textContent = s.studentName;

    // PiP
    if (has('slideStatus') || has('currentPage') || has('materialMode') || has('strokesVersion') || has('presentationMode') || has('isLectureStarted')) {
      renderPip(s);
    }
  }

  function renderStudentTranscript(s) {
    const list = $('stu-transcript');
    list.innerHTML = '';
    if (!s.subtitles.length) {
      list.innerHTML = '<p class="transcript-empty">자막이 여기에 표시됩니다</p>';
      return;
    }
    s.subtitles.slice(-3).forEach(function (sub) {
      const item = document.createElement('div');
      item.className = 'transcript-item';
      if (sub.translated) {
        const en = document.createElement('p');
        en.className = 'transcript-en';
        en.innerHTML = '<span class="transcript-tag">[EN]</span>';
        en.appendChild(document.createTextNode(sub.translated));
        item.appendChild(en);
      }
      const ko = document.createElement('p');
      ko.className = 'transcript-ko';
      ko.innerHTML = '<span class="transcript-tag">[한]</span>';
      ko.appendChild(document.createTextNode(sub.original));
      item.appendChild(ko);
      if (sub.translated) {
        const total = ((sub.asrMs || 0) + (sub.nmtMs || 0)) / 1000;
        const cls = total < 3 ? 'lat-good' : (total < 6 ? 'lat-mid' : 'lat-bad');
        const lat = document.createElement('p');
        lat.className = 'transcript-latency';
        lat.innerHTML = 'ASR ' + (sub.asrMs || 0) + 'ms · MT ' + (sub.nmtMs || 0) + 'ms · <span class="' + cls + '">전체 ' + total.toFixed(1) + 's</span>';
        item.appendChild(lat);
      }
      list.appendChild(item);
    });
  }

  function renderMaterials(s) {
    const list = $('stu-materials');
    list.innerHTML = '';
    if (s.slideStatus !== 'ready') {
      list.innerHTML = '<p class="materials-empty">There is no lecture material uploaded yet.</p>';
      return;
    }
    const base = (s.slideFileName || 'material.pdf').replace('.pdf', '');
    [['Original', 'original'], ['Translated', 'translated']].forEach(function (pair) {
      const row = document.createElement('button');
      row.className = 'material-row';
      row.type = 'button';
      row.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
        '<span class="mat-body"><span class="mat-name"></span><span class="mat-meta">' + s.totalPages + ' pages · ' + pair[0] + '</span></span>' +
        '<svg class="mat-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
      row.querySelector('.mat-name').textContent = base + ' (' + pair[0] + ')';
      row.addEventListener('click', function () {
        const page = B.slides.pages[s.currentPage - 1];
        const a = document.createElement('a');
        a.href = pair[1] === 'original' ? page.koUrl : page.enUrl;
        a.download = base + '_p' + s.currentPage + '_' + pair[1] + '.svg';
        a.click();
      });
      list.appendChild(row);
    });
  }

  $('pip-close').addEventListener('click', function () { B.togglePip(false); });

  store.subscribe(render);
  window.addEventListener('resize', function () {
    redrawStudentCanvas(store.get());
    renderPip(store.get());
  });
})();
