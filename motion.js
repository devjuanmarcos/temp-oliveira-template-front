// Motion engine compartilhado — reveals, contadores, parallax, palavras, scroll horizontal.
const EASE = 'cubic-bezier(.16,.84,.24,1)';
const K = {
  up: [{ opacity: 0, transform: 'translateY(56px)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
  fade: [{ opacity: 0 }, { opacity: 1 }],
  rise: [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }],
  mask: [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }],
  wipe: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
  scale: [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'scale(1)' }],
  line: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
  vline: [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
  left: [{ opacity: 0, transform: 'translateX(-40px)' }, { opacity: 1, transform: 'none' }],
};
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el) {
  const to = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', pre = el.dataset.prefix || '';
  const dur = 1800, t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = pre + Math.round(to * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initMotion(root = document) {
  const pending = window.__omPending || (window.__omPending = new Set());
  const fire = el => {
    if (el.__done) return; el.__done = 1; pending.delete(el);
    if (el.__m) el.__m.play();
    if (el.dataset.count && !el.__c) { el.__c = 1; countUp(el); }
  };
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    fire(en.target.__t || en.target); io.unobserve(en.target);
  }), { threshold: 0.01, rootMargin: '0px 0px -6% 0px' });
  const watch = el => {
    const tgt = /^(rise|mask|wipe|scale)$/.test(el.dataset.reveal || '') && el.parentElement ? el.parentElement : el;
    tgt.__t = el; el.__w = tgt; pending.add(el); io.observe(tgt);
  };

  root.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.__m) return;
    const kf = K[el.dataset.reveal] || K.up;
    const a = el.animate(kf, { duration: reduce() ? 1 : +(el.dataset.dur || 1300), delay: reduce() ? 0 : +(el.dataset.delay || 0), easing: EASE, fill: 'both' });
    a.pause(); a.currentTime = 0; el.__m = a; watch(el);
  });
  root.querySelectorAll('[data-count]').forEach(el => { if (!el.__m && !el.__c) watch(el); });

  const sweep = (all) => pending.forEach(el => {
    const r = (el.__w || el).getBoundingClientRect();
    if (all || r.top < innerHeight * 0.96) fire(el);
  });
  if (!window.__omSweep) {
    window.__omSweep = sweep;
    addEventListener('scroll', () => sweep(false), { passive: true });
    addEventListener('beforeprint', () => { sweep(true); document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }); });
  }
  setTimeout(() => sweep(document.hidden), 1200);
  if (document.hidden) setTimeout(() => sweep(true), 1500);

  root.querySelectorAll('[data-marquee]').forEach(el => {
    if (el.__mq) return;
    el.__mq = el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: +(el.dataset.marquee || 40000), iterations: Infinity });
  });
  root.querySelectorAll('[data-breathe]').forEach(el => {
    if (el.__br) return;
    el.__br = el.animate([{ transform: 'scale(1) translate(0,0)' }, { transform: 'scale(1.08) translate(-1.5%,-1%)' }], { duration: +(el.dataset.breathe || 22000), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
  });
  root.querySelectorAll('[data-spin]').forEach(el => {
    if (el.__sp) return;
    el.__sp = el.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: +(el.dataset.spin || 60000), iterations: Infinity });
  });

  if (!window.__omScroll) {
    window.__omScroll = true;
    const vh = () => innerHeight;
    const tick = () => {
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const r = el.getBoundingClientRect(); const c = r.top + r.height / 2 - vh() / 2;
        const room = Math.max(0, (el.offsetHeight - (el.parentElement ? el.parentElement.offsetHeight : 0)) / 2); let v = c * parseFloat(el.dataset.parallax); if (el.parentElement && getComputedStyle(el.parentElement).overflow !== 'visible') v = Math.max(-room, Math.min(room, v)); el.style.translate = `0 ${v.toFixed(1)}px`;
      });
      document.querySelectorAll('[data-words]').forEach(box => {
        const r = box.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh() * 0.85 - r.top) / (r.height + vh() * 0.35)));
        const ws = box.querySelectorAll('[data-w]'); const n = ws.length;
        ws.forEach((w, i) => { const t = Math.min(1, Math.max(0, p * n * 1.15 - i)); w.style.opacity = (0.16 + 0.84 * t).toFixed(3); });
      });
      document.querySelectorAll('[data-hscroll]').forEach(box => {
        const track = box.querySelector('[data-track]'); if (!track) return;
        const r = box.getBoundingClientRect(); const total = r.height - vh();
        const p = Math.min(1, Math.max(0, -r.top / total));
        const dist = track.scrollWidth - track.parentElement.clientWidth;
        track.style.translate = `${(-dist * p).toFixed(1)}px 0`;
        const bar = box.querySelector('[data-hbar]'); if (bar) bar.style.scale = `${p} 1`;
      });
      document.querySelectorAll('[data-progress]').forEach(el => {
        const h = document.documentElement.scrollHeight - vh();
        el.style.scale = `${h > 0 ? scrollY / h : 0} 1`;
      });
      document.querySelectorAll('[data-draw]').forEach(el => {
        const box = el.closest('[data-draw-box]') || el.parentElement; const r = box.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh() * 0.7 - r.top) / (r.height * 0.8)));
        el.style.scale = el.dataset.draw === 'y' ? `1 ${p}` : `${p} 1`;
        box.querySelectorAll('[data-step]').forEach((s, i, all) => { s.style.opacity = p >= i / all.length ? 1 : 0.3; });
      });
    };
    let raf = 0; const on = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    window.__omTick = tick;
  }
  window.__omTick && window.__omTick();
}
