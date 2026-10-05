/* Himalayan Rooftop v2 — motion (GSAP + ScrollTrigger + SplitText). Transform/opacity only, native scroll. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  var doc = document.documentElement;
  var reduce = doc.classList.contains('reduce');
  var hasSplit = !!window.SplitText;
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return gsap.utils.toArray(s, c); };

  if (reduce) { gsap.set('.rv', { opacity: 1, y: 0 }); gsap.set('.hero-title', { visibility: 'visible' }); var l = $('#loader'); if (l) l.classList.remove('on'); return; }

  var started = false;
  function start() { if (started) return; started = true; run(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  setTimeout(start, 1200);

  function run() {

  /* ---------- loader ---------- */
  var delay = 0.05;
  var loader = $('#loader');
  if (loader && loader.classList.contains('on')) {
    var logo = loader.querySelector('img');
    gsap.timeline()
      .from(logo, { scale: 0.3, rotation: -120, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' })
      .to(logo, { scale: 0.85, duration: 0.2, ease: 'power2.in' })
      .to(loader, { yPercent: -100, duration: 0.7, ease: 'power4.inOut' })
      .add(function () { loader.classList.remove('on'); gsap.set(loader, { clearProps: 'all' }); });
    delay = 1.2;
  }

  /* ---------- hero titles: words rise out of masks ---------- */
  gsap.set('.hero-title', { visibility: 'visible' });
  $$('.hero-title').forEach(function (h) {
    if (hasSplit) {
      var s = SplitText.create(h, { type: 'words', mask: 'words' });
      // give each clipping mask room for descenders (g, y, p) and the italic overhang, without moving the layout
      var masks = s.masks && s.masks.length ? s.masks : [].slice.call(h.querySelectorAll('div[style*="overflow"]'));
      gsap.set(masks, { padding: '0.04em 0.14em 0.24em', margin: '-0.04em -0.14em -0.24em' });
      // once the words have risen, drop the masks so nothing stays clipped
      gsap.from(s.words, { yPercent: 125, duration: 1.05, ease: 'power4.out', stagger: 0.07, delay: delay + 0.05, onComplete: function () { s.revert(); } });
    } else {
      gsap.from(h, { y: 40, opacity: 0, duration: 1, delay: delay });
    }
  });
  var heroRv = $$('.hero .rv, .phero .rv');
  gsap.to(heroRv, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: delay + 0.35 });

  /* ---------- home hero: fanned reel cards ---------- */
  if ($('.stack')) {
    gsap.from('.card-in', { y: 220, opacity: 0, duration: 1.3, ease: 'power4.out', stagger: 0.12, delay: delay + 0.1 });
    gsap.from('.stack .sticker', { scale: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.12, delay: delay + 0.9 });
    var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.fromTo('.c1 .card-in', { yPercent: 0 }, { yPercent: -14, ease: 'none', scrollTrigger: st });
    gsap.fromTo('.c2 .card-in', { yPercent: 0 }, { yPercent: -24, ease: 'none', scrollTrigger: st });
    gsap.fromTo('.c3 .card-in', { yPercent: 0 }, { yPercent: -9, ease: 'none', scrollTrigger: st });
  }
  $$('.phero .card-mini').forEach(function (c, i) {
    gsap.from(c, { y: 160, opacity: 0, duration: 1.2, ease: 'power4.out', delay: delay + 0.15 + i * 0.12 });
    gsap.fromTo(c, { yPercent: 0 }, { yPercent: i ? -18 : -8, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- scroll reveals (outside heroes) ---------- */
  var rest = $$('.rv').filter(function (el) { return heroRv.indexOf(el) < 0; });
  ScrollTrigger.batch(rest, {
    start: 'top 90%', once: true,
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }); }
  });

  /* ---------- marquees: ticker-driven, speed + direction follow the scroll ---------- */
  function marquee(track, speed, hoverPause) {
    var half = 0, x = 0, boost = 0, dir = -1, paused = false;
    var setX = gsap.quickSetter(track, 'x', 'px');
    var measure = function () { half = track.scrollWidth / 2; };
    measure();
    var tick = function (t, dt) {
      if (paused || !half) return;
      x = gsap.utils.wrap(-half, 0, x + dir * (speed + boost) * (dt / 1000));
      setX(x);
      boost *= 0.93;
    };
    ScrollTrigger.create({
      trigger: track.parentNode, start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { if (s.isActive) gsap.ticker.add(tick); else gsap.ticker.remove(tick); },
      onUpdate: function (s) { dir = s.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(s.getVelocity()) / 2.5, 700); },
      onRefresh: measure
    });
    if (hoverPause) {
      track.addEventListener('mouseenter', function () { paused = true; });
      track.addEventListener('mouseleave', function () { paused = false; });
    }
  }
  $$('.mq-track').forEach(function (t) { marquee(t, 70, false); });
  /* the creator-quote strip is a native scroller animated in main.js, so it also works without GSAP */

  /* ---------- statement: words light up as you read ---------- */
  $$('.split-words').forEach(function (p) {
    if (!hasSplit) return;
    var s = SplitText.create(p, { type: 'words', wordsClass: 'w' });
    gsap.to(s.words, { opacity: 1, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 50%', scrub: true } });
  });

  var mm = gsap.matchMedia();

  /* ---------- 7 days: pinned horizontal track on desktop ---------- */
  mm.add('(min-width: 901px)', function () {
    var pin = $('.days-pin'); if (!pin) return;
    var track = $('.days-track', pin);
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.days', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.day').forEach(function (d) {
      gsap.from(d, { y: 80, rotation: 5, ease: 'none', scrollTrigger: { trigger: d, containerAnimation: tw, start: 'left 100%', end: 'left 65%', scrub: true } });
    });
  });

  /* ---------- after dark: cards stack and recede ---------- */
  mm.add('(min-width: 901px)', function () {
    var cards = $$('.scard');
    cards.forEach(function (c, i) {
      if (i === cards.length - 1) return;
      var tl = gsap.timeline({ scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 140px', scrub: true } });
      tl.to(c, { scale: 0.93, ease: 'none' }, 0).to(c.querySelector('.dim'), { opacity: 0.6, ease: 'none' }, 0);
    });
  });

  /* ---------- crave list: photo follows the cursor ---------- */
  mm.add('(min-width: 901px) and (hover: hover) and (pointer: fine)', function () {
    var box = $('.crave-img'); var list = $('.crave'); if (!box || !list) return;
    var links = $$('a[data-img]', list); var imgs = {};
    links.forEach(function (a) {
      var src = a.getAttribute('data-img');
      if (!imgs[src]) { var im = new Image(); im.src = src; im.alt = ''; box.appendChild(im); imgs[src] = im; }
    });
    gsap.set(box, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
    var xTo = gsap.quickTo(box, 'x', { duration: 0.55, ease: 'power3' });
    var yTo = gsap.quickTo(box, 'y', { duration: 0.55, ease: 'power3' });
    var rTo = gsap.quickTo(box, 'rotation', { duration: 0.6, ease: 'power3' });
    var lastX = 0;
    var move = function (e) { xTo(e.clientX); yTo(e.clientY); rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX; };
    var show = function (a) {
      Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('on', k === a.getAttribute('data-img')); });
      gsap.to(box, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    };
    var hide = function () { gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.35, ease: 'power3.in', overwrite: 'auto' }); };
    list.addEventListener('mousemove', move);
    links.forEach(function (a) { a.addEventListener('mouseenter', function () { show(a); }); });
    list.addEventListener('mouseleave', hide);
    return function () { list.removeEventListener('mousemove', move); };
  });

  /* ---------- reel wall: columns drift at different speeds ---------- */
  $$('.wall .col').forEach(function (col, i) {
    gsap.fromTo(col, { y: i % 2 ? 90 : -10 }, { y: i % 2 ? -90 : 50, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- menu: photo parallax + dish strip ---------- */
  $$('.pz').forEach(function (img) {
    gsap.fromTo(img, { scale: 1.2, yPercent: -6 }, { scale: 1.04, yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  var strip = $('.strip-track');
  if (strip) {
    gsap.fromTo(strip, { x: 0 }, { x: function () { return -(strip.scrollWidth - window.innerWidth); }, ease: 'none',
      scrollTrigger: { trigger: '.strip', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  }

  /* ---------- footer wordmark rises ---------- */
  if ($('.foot-word')) gsap.from('.foot-word', { yPercent: 55, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- magnetic buttons (mouse only) ---------- */
  mm.add('(hover: hover) and (pointer: fine)', function () {
    $$('.magnet').forEach(function (b) {
      var xTo = gsap.quickTo(b, 'x', { duration: 0.45, ease: 'power3' });
      var yTo = gsap.quickTo(b, 'y', { duration: 0.45, ease: 'power3' });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  });

  ScrollTrigger.refresh();
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
