/* dNthrifts — shared motion/interaction layer. Auto-applies to matching
   elements on every page, no markup changes required. */
(function () {
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectStyles() {
    var css = '' +
      '.dn-reveal{opacity:0;transform:translateY(36px);clip-path:inset(0 0 100% 0);transition:opacity 0.7s cubic-bezier(.16,1,.3,1),transform 0.8s cubic-bezier(.16,1,.3,1),clip-path 0.8s cubic-bezier(.16,1,.3,1);}' +
      '.dn-reveal.dn-in{opacity:1;transform:translateY(0);clip-path:inset(0 0 0 0);}' +
      'nav{transition:padding 0.35s ease,box-shadow 0.35s ease;}' +
      'nav.dn-scrolled{padding-top:0.7rem !important;padding-bottom:0.7rem !important;box-shadow:0 6px 24px rgba(59,42,26,0.12);}' +
      '.dn-ripple{position:absolute;border-radius:50%;background:rgba(245,240,232,0.55);transform:scale(0);animation:dnRipple 0.6s ease-out;pointer-events:none;}' +
      '@keyframes dnRipple{to{transform:scale(3.2);opacity:0;}}' +
      '.dn-confetti{position:fixed;top:0;left:0;width:8px;height:8px;pointer-events:none;z-index:10001;border-radius:2px;}' +
      '@keyframes dnConfettiFall{to{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0;}}' +
      '#dn-cursor-dot,#dn-cursor-ring{position:fixed;top:0;left:0;pointer-events:none;z-index:10002;border-radius:50%;transform:translate(-50%,-50%);}' +
      '#dn-cursor-dot{width:6px;height:6px;background:#B5522A;transition:opacity 0.2s;}' +
      '#dn-cursor-ring{width:34px;height:34px;border:1.5px solid rgba(181,82,42,0.55);transition:width 0.25s,height 0.25s,opacity 0.2s,border-color 0.25s;}' +
      '.dn-cursor-hover#dn-cursor-ring{width:56px;height:56px;border-color:rgba(181,82,42,0.9);}' +
      '.dn-tilt{will-change:transform;transition:transform 0.15s ease-out;}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------------- SCROLL REVEAL ---------------- */
  function initReveal() {
    var selectors = [
      '.section-header', '.product-card', '.cat-card', '.about-left', '.about-right .stat-item',
      '.founder-card', '.value-item', '.faq-item', '.story-content p', '.cta-section',
      '.contact-info', '.contact-form-wrap', '.order-summary', '.payment-panel',
      '.about-hero-left', '.about-hero-right'
    ];
    var els = document.querySelectorAll(selectors.join(','));
    if (!els.length) return;

    if (prefersReducedMotion) {
      els.forEach(function (el) { el.classList.add('dn-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = (entry.target.dataset.dnDelay || 0);
          setTimeout(function () { entry.target.classList.add('dn-in'); }, delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    els.forEach(function (el) {
      el.classList.add('dn-reveal');
      var parent = el.parentElement;
      var indexInParent = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      el.dataset.dnDelay = Math.min(indexInParent * 70, 400);
      io.observe(el);
    });
  }

  /* ---------------- NAV SHRINK ---------------- */
  function initNavShrink() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) nav.classList.add('dn-scrolled');
      else nav.classList.remove('dn-scrolled');
    }, { passive: true });
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagnetic() {
    if (isTouch || prefersReducedMotion) return;
    var els = document.querySelectorAll('.btn-primary, .btn-secondary, .pay-btn, .dm-btn, .submit-btn');
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.25) + 'px,' + (y * 0.35) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = 'translate(0,0)';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }

  /* ---------------- TILT CARDS ---------------- */
  function initTilt() {
    if (isTouch || prefersReducedMotion) return;
    var cards = document.querySelectorAll('.product-card');
    cards.forEach(function (card) {
      card.classList.add('dn-tilt');
      card.style.transformStyle = 'preserve-3d';
      card.style.perspective = '600px';
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(600px) rotateY(' + (px * 10) + 'deg) rotateX(' + (py * -10) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) translateY(0)';
      });
    });
  }

  /* ---------------- RIPPLE ---------------- */
  function initRipple() {
    var selector = '.btn-primary, .btn-secondary, .add-btn, .buy-btn, .submit-btn, .dm-btn, .pay-btn, .filter-btn, .method-tab';
    document.addEventListener('click', function (e) {
      var el = e.target.closest(selector);
      if (!el) return;
      var pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      var rect = el.getBoundingClientRect();
      var ripple = document.createElement('span');
      var size = Math.max(rect.width, rect.height);
      ripple.className = 'dn-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 650);
    });
  }

  /* ---------------- CUSTOM CURSOR ---------------- */
  function initCursor() {
    if (isTouch || prefersReducedMotion) return;
    document.body.style.cursor = 'none';
    document.querySelectorAll('a, button, input, textarea, select').forEach(function (el) {
      el.style.cursor = 'none';
    });
    var dot = document.createElement('div');
    dot.id = 'dn-cursor-dot';
    var ring = document.createElement('div');
    ring.id = 'dn-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    (function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .product-card, input, textarea, select')) {
        ring.classList.add('dn-cursor-hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, .product-card, input, textarea, select')) {
        ring.classList.remove('dn-cursor-hover');
      }
    });
  }

  /* ---------------- HERO TEXT SCRAMBLE ---------------- */
  function initScramble() {
    var el = document.querySelector('.hero-title');
    if (!el || prefersReducedMotion) return;
    var finalHTML = el.innerHTML;
    var finalText = el.textContent;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ✦·';
    var frame = 0;
    var totalFrames = 24;

    el.innerHTML = finalText;

    function tick() {
      var progress = frame / totalFrames;
      var revealCount = Math.floor(progress * finalText.length);
      var out = '';
      for (var i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ' || finalText[i] === '\n') { out += finalText[i]; continue; }
        if (i < revealCount) out += finalText[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) {
        requestAnimationFrame(function () { setTimeout(tick, 24); });
      } else {
        el.innerHTML = finalHTML;
      }
    }
    tick();
  }

  /* ---------------- PARALLAX HERO ---------------- */
  function initParallax() {
    var img = document.querySelector('.hero-right img');
    if (!img || prefersReducedMotion) return;
    window.addEventListener('scroll', function () {
      var offset = window.scrollY * 0.12;
      img.style.transform = 'translateY(' + Math.min(offset, 60) + 'px) scale(1.08)';
    }, { passive: true });
  }

  /* ---------------- CONFETTI ---------------- */
  function confettiBurst(x, y) {
    var colors = ['#B5522A', '#D4A017', '#6B7C5C', '#3B2A1A', '#F5F0E8'];
    for (var i = 0; i < 28; i++) {
      var piece = document.createElement('div');
      piece.className = 'dn-confetti';
      var angle = Math.random() * Math.PI * 2;
      var dist = 80 + Math.random() * 140;
      piece.style.left = x + 'px';
      piece.style.top = y + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      piece.style.setProperty('--dy', (Math.sin(angle) * dist + 100) + 'px');
      piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      piece.style.animation = 'dnConfettiFall ' + (0.8 + Math.random() * 0.6) + 's ease-out forwards';
      document.body.appendChild(piece);
      (function (p) { setTimeout(function () { p.remove(); }, 1500); })(piece);
    }
  }
  window.dnConfetti = confettiBurst;

  function initConfettiTriggers() {
    document.querySelectorAll('.pay-btn, #panel-paylah .dm-btn, #panel-stripe .dm-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        confettiBurst(e.clientX, e.clientY);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectStyles();
    initReveal();
    initNavShrink();
    initMagnetic();
    initTilt();
    initRipple();
    initCursor();
    initScramble();
    initParallax();
    initConfettiTriggers();
  });
})();
