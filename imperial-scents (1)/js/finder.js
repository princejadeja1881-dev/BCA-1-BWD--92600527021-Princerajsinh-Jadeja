/* ==========================================================================
   Imperial Scents / finder.js
   The three-question "Find my scent" modal (present on index.html and
   shop.html). The questions are written in the HTML; this file moves
   between steps and sends the answers to the shop page, which ranks the
   range for you.
   ========================================================================== */
(function () {
  "use strict";
  var modal = document.getElementById("finder");
  if (!modal) return;
  var steps = Array.prototype.slice.call(modal.querySelectorAll(".m-step"));
  var bar = modal.querySelector(".m-prog i");
  var answers = {};
  var ROOT = document.body.dataset.root || "";

  function show(i) {
    steps.forEach(function (s, n) { s.hidden = n !== i; });
    bar.style.width = (i / steps.length) * 100 + "%";
    var first = steps[i].querySelector(".m-opt");
    if (first) first.focus({ preventScroll: true });
  }
  modal.addEventListener("show.bs.modal", function () { answers = {}; show(0); });
  modal.addEventListener("click", function (e) {
    var opt = e.target.closest(".m-opt");
    if (!opt) return;
    var step = opt.closest(".m-step");
    answers[step.dataset.key] = opt.dataset.v;
    var i = steps.indexOf(step);
    if (i + 1 < steps.length) { show(i + 1); return; }
    bar.style.width = "100%";
    var q = new URLSearchParams({ match: "1", who: answers.who, when: answers.when, fnote: answers.note });
    window.location.href = ROOT + "shop.html?" + q.toString();
  });
})();
