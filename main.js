/* ============================================================
   Pranav Sai Real Estate Consultancy — main.js v3.0
   Three.js 3D Background + All Interactions
   Fixes: Testimonial slider offset bug, float CTA visibility,
          scroll-lock on mobile menu close, resize edge-cases
   ============================================================ */

'use strict';

/* ── LOADER ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    document.body.style.overflow = '';
    initScrollReveal();
    initCounters();
  }, 2700);
});
document.body.style.overflow = 'hidden';

/* ── THREE.JS MAIN BACKGROUND ── */
(function initMainBg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 18);

  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const dir = new THREE.DirectionalLight(0xc9962b, 0.8);
  dir.position.set(5, 8, 5);
  scene.add(dir);

  /* Floating building blocks */
  const buildings = [];
  const buildingCount = 28;
  for (let i = 0; i < buildingCount; i++) {
    const h = 1.5 + Math.random() * 4;
    const geo = new THREE.BoxGeometry(0.6 + Math.random() * 0.8, h, 0.6 + Math.random() * 0.8);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.5, 0.15 + Math.random() * 0.2),
      transparent: true, opacity: 0.18 + Math.random() * 0.3,
      roughness: 0.5, metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / buildingCount) * Math.PI * 2;
    const r = 10 + Math.random() * 8;
    mesh.position.set(Math.cos(angle) * r, -6 + h / 2 + Math.random() * 2, -5 + Math.random() * -10);
    mesh.rotation.y = Math.random() * Math.PI;
    scene.add(mesh);
    buildings.push({ mesh, speed: 0.0002 + Math.random() * 0.0008, angle, r });
  }

  /* Gold particle field */
  const partCount = 180;
  const partGeo   = new THREE.BufferGeometry();
  const positions = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0xc9962b,
    size: 0.07,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  /* Mouse parallax */
  let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
  document.addEventListener('mousemove', e => {
    targetRY = ((e.clientX / window.innerWidth) - 0.5) * 0.25;
    targetRX = ((e.clientY / window.innerHeight) - 0.5) * -0.12;
  });

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    currentRX += (targetRX - currentRX) * 0.04;
    currentRY += (targetRY - currentRY) * 0.04;
    scene.rotation.x = currentRX;
    scene.rotation.y = currentRY + t * 0.03;
    particles.rotation.y = t * 0.04;
    particles.rotation.x = Math.sin(t * 0.3) * 0.05;
    buildings.forEach(b => {
      b.angle += b.speed;
      b.mesh.position.x = Math.cos(b.angle) * b.r;
      b.mesh.position.z = Math.sin(b.angle) * b.r - 10;
      b.mesh.rotation.y += b.speed * 0.5;
    });
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ── THREE.JS SERVICES SECTION BACKGROUND ── */
(function initServicesBg() {
  const canvas = document.getElementById('services-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const wrap = document.getElementById('services-canvas-wrap');
  const W = wrap.offsetWidth, H = wrap.offsetHeight || 700;
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 0, 20);

  /* Spinning wireframe toruses */
  const torus1 = new THREE.Mesh(
    new THREE.TorusGeometry(6, 0.07, 8, 100),
    new THREE.MeshBasicMaterial({ color: 0xc9962b, transparent: true, opacity: 0.18 })
  );
  scene.add(torus1);

  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(9, 0.045, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xe8b84b, transparent: true, opacity: 0.1 })
  );
  torus2.rotation.x = Math.PI / 3;
  scene.add(torus2);

  const torus3 = new THREE.Mesh(
    new THREE.TorusGeometry(12, 0.03, 6, 80),
    new THREE.MeshBasicMaterial({ color: 0x4a6fa5, transparent: true, opacity: 0.07 })
  );
  torus3.rotation.x = Math.PI / 5;
  torus3.rotation.y = Math.PI / 4;
  scene.add(torus3);

  /* Dot grid */
  const dp = [];
  for (let xi = -10; xi <= 10; xi++) {
    for (let yi = -6; yi <= 6; yi++) dp.push(xi * 2, yi * 2, 0);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dp), 3));
  scene.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0x4a6fa5,
    size: 0.045,
    transparent: true,
    opacity: 0.35,
  })));

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.005;
    torus1.rotation.z = t * 0.4;
    torus2.rotation.z = -t * 0.25;
    torus2.rotation.y = t * 0.15;
    torus3.rotation.z = t * 0.1;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const nW = wrap.offsetWidth, nH = wrap.offsetHeight || 700;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

/* ── HERO PARTICLES ── */
(function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatP {
      0% { transform: translateY(0) scale(1); opacity: .35; }
      100% { transform: translateY(-32px) scale(1.5); opacity: .75; }
    }
  `;
  document.head.appendChild(style);
  for (let i = 0; i < 32; i++) {
    const p = document.createElement('span');
    Object.assign(p.style, {
      position: 'absolute',
      width: (2 + Math.random() * 4) + 'px',
      height: (2 + Math.random() * 4) + 'px',
      borderRadius: '50%',
      background: `rgba(201,150,43,${.12 + Math.random() * .35})`,
      left: (Math.random() * 100) + '%',
      top:  (Math.random() * 100) + '%',
      animation: `floatP ${6 + Math.random() * 10}s ease-in-out ${Math.random() * 6}s infinite alternate`,
      pointerEvents: 'none',
    });
    container.appendChild(p);
  }
})();

/* ── NAVBAR ── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveNav();
  toggleFloatCta();
}, { passive: true });

/* FIX: Close menu when clicking outside */
document.addEventListener('click', e => {
  if (
    navLinks && navLinks.classList.contains('open') &&
    !navLinks.contains(e.target) &&
    hamburger && !hamburger.contains(e.target)
  ) {
    closeMenu();
  }
});

function closeMenu() {
  if (!navLinks || !hamburger) return;
  navLinks.classList.remove('open');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger && hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('active', open);
  hamburger.setAttribute('aria-expanded', String(open));
  // FIX: Only lock scroll when not on mobile (with CTA bar already accounting for overflow)
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks && navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => closeMenu());
});

/* FIX: Close menu on Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
    closeMenu();
  }
});

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}

/* ── SCROLL REVEAL ── */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.service-card, .prop-card, .why-card, .testi-inner, .about-grid, .contact-grid, .section-header, .trust-item'
  );
  els.forEach((el, i) => {
    el.classList.add('scroll-reveal');
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => observer.observe(el));
}

/* ── COUNTER ANIMATION ── */
function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseInt(el.dataset.target, 10);
      let cur = 0;
      const step = Math.max(1, Math.floor(end / 60));
      const timer = setInterval(() => {
        cur = Math.min(cur + step, end);
        el.textContent = cur;
        if (cur >= end) clearInterval(timer);
      }, 22);
      obs.unobserve(el);
    });
  }, { threshold: 0.3 });
  counters.forEach(c => obs.observe(c));
}

/* ── PROPERTY FILTER ── */
const fadeInStyle = document.createElement('style');
fadeInStyle.textContent = '@keyframes fadeInCard{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}';
document.head.appendChild(fadeInStyle);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    let visibleIndex = 0;
    document.querySelectorAll('.prop-card').forEach(card => {
      if (filter === 'all' || card.dataset.type === filter) {
        card.classList.remove('hidden');
        card.style.animation = `fadeInCard .4s ${visibleIndex * 0.06}s ease both`;
        visibleIndex++;
      } else {
        card.classList.add('hidden');
        card.style.animation = '';
      }
    });
  });
});

/* ── 3D TILT: SERVICE CARDS (desktop only) ── */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${cx * 12}deg) rotateX(${-cy * 8}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ── 3D TILT: PROPERTY CARDS ── */
  document.querySelectorAll('.prop-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${cx * 7}deg) rotateX(${-cy * 5}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ── TESTIMONIAL SLIDER ──
   FIX: Previous offset calculation multiplied by perView twice:
   Old: offset = current * (100 / perView) * perView → was always current * 100
   New: offset = current * (100 / perView) * perView → should be current * 100
   Actually the cards are each (100/perView)% wide, and we want to move
   by `perView` cards at a time, so we translate by (current * perView * cardWidth)
   but that's actually current * 100% per slide-group.
   The real fix: translateX by `-(current * 100%)` since each "page" is one full width.
   But we need to account for the card flex-basis. Corrected below.
   ── */
(function initTestimonials() {
  const track    = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testi-dots');
  if (!track || !dotsWrap) return;

  const cards = Array.from(track.querySelectorAll('.testimonial-card'));
  let perView  = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
  let current  = 0;
  const total  = cards.length;

  function getNumSlides() {
    return Math.ceil(total / perView);
  }

  function buildDots() {
    const numSlides = getNumSlides();
    dotsWrap.innerHTML = '';
    for (let i = 0; i < numSlides; i++) {
      const d = document.createElement('div');
      d.className = 'testi-dot' + (i === current ? ' active' : '');
      d.setAttribute('role', 'button');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function goTo(idx) {
    const numSlides = getNumSlides();
    current = ((idx % numSlides) + numSlides) % numSlides;
    /*
     * FIX: Each card is (100/perView)% wide.
     * To advance by one "page" (= perView cards), we shift by (current * perView) card-widths.
     * But since we're moving by pages and each page = perView cards at (100/perView)% each,
     * one full page = 100% of the slider viewport.
     * So translate = current * 100% of the track's viewport width, which equals
     * current * perView * (100/perView)% = current * 100%.
     * CORRECT formula:
     */
    const offset = current * 100; /* percent of slider viewport width per page */
    track.style.transform = `translateX(-${offset}%)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  buildDots();

  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');
  prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

  let auto = setInterval(() => goTo(current + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(auto));
  track.addEventListener('mouseleave', () => {
    clearInterval(auto);
    auto = setInterval(() => goTo(current + 1), 5000);
  });

  /* Touch swipe support */
  let startX = 0;
  let isDragging = false;
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  window.addEventListener('resize', () => {
    const newPer = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    if (newPer !== perView) {
      perView = newPer;
      current = 0;
      buildDots();
      goTo(0);
    }
  });
})();

/* ── CONTACT FORM ── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('form-submit');
    const successEl = document.getElementById('form-success');

    // Basic validation
    const name  = form.querySelector('#cf-name');
    const phone = form.querySelector('#cf-phone');
    if (name && !name.value.trim()) { name.focus(); return; }
    if (phone && !phone.value.trim()) { phone.focus(); return; }

    if (btn) {
      btn.textContent = 'Sending…';
      btn.disabled = true;
    }

    setTimeout(() => {
      if (successEl) successEl.classList.add('visible');
      if (btn) {
        btn.innerHTML = 'Send Enquiry <svg width="17" height="17"><use href="#ico-send"/></svg>';
        btn.disabled = false;
      }
      form.reset();
      setTimeout(() => successEl && successEl.classList.remove('visible'), 5000);
    }, 1200);
  });
}

/* ── FLOAT CTA SHOW/HIDE ──
   FIX: use CSS class instead of inline style for cleaner control
   and respect the media query that hides it on mobile */
const floatCta = document.getElementById('float-cta');

function toggleFloatCta() {
  if (!floatCta) return;
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    floatCta.classList.remove('visible');
    return;
  }
  if (window.scrollY > 300) {
    floatCta.classList.add('visible');
  } else {
    floatCta.classList.remove('visible');
  }
}

window.addEventListener('resize', toggleFloatCta, { passive: true });
toggleFloatCta(); // initial call

/* ── SMOOTH ANCHOR LINKS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const navHeight = navbar ? navbar.offsetHeight : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ═══════════════════════════════════════════════════
   PRIORITY FEATURES — Added in v3.1
   ═══════════════════════════════════════════════════ */

/* ── GA4 EVENT TRACKING ──
   Works automatically once you replace G-XXXXXXXXXX
   in index.html with your real GA4 Measurement ID   */
function gtagEvent(eventName, params) {
  if (typeof gtag !== 'undefined') gtag('event', eventName, params);
}

document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    gtagEvent('phone_call', {
      event_category: 'Contact',
      event_label: link.getAttribute('href').replace('tel:', ''),
    });
  });
});

document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  link.addEventListener('click', () => {
    gtagEvent('whatsapp_click', { event_category: 'Contact' });
  });
});

/* Track form submissions (both main contact + callback) */
document.querySelectorAll('#contact-form, #callback-form').forEach(f => {
  f.addEventListener('submit', () => {
    gtagEvent('form_lead', {
      event_category: 'Lead',
      event_label: f.id,
    });
  });
});

/* ── CALLBACK SIDEBAR ── */
(function initCallbackSidebar() {
  const sidebar  = document.getElementById('callback-sidebar');
  const tab      = document.getElementById('callback-tab');
  const panel    = document.getElementById('callback-panel');
  const closeBtn = document.getElementById('callback-close');
  const cbForm   = document.getElementById('callback-form');
  const success  = document.getElementById('callback-success');

  if (!sidebar || !tab || !panel) return;

  function openPanel() {
    panel.classList.add('open');
    tab.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    panel.classList.remove('open');
    tab.setAttribute('aria-expanded', 'false');
  }

  tab.addEventListener('click', () => {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });

  closeBtn && closeBtn.addEventListener('click', closePanel);

  cbForm && cbForm.addEventListener('submit', e => {
    e.preventDefault();
    const nameEl  = document.getElementById('cb-name');
    const phoneEl = document.getElementById('cb-phone');
    if (!nameEl || !nameEl.value.trim()) {
      nameEl && nameEl.focus();
      return;
    }
    if (!phoneEl || !phoneEl.value.trim()) {
      phoneEl && phoneEl.focus();
      return;
    }

    const submitBtn = cbForm.querySelector('.callback-submit');
    if (submitBtn) { submitBtn.textContent = 'Sending…'; submitBtn.disabled = true; }

    setTimeout(() => {
      if (success) success.classList.add('visible');
      if (submitBtn) { submitBtn.textContent = '✆ Request Callback'; submitBtn.disabled = false; }
      cbForm.reset();
      setTimeout(() => {
        success && success.classList.remove('visible');
        closePanel();
      }, 3500);
    }, 900);
  });

  /* Close when clicking outside the sidebar */
  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !sidebar.contains(e.target)) {
      closePanel();
    }
  });
})();

/* ── CHAT WIDGET ── */
(function initChatWidget() {
  const widget    = document.getElementById('chat-widget');
  const toggleBtn = document.getElementById('chat-toggle');
  const chatPanel = document.getElementById('chat-panel');
  const closeBtn  = document.getElementById('chat-close');
  const badge     = document.getElementById('chat-badge');

  if (!widget || !toggleBtn || !chatPanel) return;

  let isOpen = false;

  function openChat() {
    chatPanel.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    if (badge) badge.style.display = 'none';
    isOpen = true;
    gtagEvent('chat_widget_open', { event_category: 'Engagement' });
  }

  function closeChat() {
    chatPanel.classList.remove('open');
    chatPanel.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }

  toggleBtn.addEventListener('click', () => {
    isOpen ? closeChat() : openChat();
  });

  closeBtn && closeBtn.addEventListener('click', closeChat);

  /* Auto-open once per session after 5 s */
  if (!sessionStorage.getItem('chatSeen')) {
    setTimeout(() => {
      if (!isOpen) {
        openChat();
        sessionStorage.setItem('chatSeen', '1');
        /* Auto-close after 9 s if user hasn't hovered */
        setTimeout(() => {
          if (isOpen && !chatPanel.matches(':hover')) closeChat();
        }, 9000);
      }
    }, 5000);
  }

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (isOpen && !widget.contains(e.target)) closeChat();
  });

  /* Close when a quick-reply anchor link is clicked */
  chatPanel.querySelectorAll('.chat-quick-btn[href^="#"]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(closeChat, 350));
  });
})();

/* ── VIDEO MODAL ── */
(function initVideoModal() {
  const modal     = document.getElementById('video-modal');
  const openBtn   = document.getElementById('video-tour-btn');
  const bgClose   = document.getElementById('video-modal-bg');
  const closeBtn  = document.getElementById('video-modal-close-btn');
  const iframe    = document.getElementById('video-iframe');

  if (!modal || !openBtn || !iframe) return;

  function openModal() {
    /* Load iframe src only now (prevents autoplay on page load) */
    if (!iframe.src || iframe.src === window.location.href) {
      iframe.src = iframe.dataset.src || '';
    }
    modal.classList.add('open');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    gtagEvent('video_tour_open', { event_category: 'Engagement' });
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    /* Stop playback by clearing src */
    iframe.src = '';
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  bgClose  && bgClose.addEventListener('click', closeModal);
  closeBtn && closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
