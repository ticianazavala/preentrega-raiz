/* ============================================================
   RAÍZ — script.js
   Vanilla JS — no external libraries
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. NAVBAR — hide on scroll down, show on scroll up
   ───────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const burger   = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');

  let lastY     = window.scrollY;
  let ticking   = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        // Only hide after scrolling past 80px
        if (currentY > 80) {
          if (currentY > lastY) {
            navbar.classList.add('navbar--hidden');
          } else {
            navbar.classList.remove('navbar--hidden');
          }
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

  // Hamburger toggle
  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   2. SMOOTH SCROLL — "Conocer más" and "Ver cursos" buttons
   ───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('.js-scroll-cursos').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('cursos');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   3. PROCESO — hover-to-reveal cards (pop animation, one at a time)
   ───────────────────────────────────────────────────────────── */
(function initProceso() {
  const buttons = document.querySelectorAll('.proceso__icon-btn');
  const cards   = document.querySelectorAll('.proceso__card');

  function hideAll() {
    cards.forEach(card => {
      card.hidden = true;
    });
    buttons.forEach(btn => {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  buttons.forEach(btn => {
    // 🎯 EVENTO A: Cuando el mouse ENTRA al botón
    btn.addEventListener('mouseenter', () => {
      const step       = btn.dataset.step;
      const targetCard = document.getElementById('card-' + step);

      // Limpiamos cualquier otra tarjeta abierta primero
      hideAll();

      if (targetCard) {
        targetCard.hidden = false;
        // Forzamos el re-paint para que tu animación 'popIn' de CSS explote de forma fluida
        void targetCard.offsetWidth; 
        btn.classList.add('is-active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // 🎯 EVENTO B: Cuando el mouse SALE del botón
    btn.addEventListener('mouseleave', () => {
      // Escondemos todo para que la sección quede limpia y vacía con su altura fija
      hideAll();
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   4. PAINT REVEAL — canvas-based brush effect for Proyectos
   ───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   4. PAINT REVEAL + CARRUSEL DE PROYECTOS
   ───────────────────────────────────────────────────────────── */
(function initPaintReveal() {

  /* ── 1. DATOS DE PROYECTOS ─────────────────────────────── */
  /*
     Agregá o quitá objetos de este array para sumar proyectos.
     "color" se aplica como borde/fondo del widget central
     y como overlay sobre las cards laterales.
  */
  const PROYECTOS = [
    {
      antes:   "assets/proyecto-antes-01.jpg",
      despues: "assets/proyecto-despues-01.jpg",
      nombre:  "RECUPERACIÓN INTEGRAL",
      fecha:   "14/04/2026",
      color:   "#fd96c0"   // rosa
    },
    {
      antes:   "assets/proyecto-antes-02.jpg",
      despues: "assets/proyecto-despues-02.jpg",
      nombre:  "INTERVENCIÓN CROMÁTICA",
      fecha:   "02/03/2026",
      color:   "#fd96c0"   // rosa
    },
    {
      antes:   "assets/proyecto-antes-03.jpg",
      despues: "assets/proyecto-despues-03.jpg",
      nombre:  "RESTAURACIÓN VINTAGE",
      fecha:   "20/01/2026",
      color:   "#fd96c0"   // rosa
    }
  ];

  /* ── 2. REFERENCIAS AL DOM ─────────────────────────────── */
  const canvas   = document.querySelector(".reveal-canvas");
  const ctx      = canvas.getContext("2d");

  const revealEl = document.getElementById("reveal-1");
  const nameEl   = document.getElementById("reveal-name");
  const dateEl   = document.getElementById("reveal-date");

  const imgPrev  = document.getElementById("img-prev");
  const imgNext  = document.getElementById("img-next");
  const cardPrev = document.getElementById("card-prev");
  const cardNext = document.getElementById("card-next");

  const btnPrev  = document.getElementById("carousel-prev");
  const btnNext  = document.getElementById("carousel-next");

  /* ── 3. CONFIGURACIÓN DEL CANVAS ──────────────────────── */
  const INTERNAL_W = 600;
  const INTERNAL_H = 800;
  const BRUSH      = 55;

  canvas.width  = INTERNAL_W;
  canvas.height = INTERNAL_H;

  /* Canvas auxiliares (se crean una sola vez) */
  const topCanvas  = document.createElement("canvas");
  topCanvas.width  = INTERNAL_W;
  topCanvas.height = INTERNAL_H;
  const topCtx = topCanvas.getContext("2d");

  const maskCanvas  = document.createElement("canvas");
  maskCanvas.width  = INTERNAL_W;
  maskCanvas.height = INTERNAL_H;
  const maskCtx = maskCanvas.getContext("2d");

  /* ── 4. ESTADO ─────────────────────────────────────────── */
  let activeIndex  = 0;
  let antesImg     = null;
  let despuesImg   = null;
  let imagesReady  = false;
  let isDrawing    = false;

  /* ── 5. FUNCIONES DE DIBUJO (idénticas al original) ────── */
  function draw() {
    if (!imagesReady) return;

    ctx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
    ctx.drawImage(despuesImg, 0, 0, INTERNAL_W, INTERNAL_H);

    topCtx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
    topCtx.drawImage(antesImg, 0, 0, INTERNAL_W, INTERNAL_H);
    topCtx.globalCompositeOperation = "destination-out";
    topCtx.drawImage(maskCanvas, 0, 0);
    topCtx.globalCompositeOperation = "source-over";

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

  /* ── 6. EVENTOS DE PINTURA ─────────────────────────────── */
  canvas.addEventListener("mousedown", e => {
    if (!imagesReady) return;
    isDrawing = true;
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing || !imagesReady) return;
    const p = getCoords(e); paintAt(p.x, p.y, BRUSH); draw();
  });

  window.addEventListener("mouseup",    () => { isDrawing = false; });
  canvas.addEventListener("mouseleave", () => { isDrawing = false; });

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

  /* ── 7. CARGA DE PROYECTO ──────────────────────────────── */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function resetMask() {
    maskCtx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
  }

  function loadProject(index) {
    const proyecto = PROYECTOS[index];

    /* Deshabilitar interacción mientras carga */
    imagesReady = false;
    isDrawing   = false;
    canvas.classList.add("is-loading");

    /* Actualizar textos y color */
    nameEl.textContent = proyecto.nombre;
    dateEl.textContent = proyecto.fecha;
    revealEl.style.borderColor = proyecto.color;
    revealEl.style.background  = proyecto.color;

    /* Actualizar cards laterales */
    const prevIndex = (index - 1 + PROYECTOS.length) % PROYECTOS.length;
    const nextIndex = (index + 1) % PROYECTOS.length;

    const prevProyecto = PROYECTOS[prevIndex];
    const nextProyecto = PROYECTOS[nextIndex];

    imgPrev.src = prevProyecto.antes;
    imgNext.src = nextProyecto.antes;

    /* Color overlay lateral */
    cardPrev.querySelector(".proyecto-card__inner--side")
            .style.setProperty("--side-color", prevProyecto.color);
    cardNext.querySelector(".proyecto-card__inner--side")
            .style.setProperty("--side-color", nextProyecto.color);

    /* Deshabilitar flechas si hay un solo proyecto */
    const soloUno = PROYECTOS.length <= 1;
    btnPrev.disabled = soloUno;
    btnNext.disabled = soloUno;

    /* Cargar imágenes del proyecto activo */
    Promise.all([
      loadImage(proyecto.antes),
      loadImage(proyecto.despues)
    ])
    .then(([antes, despues]) => {
      antesImg  = antes;
      despuesImg = despues;

      resetMask();    // limpia la máscara → el "antes" vuelve a cubrirlo todo
      imagesReady = true;
      canvas.classList.remove("is-loading");
      draw();
    })
    .catch(err => {
      console.error("Error cargando imágenes:", err);
      canvas.classList.remove("is-loading");

      ctx.fillStyle = "#ddd";
      ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
      ctx.fillStyle = "#444";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No se pudieron cargar las imágenes", 300, 400);
    });
  }

  /* ── 8. NAVEGACIÓN: FLECHAS Y CARDS ────────────────────────────── */

// Esta función se encarga SOLO del aspecto visual de la flecha izquierda
function updateArrowState() {
  const btnPrev = document.getElementById("carousel-prev");
  // Si estamos en el proyecto 0, se pone gris (clase is-disabled)
  btnPrev.classList.toggle("is-disabled", activeIndex === 0);
}

// Lógica de flecha anterior
btnPrev.addEventListener("click", () => {
  if (activeIndex === 0) return; // Si es el primero, no hace nada
  activeIndex = (activeIndex - 1 + PROYECTOS.length) % PROYECTOS.length;
  loadProject(activeIndex);
  updateArrowState();
});

// Lógica de flecha siguiente
btnNext.addEventListener("click", () => {
  activeIndex = (activeIndex + 1) % PROYECTOS.length;
  loadProject(activeIndex);
  updateArrowState();
});

// Lógica de card anterior (¡SIEMPRE FUNCIONA!)
cardPrev.addEventListener("click", () => {
  activeIndex = (activeIndex - 1 + PROYECTOS.length) % PROYECTOS.length;
  loadProject(activeIndex);
  updateArrowState();
});

// Lógica de card siguiente
cardNext.addEventListener("click", () => {
  activeIndex = (activeIndex + 1) % PROYECTOS.length;
  loadProject(activeIndex);
  updateArrowState();
});

// Llamada inicial para establecer el estado al cargar la página
updateArrowState();

  /* ── 9. NAVEGACIÓN: SWIPE MOBILE ───────────────────────── */
  let swipeStartX = null;
  const SWIPE_THRESHOLD = 50; // px mínimos para contar como swipe

  /*
     Usamos el grid completo (no el canvas) para capturar el swipe,
     así el canvas sigue recibiendo sus propios eventos de pintura.
  */
  const gridEl = document.querySelector(".proyectos__grid");

  gridEl.addEventListener("touchstart", e => {
    /* Si el toque empieza dentro del canvas, no interferimos */
    if (e.target === canvas) return;
    swipeStartX = e.touches[0].clientX;
  }, { passive: true });

  gridEl.addEventListener("touchend", e => {
    if (swipeStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX;
    swipeStartX  = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      /* Swipe izquierda → siguiente */
      activeIndex = (activeIndex + 1) % PROYECTOS.length;
    } else {
      /* Swipe derecha → anterior */
      activeIndex = (activeIndex - 1 + PROYECTOS.length) % PROYECTOS.length;
    }
    loadProject(activeIndex);
  }, { passive: true });

  /* ── 10. INICIO ────────────────────────────────────────── */
  loadProject(activeIndex);

})();

function checkAnswer(cardId, userChoice) {
  const card = document.getElementById(cardId);
  // Obtenemos si es Realidad (true) o Mito (false) desde el HTML
  const isActuallyTrue = card.getAttribute('data-correct') === 'true';

  if (userChoice === isActuallyTrue) {
    card.classList.add('flipped');
  } else {
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
  }
}

function flipBack(cardId) {
  document.getElementById(cardId).classList.remove('flipped');
}

/* ─────────────────────────────────────────────────────────────
   5. CURSOS — flip cards (hover on desktop, click on touch)
   ───────────────────────────────────────────────────────────── */
(function initCursoFlip() {
  const cards = document.querySelectorAll('.curso-flip');

  // Detect coarse pointer (touch device)
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (isTouch) {
    // Touch: toggle on click, only one open at a time
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const isFlipped = card.classList.contains('is-flipped');
        // Close all
        cards.forEach(c => c.classList.remove('is-flipped'));
        // Toggle clicked
        if (!isFlipped) card.classList.add('is-flipped');
      });
    });
  } else {
    // Desktop: hover, only one flipped at a time
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        // Close any currently flipped card
        cards.forEach(c => { if (c !== card) c.classList.remove('is-flipped'); });
        card.classList.add('is-flipped');
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-flipped');
      });
    });
  }
})();


/* ─────────────────────────────────────────────────────────────
   6. CÁPSULA — tooltip via keyboard focus (already CSS-driven
      for hover; this adds keyboard support)
   ───────────────────────────────────────────────────────────── */
(function initCapsulas() {
  // Hotspot focus shows tooltip via CSS :focus sibling selector
  // The CSS already handles hover. Keyboard (focus/blur) is handled
  // by the tabindex="0" on .capsula__hotspot + CSS selector.
  // No extra JS needed for basic behavior, but we add ESC to close.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.activeElement && document.activeElement.classList.contains('capsula__hotspot')) {
        document.activeElement.blur();
      }
    }
  });
})();
