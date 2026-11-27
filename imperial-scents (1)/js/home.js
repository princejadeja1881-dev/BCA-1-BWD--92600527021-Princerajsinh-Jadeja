/* ==========================================================================
   Imperial Scents / home.js
   Home page behaviour: carousel arrows, collection panels, hero particles.
   The hero slider, reviews and finder are Bootstrap components.
   ========================================================================== */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* scroll-snap carousels: any element with [data-car] holding a .track */
  document.querySelectorAll("[data-car]").forEach(function (root) {
    var track = root.querySelector(".track");
    var prev = root.querySelector('[data-dir="-1"]');
    var next = root.querySelector('[data-dir="1"]');
    function update() {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    function by(d) { track.scrollBy({ left: d * track.clientWidth * 0.82, behavior: reduced ? "auto" : "smooth" }); }
    prev.addEventListener("click", function () { by(-1); });
    next.addEventListener("click", function () { by(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* collection panels: open on hover (mouse), focus or tap */
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  function open(p) { panels.forEach(function (x) { x.classList.toggle("on", x === p); }); }
  panels.forEach(function (p) {
    p.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) open(p); });
    p.addEventListener("click", function () { open(p); });
    p.addEventListener("focus", function () { open(p); });
  });

  /* hero: pause the timed progress bars and drifting particles together with the slider */
  var hero = document.getElementById("heroCarousel");
  var canvas = document.getElementById("mist");
  if (hero && canvas && !reduced && canvas.getContext) {
    var ctx = canvas.getContext("2d"), w = 0, h = 0, parts = [], i;
    var size = function () {
      var r = hero.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    var spawn = function (init) {
      return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: 1 + Math.random() * 3.2, v: 0.12 + Math.random() * 0.4, d: Math.random() * 6.28, a: 0.15 + Math.random() * 0.4 };
    };
    size();
    window.addEventListener("resize", size);
    for (i = 0; i < 44; i++) parts.push(spawn(true));
    (function frame(t) {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h);
        parts.forEach(function (p) {
          p.y -= p.v; p.x += Math.sin(t / 1800 + p.d) * 0.25;
          if (p.y < -10) Object.assign(p, spawn(false));
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, "rgba(230,201,143," + p.a + ")"); g.addColorStop(1, "rgba(230,201,143,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
        });
      }
      requestAnimationFrame(frame);
    })(0);
  }
})();
