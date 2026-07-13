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

  // Ocultar/mostrar al hacer scroll
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

  // Hamburger — toggle menú mobile
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
    });

    // Cerrar al tocar un link del menú mobile
    mobileNav.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

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
   3. PAINT REVEAL HERO (Fijo - Sin Carrusel)
   ───────────────────────────────────────────────────────────── */
(function initPaintRevealHero() {
  const canvas = document.querySelector(".proyecto-reveal--hero .reveal-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Ajustes internos del canvas (resolución lógica independiente del tamaño CSS)
  const INTERNAL_W = 600;
  const INTERNAL_H = 800;
  const BRUSH      = 55; // Grosor del pincel

  canvas.width  = INTERNAL_W;
  canvas.height = INTERNAL_H;

  // Canvas auxiliares para el efecto compuesto de revelado
  const topCanvas  = document.createElement("canvas");
  topCanvas.width  = INTERNAL_W;
  topCanvas.height = INTERNAL_H;
  const topCtx = topCanvas.getContext("2d");

  const maskCanvas  = document.createElement("canvas");
  maskCanvas.width  = INTERNAL_W;
  maskCanvas.height = INTERNAL_H;
  const maskCtx = maskCanvas.getContext("2d");

  let antesImg   = null;
  let despuesImg = null;
  let imagesReady  = false;
  let isDrawing    = false;

  // Rutas directas a tus dos assets fijos
  const ASSETS_HERO = {
    antes:   "assets/antes.png",
    despues: "assets/despues.png"
  };

  function draw() {
    if (!imagesReady) return;

    ctx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
    // 1. Dibujamos el "después" de fondo
    ctx.drawImage(despuesImg, 0, 0, INTERNAL_W, INTERNAL_H);

    // 2. Preparamos el "antes" en el canvas virtual superior
    topCtx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
    topCtx.drawImage(antesImg, 0, 0, INTERNAL_W, INTERNAL_H);
    
    // 3. Restamos el camino que pintó el usuario mediante la máscara
    topCtx.globalCompositeOperation = "destination-out";
    topCtx.drawImage(maskCanvas, 0, 0);
    topCtx.globalCompositeOperation = "source-over";

    // 4. Pintamos el resultado arriba del fondo
    ctx.drawImage(topCanvas, 0, 0);
  }

  function paintAt(x, y, radius) {
    const gradient = maskCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0,   "rgba(0,0,0,1)");
    gradient.addColorStop(0.7, "rgba(0,0,0,0.8)");
    gradient.addColorStop(1,   "rgba(0,0,0,0)");
    
    maskCtx.fillStyle = gradient;
    maskCtx.beginPath();
    maskCtx.arc(x, y, radius, 0, Math.PI * 2);
    maskCtx.fill();
  }

  function getCoords(e) {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = INTERNAL_W / rect.width;
    const scaleY = INTERNAL_H / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY
    };
  }

  // Eventos de Mouse
  canvas.addEventListener("mousedown", e => {
    if (!imagesReady) return;
    isDrawing = true;
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing || !imagesReady) return;
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  });

  window.addEventListener("mouseup", () => { isDrawing = false; });
  canvas.addEventListener("mouseleave", () => { isDrawing = false; });

  // Eventos Touch (Mobile)
  canvas.addEventListener("touchstart", e => {
    if (!imagesReady) return;
    e.preventDefault();
    isDrawing = true;
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    if (!isDrawing || !imagesReady) return;
    e.preventDefault();
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  }, { passive: false });

  window.addEventListener("touchend", () => { isDrawing = false; });

  // Helper para promesas de imágenes
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Carga e inicialización de imágenes fijas
  canvas.classList.add("is-loading");
  Promise.all([
    loadImage(ASSETS_HERO.antes),
    loadImage(ASSETS_HERO.despues)
  ])
  .then(([antes, despues]) => {
    antesImg   = antes;
    despuesImg = despues;
    imagesReady = true;
    
    maskCtx.clearRect(0, 0, INTERNAL_W, INTERNAL_H); // Máscara limpia al inicio
    canvas.classList.remove("is-loading");
    draw();
  })
  .catch(err => {
    console.error("Error cargando imágenes del Hero:", err);
    canvas.classList.remove("is-loading");
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
    ctx.fillStyle = "#333";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Error al cargar la experiencia visual", 300, 400);
  });
})();

/* ─────────────────────────────────────────────────────────────
   4. PROGRAMA
   ───────────────────────────────────────────────────────────── */

(function () {
  const isMobile = () => window.innerWidth <= 768;

  const buttons = document.querySelectorAll(".programa__tab-btn");
  const panels = document.querySelectorAll(".programa__panel");

  function closeAll() {
    buttons.forEach(btn => btn.classList.remove("is-active"));
    panels.forEach(panel => panel.classList.remove("is-active"));
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(
        button.getAttribute("aria-controls")
      );

      // MOBILE → comportamiento acordeón (abre/cierra)
      if (isMobile()) {
        const alreadyOpen = button.classList.contains("is-active");

        closeAll();

        if (!alreadyOpen) {
          button.classList.add("is-active");
          panel.classList.add("is-active");
        }

        return;
      }

      // DESKTOP → comportamiento de tabs
      closeAll();
      button.classList.add("is-active");
      panel.classList.add("is-active");
    });
  });

  // Reordenar para mobile (solo una vez)
  if (isMobile()) {
    document.querySelectorAll(".programa__tab-btn").forEach(btn => {
      const targetId = btn.getAttribute("aria-controls");
      const panel = document.getElementById(targetId);

      // Evita crear wrappers duplicados si el script vuelve a ejecutarse
      if (btn.parentElement.classList.contains("mobile-accordion-group")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "mobile-accordion-group";

      btn.parentNode.insertBefore(wrapper, btn);
      wrapper.appendChild(btn);
      wrapper.appendChild(panel);
    });
  }
})();

/* ============================================================
   DIFERENCIALES - CARRUSEL MOBILE
   ============================================================ */

(function () {

  const cards = document.querySelectorAll('.flip-card');
  const dots = document.querySelectorAll('.differentials__dots .dot');

  if (!cards.length || !dots.length) return;

  let current = 0;
  let startX = 0;
  let endX = 0;

  function showCard(index) {

    if (index < 0) index = 0;
    if (index > cards.length - 1) index = cards.length - 1;

    current = index;

    const gap = 24; // espacio entre cards

cards.forEach(card => {
  card.style.transform = `translateX(calc(-${index * 100}% - ${index * gap}px))`;
});

    dots.forEach(dot => dot.classList.remove('is-active'));
    dots[index].classList.add('is-active');
  }


  // Click en puntitos
  dots.forEach((dot, index) => {

    dot.addEventListener('click', () => {
      showCard(index);
    });

  });


  // Swipe táctil
  cards.forEach(card => {

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });


    card.addEventListener('touchend', (e) => {

      endX = e.changedTouches[0].clientX;

      const distance = startX - endX;

      // deslizar hacia la izquierda → siguiente
      if (distance > 50 && current < cards.length - 1) {
        showCard(current + 1);
      }

      // deslizar hacia la derecha → anterior
      if (distance < -50 && current > 0) {
        showCard(current - 1);
      }

    });

  });


  function checkMobile() {

    if (window.innerWidth <= 768) {

      cards.forEach(card => {
        card.style.transition = "transform 0.35s ease";
      });

      showCard(current);

    } else {

      cards.forEach(card => {
        card.style.transform = "";
      });

    }

  }


  window.addEventListener("resize", checkMobile);

  checkMobile();

})();

/* ============================================================
   FLIP CARDS MOBILE - TAP PARA GIRAR
   ============================================================ */

document.querySelectorAll('.flip-card').forEach(card => {

  card.addEventListener('click', () => {

    if (window.innerWidth <= 768) {
      card.classList.toggle('is-flipped');
    }

  });

});

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