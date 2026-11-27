/* ==========================================================================
   Imperial Scents / wishlist.js
   wishlist.html already contains every product card (hidden). This file
   shows the ones you have saved and hides the rest.
   ========================================================================== */
(function () {
  "use strict";
  var IS = window.IS;
  if (!IS) return;
  var cards = IS.$$("#wish-grid .pc");
  var empty = IS.$("#wish-empty");
  var count = IS.$("#wish-count");
  function paint() {
    var shown = 0;
    cards.forEach(function (c) {
      var on = IS.isWished(c.dataset.id);
      c.hidden = !on;
      if (on) shown++;
    });
    empty.hidden = shown > 0;
    count.textContent = shown ? shown + (shown === 1 ? " saved fragrance" : " saved fragrances") : "";
  }
  document.addEventListener("wishchange", paint);
  paint();
})();
