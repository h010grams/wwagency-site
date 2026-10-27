/* WW Agency — interactions */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- missing media → keep the branded placeholder ---------- */
  const markMissing = (img) => img.classList.add('is-missing');
  $$('.media-img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener('error', () => markMissing(img), { once: true });
  });

  /* ---------- header: scrolled state ---------- */
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = $('[data-burger]');
  const nav = $('[data-nav]');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- active nav link ---------- */
  const links = $$('.nav__link');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 70 + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- hero video ----------
     The branded placeholder is shown by default; the player switches on only once the video
     (or its poster) has actually loaded. iOS Safari never preloads video, so without this it
     would show an empty grey player when the file is missing. */
  const frame = $('[data-hero-video]');
  if (frame) {
    const video = $('video', frame);
    const playBtn = $('[data-play]', frame);
    const soundBtn = $('[data-sound]', frame);
    const hasVideo = () => frame.classList.contains('has-video');
    playBtn.disabled = true;

    // silent autoplay while visible (skipped for reduced motion / data saver). It is retried once the
    // player becomes visible (Safari won't autoplay hidden video) and on the first tap or click
    // (iOS Low Power Mode allows playback only from a user gesture).
    const autoplayAllowed = !reducedMotion && !(navigator.connection && navigator.connection.saveData);
    let heroInView = false;
    const tryAutoplay = () => {
      if (autoplayAllowed && heroInView && hasVideo() && video.muted && video.paused && !frame.dataset.userPaused) {
        video.play().catch(() => {});
      }
    };

    // has-video: controls active; is-ready: a frame or the poster can be shown
    const enable = () => {
      if (video.error) return;
      frame.classList.add('has-video');
      playBtn.disabled = false;
    };
    const ready = () => {
      if (video.error) return;
      enable();
      frame.classList.add('is-ready');
      tryAutoplay();
    };
    const disable = () => {
      frame.classList.remove('has-video', 'is-ready', 'is-playing');
      playBtn.disabled = true;
    };
    video.addEventListener('error', disable);
    video.addEventListener('loadedmetadata', enable);
    video.addEventListener('loadeddata', ready);
    video.addEventListener('playing', ready);
    video.addEventListener('play', () => frame.classList.add('is-playing'));
    video.addEventListener('pause', () => frame.classList.remove('is-playing'));
    if (video.readyState >= 2) ready();
    else if (video.readyState >= 1) enable();
    if (video.getAttribute('poster')) {
      const poster = new Image();
      poster.onload = ready;
      poster.src = video.poster;
    }

    const syncSound = () => {
      soundBtn.setAttribute('aria-pressed', String(!video.muted));
      soundBtn.setAttribute('aria-label', video.muted ? 'Zapnúť zvuk' : 'Vypnúť zvuk');
    };

    playBtn.addEventListener('click', () => {
      if (!hasVideo()) return;
      if (video.paused) {
        // first explicit play → start from the hook with sound
        if (video.muted && !frame.dataset.started) { video.currentTime = 0; video.muted = false; syncSound(); }
        frame.dataset.started = '1';
        delete frame.dataset.userPaused;
        video.play().catch(() => {});
        playBtn.setAttribute('aria-label', 'Pozastaviť video');
      } else {
        frame.dataset.userPaused = '1';
        video.pause();
        playBtn.setAttribute('aria-label', 'Prehrať video');
      }
    });

    soundBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.paused) video.play().catch(() => {});
      syncSound();
    });

    new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      if (heroInView) tryAutoplay();
      else if (!video.paused) video.pause();
    }, { threshold: 0.4 }).observe(frame);
    ['touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, tryAutoplay, { passive: true }));
  }

  /* ---------- reels carousel ---------- */
  const track = $('[data-reel-track]');
  if (track) {
    const cards = $$('.reel', track);
    const prev = $('[data-reel-prev]');
    const next = $('[data-reel-next]');
    const current = $('[data-reel-current]');
    const pad = (n) => String(n).padStart(2, '0');
    $('[data-reel-total]').textContent = pad(cards.length);

    const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const idx = Math.round(track.scrollLeft / step());
      current.textContent = pad(Math.min(idx, cards.length - 1) + 1);
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- modal: reels video + photo lightbox ---------- */
  const modal = $('[data-modal]');
  const stage = $('[data-modal-stage]');
  const mPrev = $('[data-modal-prev]');
  const mNext = $('[data-modal-next]');
  const photoBtns = $$('[data-photo]');
  let photoIndex = -1;

  const placeholderBox = (source, vertical) => {
    const box = document.createElement('div');
    box.className = 'ph-box' + (vertical ? ' ph-box--v' : '');
    const ph = source.querySelector('.ph');
    if (ph) box.appendChild(ph.cloneNode(true));
    return box;
  };

  const openModal = () => {
    if (!modal.open) modal.showModal();
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => { if (modal.open) modal.close(); };

  modal.addEventListener('close', () => {
    stage.replaceChildren();
    photoIndex = -1;
    document.body.style.overflow = '';
  });
  $('[data-modal-close]').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('modal__inner')) closeModal(); });

  // reels
  $$('[data-video]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mPrev.hidden = mNext.hidden = true;
      const fig = document.createDocumentFragment();
      const video = document.createElement('video');
      video.src = btn.dataset.video;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      const poster = $('img', btn);
      if (poster && !poster.classList.contains('is-missing')) video.poster = poster.src;
      video.addEventListener('error', () => video.replaceWith(placeholderBox(btn, true)), { once: true });
      fig.appendChild(video);
      const cap = document.createElement('figcaption');
      cap.textContent = btn.dataset.title || '';
      fig.appendChild(cap);
      stage.replaceChildren(fig);
      openModal();
    });
  });

  // photos
  const showPhoto = (i) => {
    photoIndex = (i + photoBtns.length) % photoBtns.length;
    const btn = photoBtns[photoIndex];
    const img = $('img', btn);
    const fig = document.createDocumentFragment();
    if (img && !img.classList.contains('is-missing')) {
      const big = document.createElement('img');
      big.alt = img.alt;
      big.addEventListener('error', () => big.replaceWith(placeholderBox(btn, false)), { once: true });
      big.src = img.currentSrc || img.src;
      fig.appendChild(big);
    } else {
      fig.appendChild(placeholderBox(btn, false));
    }
    const cap = document.createElement('figcaption');
    cap.textContent = `${img ? img.alt : ''} · ${photoIndex + 1} / ${photoBtns.length}`;
    fig.appendChild(cap);
    stage.replaceChildren(fig);
  };
  photoBtns.forEach((btn, i) => btn.addEventListener('click', () => {
    mPrev.hidden = mNext.hidden = false;
    showPhoto(i);
    openModal();
  }));
  mPrev.addEventListener('click', () => showPhoto(photoIndex - 1));
  mNext.addEventListener('click', () => showPhoto(photoIndex + 1));
  modal.addEventListener('keydown', (e) => {
    if (photoIndex < 0) return;
    if (e.key === 'ArrowLeft') showPhoto(photoIndex - 1);
    if (e.key === 'ArrowRight') showPhoto(photoIndex + 1);
  });

  /* ---------- reel preview loops ----------
     4-second silent clips (~300 KB) play only for cards that are actually on screen:
     on desktop the visible ones, on a phone the one card in view. Paused while the
     section is off screen or a video/photo is open; skipped for reduced motion / data saver. */
  const reelCards = $$('.reel');
  const dataSaver = navigator.connection && navigator.connection.saveData;
  if (track && reelCards.length && !reducedMotion && !dataSaver && 'IntersectionObserver' in window) {
    const inView = new Set();
    let sectionVisible = false;

    const activate = (card, v) => {
      if (!v.getAttribute('src')) {
        // Show the clip right away with the cover as its poster: nothing changes visually, and
        // Safari doesn't treat it as a hidden video (those are not allowed to autoplay).
        const cover = $('.reel__img', card);
        if (cover && !cover.classList.contains('is-missing')) v.poster = cover.currentSrc || cover.src;
        v.muted = true;
        v.src = v.dataset.preview;
        card.classList.add('is-previewing');
      }
      v.play().catch(() => {});
    };

    const syncPreviews = () => {
      reelCards.forEach((card) => {
        const v = $('.reel__preview', card);
        if (!v) return;
        if (sectionVisible && !modal.open && inView.has(card)) activate(card, v);
        else if (!v.paused) v.pause();
      });
    };

    reelCards.forEach((card) => {
      const v = $('.reel__preview', card);
      if (!v) return;
      v.addEventListener('error', () => card.classList.remove('is-previewing'));
    });

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
      syncPreviews();
    }, { root: track, threshold: 0.75 });
    reelCards.forEach((card) => cardObserver.observe(card));

    new IntersectionObserver(([e]) => { sectionVisible = e.isIntersecting; syncPreviews(); }, { threshold: 0.25 }).observe(track);

    // pause behind the lightbox / video modal, resume when it closes
    $$('[data-video], [data-photo]').forEach((b) => b.addEventListener('click', () => setTimeout(syncPreviews, 0)));
    modal.addEventListener('close', syncPreviews);
    // iOS Low Power Mode: clips may only start from a user gesture, so retry on taps/clicks
    ['touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, syncPreviews, { passive: true }));
  }

  /* ---------- service CTA → preselect service in the form ---------- */
  const serviceSelect = $('[data-service-select]');
  $$('[data-service]').forEach((a) => a.addEventListener('click', () => {
    serviceSelect.value = a.dataset.service;
    const wrap = serviceSelect.parentElement;
    wrap.classList.remove('is-flash');
    void wrap.offsetWidth;
    wrap.classList.add('is-flash');
  }));

  /* ---------- contact form ---------- */
  const form = $('[data-form]');
  if (form) {
    const status = $('[data-status]', form);
    const submit = $('[data-submit]', form);
    const consent = $('input[name="suhlas"]', form);

    const validate = () => {
      let firstInvalid = null;
      $$('input[required]:not([type="checkbox"])', form).forEach((input) => {
        const ok = input.value.trim() !== '' && input.checkValidity();
        input.closest('.field').classList.toggle('is-invalid', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      const consentOk = consent.checked;
      consent.closest('.consent').classList.toggle('is-invalid', !consentOk);
      if (!consentOk && !firstInvalid) firstInvalid = consent;
      return firstInvalid;
    };

    form.addEventListener('input', (e) => {
      const field = e.target.closest('.field.is-invalid');
      if (field && e.target.checkValidity() && e.target.value.trim()) field.classList.remove('is-invalid');
      if (e.target === consent && consent.checked) consent.closest('.consent').classList.remove('is-invalid');
    });

    const setStatus = (msg, type) => {
      status.textContent = msg;
      status.className = 'form__status' + (type ? ' is-' + type : '');
    };

    const success = $('[data-success]', form);
    const showSuccess = (sent) => {
      form.classList.toggle('is-sent', sent);
      success.hidden = !sent;
      if (sent) $('[data-success-title]', success).focus();
    };
    $('[data-reset]', form).addEventListener('click', () => {
      showSuccess(false);
      setStatus('');
      $('input[name="meno"]', form).focus();
    });

    // what lands in the inbox: readable labels instead of field names
    const toMessage = (data) => ({
      'Meno a priezvisko': data.meno,
      'Realitná kancelária / Maklér': data.kancelaria || '—',
      'Telefón': data.telefon,
      email: data.email, // also used as reply-to by Web3Forms / Formspree
      'Služba': data.sluzba,
      'Správa / Odkaz na nehnuteľnosť': data.sprava || '—',
      'Informácie o ochrane osobných údajov': 'Oboznámil(a) sa',
    });

    const buildPayload = (data, endpoint, key) => {
      const subject = `Nový dopyt z webu: ${data.sluzba} — ${data.meno}`;
      const fields = toMessage(data);
      if (/web3forms\.com/.test(endpoint)) return { access_key: key, subject, from_name: 'WW Agency — web', ...fields };
      if (/formspree\.io/.test(endpoint)) return { _subject: subject, ...fields };
      return { subject, ...fields };
    };

    const openMailClient = (data) => {
      const body = Object.entries(toMessage(data))
        .filter(([label]) => label !== 'Informácie o ochrane osobných údajov')
        .map(([label, value]) => `${label === 'email' ? 'E-mail' : label}: ${value}`)
        .join('\n');
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent('Dopyt z webu — ' + data.sluzba)}&body=${encodeURIComponent(body)}`;
      setStatus('Otvorili sme váš e-mailový klient so správou. Stačí ju odoslať.', 'success');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submit.disabled) return;
      const invalid = validate();
      if (invalid) {
        invalid.focus();
        setStatus('Skontrolujte, prosím, označené polia.', 'error');
        return;
      }

      const data = Object.fromEntries(new FormData(form));

      // honeypot filled → a bot; pretend it went through
      if (data.botcheck) { form.reset(); showSuccess(true); return; }

      const endpoint = form.dataset.endpoint || '';
      const key = (form.dataset.accessKey || '').trim();
      const needsKey = /web3forms\.com/.test(endpoint);
      if (!endpoint || (needsKey && (!key || key.startsWith('YOUR_')))) {
        console.warn('Form: endpoint / Web3Forms access key is not set — falling back to mailto.');
        openMailClient(data);
        return;
      }

      submit.disabled = true;
      setStatus('Odosielame…');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(buildPayload(data, endpoint, key)),
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) throw new Error(json.message || 'HTTP ' + res.status);
        form.reset();
        setStatus('');
        showSuccess(true);
      } catch (err) {
        console.error('Form submit failed:', err);
        setStatus(`Odoslanie sa nepodarilo. Skúste to znova alebo nám napíšte na ${form.dataset.mailto}.`, 'error');
      } finally {
        clearTimeout(timer);
        submit.disabled = false;
      }
    });
  }
})();
