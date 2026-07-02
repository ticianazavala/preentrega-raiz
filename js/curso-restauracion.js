/* ============================================================
   RAÍZ — curso-restauracion.js
   Vanilla JS — sin librerías externas.
   Página autocontenida: no depende de script.js (ese archivo
   apunta a elementos exclusivos del Home, como el paint-reveal
   de Proyectos o las flip-cards de Cursos).
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. NAVBAR — mismo comportamiento que el Home (ocultar al bajar,
      mostrar al subir). Se reimplementa acá porque este archivo
      es independiente de script.js.
   ───────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY > 80) {
          navbar.classList.toggle('navbar--hidden', currentY > lastY);
        } else {
          navbar.classList.remove('navbar--hidden');
        }
        lastY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   2. SMOOTH SCROLL — "Inscribirme" y "Ver programa"
   ───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   3. COMPARADOR BEFORE / AFTER — arrastrable, mouse + touch
   ───────────────────────────────────────────────────────────── */
(function initBeforeAfter() {
  const slider  = document.getElementById('baSlider');
  const before  = document.getElementById('baBefore');
  const handle  = document.getElementById('baHandle');
  if (!slider || !before || !handle) return;

  let dragging = false;

  function setPosition(percent) {
    const clamped = Math.min(100, Math.max(0, percent));
    before.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    handle.style.left = `${clamped}%`;
    handle.setAttribute('aria-valuenow', Math.round(clamped));
  }

  function percentFromClientX(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onMove(e) {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(percentFromClientX(clientX));
  }

  function startDrag(e) {
    dragging = true;
    onMove(e);
  }

  function stopDrag() {
    dragging = false;
  }

  handle.addEventListener('mousedown', startDrag);
  slider.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', stopDrag);

  handle.addEventListener('touchstart', startDrag, { passive: true });
  slider.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', stopDrag);

  /* Accesibilidad: mover con teclado (flechas) */
  handle.addEventListener('keydown', (e) => {
    const current = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft')  setPosition(current - 5);
    if (e.key === 'ArrowRight') setPosition(current + 5);
  });

  /* Posición inicial: 50% */
  setPosition(50);
})();


/* ─────────────────────────────────────────────────────────────
   PROGRAMA — accordion de clases
   ───────────────────────────────────────────────────────────── */
(function initPrograma() {

  const accordion = document.getElementById('programaAccordion');
  if (!accordion) return;

  const triggers = accordion.querySelectorAll('.programa__trigger');

  function openPanel(trigger) {
    const panelId = trigger.getAttribute('aria-controls');
    const panel   = document.getElementById(panelId);
    if (!panel) return;

    trigger.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
  }

  function closePanel(trigger) {
    const panelId = trigger.getAttribute('aria-controls');
    const panel   = document.getElementById(panelId);
    if (!panel) return;

    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      /* Cerrar todos */
      triggers.forEach(closePanel);

      /* Si no estaba abierto, abrirlo */
      if (!isExpanded) {
        openPanel(trigger);
      }
      /* Si ya estaba abierto y el usuario hizo click de nuevo,
         queda cerrado (toggle natural). Quitá estas líneas si
         preferís que siempre haya uno abierto. */
    });
  });

  /* Teclado: las flechas arriba/abajo mueven el foco entre triggers */
  accordion.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

    const list  = [...triggers];
    const index = list.indexOf(document.activeElement);
    if (index === -1) return;

    e.preventDefault();

    let next;
    if (e.key === 'ArrowDown') next = list[(index + 1) % list.length];
    if (e.key === 'ArrowUp')   next = list[(index - 1 + list.length) % list.length];
    if (e.key === 'Home')      next = list[0];
    if (e.key === 'End')       next = list[list.length - 1];

    next?.focus();
  });

})();

/* ─────────────────────────────────────────────────────────────
   5. TESTIMONIOS — carrusel con autoplay + flechas manuales
   ───────────────────────────────────────────────────────────── */
(function initTestimonios() {
  const items = document.querySelectorAll('.testimonio');
  const btnPrev = document.getElementById('testiPrev');
  const btnNext = document.getElementById('testiNext');
  if (!items.length) return;

  let activeIndex = 0;
  const AUTOPLAY_MS = 5000;
  let autoplayTimer = null;

  function show(index) {
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === activeIndex);
    });
  }

  function next() { show(activeIndex + 1); }
  function prev() { show(activeIndex - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (btnNext) btnNext.addEventListener('click', () => { next(); startAutoplay(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { prev(); startAutoplay(); });

  show(0);
  startAutoplay();
})();

// ─────────────────────────────────────────────────────────────
// INSCRIPCIÓN — validación y envío del formulario
// ─────────────────────────────────────────────────────────────
(function initInscripcion() {

  const btn      = document.getElementById('inscripcionBtn');
  if (!btn) return;

  const nombre   = document.getElementById('insc-nombre');
  const email    = document.getElementById('insc-email');
  const celular  = document.getElementById('insc-celular');

  // Feedback inline (se inserta después del botón si no existe)
  let feedback = btn.parentElement.querySelector('.inscripcion__feedback');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.className = 'inscripcion__feedback';
    btn.insertAdjacentElement('afterend', feedback);
  }

  function showFeedback(msg, isError = false) {
    feedback.textContent = msg;
    feedback.style.color = isError ? '#ffe0d0' : '#fff';
    feedback.classList.add('is-visible');
  }

  function clearFeedback() {
    feedback.classList.remove('is-visible');
    feedback.textContent = '';
  }

  function markError(input) {
    input.style.borderBottomColor = '#ffe0d0';
  }

  function clearError(input) {
    input.style.borderBottomColor = '';
  }

  [nombre, email, celular].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      clearError(input);
      clearFeedback();
    });
  });

  btn.addEventListener('click', () => {

    clearFeedback();
    let valid = true;

    // Nombre
    if (!nombre.value.trim()) {
      markError(nombre);
      valid = false;
    } else {
      clearError(nombre);
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
      markError(email);
      valid = false;
    } else {
      clearError(email);
    }

    if (!valid) {
      showFeedback('Por favor completá los campos requeridos.', true);
      return;
    }

    // Simulación de envío
    // Reemplazá este bloque por tu lógica real (fetch, mailto, etc.)
    btn.classList.add('is-loading');
    btn.textContent = 'Enviando…';

    setTimeout(() => {
      btn.classList.remove('is-loading');
      btn.classList.add('is-sent');
      btn.textContent = '¡Solicitud enviada!';
      showFeedback('Nos ponemos en contacto a la brevedad 🎉');

      // Reset opcional después de 5 segundos
      setTimeout(() => {
        btn.classList.remove('is-sent');
        btn.textContent = 'Solicitar inscripción';
        nombre.value  = '';
        email.value   = '';
        celular.value = '';
        clearFeedback();
      }, 5000);

    }, 1400);

  });

})();