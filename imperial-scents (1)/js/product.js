/* ==========================================================================
   Imperial Scents / product.js
   Product pages: size picker, quantity, pincode check.
   Everything shown on the page (notes, details, copy) is written in the HTML.
   ========================================================================== */
(function () {
  "use strict";
  var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };
  var add = document.getElementById("p-add");
  var buy = document.getElementById("p-buy");
  var sizes = Array.prototype.slice.call(document.querySelectorAll("[data-size-btn]"));
  var qtyEl = document.getElementById("pqty");

  function select(btn) {
    sizes.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    var price = Number(btn.dataset.price), mrp = Number(btn.dataset.mrp);
    document.getElementById("p-price").textContent = inr(price);
    document.getElementById("p-mrp").textContent = inr(mrp);
    document.getElementById("p-off").textContent = Math.round((1 - price / mrp) * 100) + "% off";
    [add, buy].forEach(function (b) {
      if (!b) return;
      b.dataset.size = btn.dataset.size; b.dataset.price = price; b.dataset.mrp = mrp;
    });
    if (add) add.firstElementChild.textContent = "Add to bag";
  }
  sizes.forEach(function (b) { b.addEventListener("click", function () { select(b); }); });

  var minus = document.getElementById("pq-minus"), plus = document.getElementById("pq-plus");
  if (qtyEl && minus && plus) {
    minus.addEventListener("click", function () { qtyEl.textContent = Math.max(1, Number(qtyEl.textContent) - 1); });
    plus.addEventListener("click", function () { qtyEl.textContent = Math.min(10, Number(qtyEl.textContent) + 1); });
  }

  /* pincode: any valid 6-digit Indian pincode that does not start with 0 */
  var btn = document.getElementById("pin-check"), input = document.getElementById("pin-in"), out = document.getElementById("pin-out");
  if (btn) {
    var check = function () {
      var v = input.value.trim();
      if (!/^[1-9][0-9]{5}$/.test(v)) { out.className = "fine bad"; out.textContent = "Enter a valid 6-digit pincode."; return; }
      var days = /^(38|39)/.test(v) ? "1 to 2" : /^[1-3]/.test(v) ? "3 to 4" : "4 to 6";
      out.className = "fine good";
      out.textContent = "Delivery to " + v + " in " + days + " working days. Cash on delivery available.";
    };
    btn.addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
  }
})();
