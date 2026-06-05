/* ============================================================
   Pranav Sai Real Estate Consultancy — main.js
   Three.js 3D Background + All Interactions
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
  const partMat = new THREE.PointsMaterial({ color: 0xc9962b, size: 0.07, transparent: true, opacity: 0.5, sizeAttenuation: true });
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
  scene.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: 0x4a6fa5, size: 0.045, transparent: true, opacity: 0.35 })));

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
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

/* ── HERO PARTICLES ── */
(function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes floatP{0%{transform:translateY(0) scale(1);opacity:.35}100%{transform:translateY(-32px) scale(1.5);opacity:.75}}`;
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
const menuIco   = document.getElementById('menu-ico');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveNav();
  toggleFloatCta();
});

hamburger && hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  if (menuIco) menuIco.innerHTML = open
    ? '<use href="#ico-close"/>'
    : '<use href="#ico-menu"/>';
});
navLinks && navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger && hamburger.setAttribute('aria-expanded', 'false');
    if (menuIco) menuIco.innerHTML = '<use href="#ico-menu"/>';
  });
});

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 110) current = s.id; });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}

/* ── SCROLL REVEAL ── */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.service-card, .prop-card, .why-card, .testi-inner, .about-grid, .contact-grid, .section-header'
  );
  els.forEach((el, i) => {
    el.classList.add('scroll-reveal');
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

/* ── COUNTER ANIMATION ── */
function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseInt(el.dataset.target);
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
    document.querySelectorAll('.prop-card').forEach((card, i) => {
      if (filter === 'all' || card.dataset.type === filter) {
        card.classList.remove('hidden');
        card.style.animation = `fadeInCard .4s ${i * 0.06}s ease both`;
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

/* ── 3D TILT: SERVICE CARDS ── */
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

/* ── TESTIMONIAL SLIDER ── */
(function initTestimonials() {
  const track   = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testi-dots');
  if (!track || !dotsWrap) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let perView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
  let current = 0;
  const total  = cards.length;
  const numSlides = Math.ceil(total / perView);

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < numSlides; i++) {
      const d = document.createElement('div');
      d.className = 'testi-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function goTo(idx) {
    current = ((idx % numSlides) + numSlides) % numSlides;
    const offset = current * (100 / perView) * perView;
    track.style.transform = `translateX(-${offset}%)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  buildDots();
  document.getElementById('testi-prev') && document.getElementById('testi-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('testi-next') && document.getElementById('testi-next').addEventListener('click', () => goTo(current + 1));

  let auto = setInterval(() => goTo(current + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(auto));
  track.addEventListener('mouseleave', () => { auto = setInterval(() => goTo(current + 1), 5000); });

  /* Touch swipe */
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  window.addEventListener('resize', () => {
    const newPer = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    if (newPer !== perView) { perView = newPer; current = 0; buildDots(); goTo(0); }
  });
})();

/* ── CONTACT FORM ── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('form-submit');
    const successEl = document.getElementById('form-success');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      if (successEl) successEl.classList.add('visible');
      btn.innerHTML = 'Send Enquiry <svg width="17" height="17"><use href="#ico-send"/></svg>';
      btn.disabled = false;
      form.reset();
      setTimeout(() => successEl && successEl.classList.remove('visible'), 5000);
    }, 1200);
  });
}

/* ── FLOAT CTA SHOW/HIDE ── */
const floatCta = document.getElementById('float-cta');
function toggleFloatCta() {
  if (floatCta) floatCta.style.opacity = window.scrollY > 300 ? '1' : '0';
}

/* ── SMOOTH ANCHOR LINKS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
