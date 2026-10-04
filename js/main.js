/* Himalayan Rooftop v2 — core behaviour (works without GSAP) */
(function () {
  'use strict';
  var WA = '919315799283';
  var doc = document.documentElement;
  var reduce = doc.classList.contains('reduce');
  var mobile = window.matchMedia('(max-width: 900px)');

  /* if the animation library never arrives, show everything */
  setTimeout(function () { if (!window.gsap) doc.classList.add('reduce'); }, 2500);

  /* first-visit loader (home only); motion.js animates it away */
  var loader = document.getElementById('loader');
  if (loader && !reduce) {
    var seen = false;
    try { seen = sessionStorage.getItem('hr-seen') === '1'; sessionStorage.setItem('hr-seen', '1'); } catch (e) {}
    if (!seen) {
      loader.classList.add('on');
      setTimeout(function () { if (loader.classList.contains('on') && !window.gsap) loader.classList.remove('on'); }, 1800);
    }
  }

  /* header: solid after scrolling, hides on the way down, returns on the way up */
  var hdr = document.getElementById('hdr');
  var bar = document.getElementById('abar');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || 0;
    var open = doc.classList.contains('menu-open');
    hdr.classList.toggle('solid', y > 30 && !open);
    hdr.classList.toggle('hide', y > 500 && y > lastY + 4 && !open);
    if (y < lastY - 4 || y < 500) hdr.classList.remove('hide');
    if (bar) bar.classList.toggle('show', y > window.innerHeight * 0.55 && !open);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = document.querySelector('.burger');
  if (burger) {
    var setMenu = function (open) {
      doc.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      onScroll();
    };
    burger.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
    document.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* videos: load + play only while on screen */
  var vids = [].slice.call(document.querySelectorAll('video[data-src]'));
  function skip(v) { return mobile.matches && v.closest('.card-v.c1, .card-v.c3'); }
  if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !skip(v)) {
          if (!v.getAttribute('src')) v.src = v.dataset.src;
          if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vo.observe(v); });
  }
  /* reduced motion: tap a clip to play it */
  vids.forEach(function (v) {
    v.addEventListener('click', function () {
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  });

  /* today's vibe (Delhi time) */
  var names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var today = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  var ti = names.indexOf(today);
  if (ti > -1) document.querySelectorAll('[data-day="' + ti + '"]').forEach(function (el) { el.classList.add('is-today'); });

  /* menu: highlight the current category */
  var cats = document.querySelectorAll('.mnav-cats a');
  if (cats.length && 'IntersectionObserver' in window) {
    var byId = {};
    cats.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cats.forEach(function (a) { a.classList.remove('on'); });
        var a = byId[en.target.id];
        if (a) { a.classList.add('on'); a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' }); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.mcat').forEach(function (s) { mo.observe(s); });
  }

  /* booking form -> WhatsApp */
  var form = document.getElementById('book-form');
  if (form) {
    var err = document.getElementById('ferr');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var now = new Date();
    var iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    form.elements.date.min = iso;
    if (!form.elements.date.value) form.elements.date.value = iso;
    var niceDate = function (v) {
      var p = v.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };
    var niceTime = function (t) {
      var p = t.split(':'); var h = +p[0]; var ap = h >= 12 ? 'pm' : 'am';
      return (h % 12 || 12) + ':' + p[1] + ' ' + ap;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, name = f.name.value.trim(), miss = [];
      if (!name) miss.push('your name');
      if (!f.date.value || f.date.value < iso) miss.push(f.date.value ? 'a date from today onwards' : 'a date');
      if (!f.time.value) miss.push('a time');
      if (miss.length) {
        err.textContent = 'Please add ' + miss.join(', ') + '.';
        (!name ? f.name : (!f.date.value || f.date.value < iso) ? f.date : f.time).focus();
        return;
      }
      err.textContent = '';
      var seat = form.querySelector('input[name="seating"]:checked');
      var lines = [
        'Hello Himalayan Rooftop! I would like to book a table.', '',
        'Name: ' + name,
        'Date: ' + niceDate(f.date.value),
        'Time: ' + niceTime(f.time.value),
        'Guests: ' + f.guests.value,
        'Seating: ' + (seat ? seat.value : 'No preference')
      ];
      if (f.occasion.value) lines.push('Occasion: ' + f.occasion.value);
      if (f.note.value.trim()) lines.push('Note: ' + f.note.value.trim());
      lines.push('', '(Sent from your website)');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }
})();
