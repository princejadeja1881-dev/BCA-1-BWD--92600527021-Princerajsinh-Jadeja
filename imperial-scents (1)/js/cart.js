/* ==========================================================================
   Imperial Scents / cart.js
   Cart page and checkout. The page layout, form fields and messages are in
   the HTML. This file reads the bag from main.js and handles coupons,
   validation and placing the order.
   ========================================================================== */
(function () {
  "use strict";
  var IS = window.IS;
  if (!IS) return;
  var $ = IS.$;

  function paint() {
    var t = IS.totals();
    var list = $("#cart-lines"), tpl = $("#line-tpl");
    var empty = $("#cart-empty"), full = $("#cart-full");
    if (empty && full) { empty.hidden = t.count > 0; full.hidden = t.count === 0; }
    IS.paintLines(list, tpl);
    var co = $("#co-lines"), ctpl = $("#co-tpl");
    if (co && ctpl) {
      co.innerHTML = "";
      IS.cart().forEach(function (l) {
        var n = ctpl.content.firstElementChild.cloneNode(true);
        n.querySelector("[data-f=img]").src = IS.ROOT + l.img;
        n.querySelector("[data-f=img]").alt = l.name;
        n.querySelector("[data-f=qty]").textContent = l.qty;
        n.querySelector("[data-f=name]").textContent = l.name;
        n.querySelector("[data-f=size]").textContent = l.size;
        n.querySelector("[data-f=price]").textContent = IS.inr(l.price * l.qty);
        co.appendChild(n);
      });
    }
    IS.fillSummary(document, t);
    var code = $("#cp-in");
    if (code && IS.couponCode() && !code.value) code.value = IS.couponCode();
  }
  document.addEventListener("cartchange", paint);

  /* coupon */
  var cpForm = $("#cp");
  if (cpForm) {
    cpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = IS.applyCoupon($("#cp-in").value);
      var msg = $("#cp-msg");
      msg.className = "fine " + (r.ok ? "good" : "bad");
      msg.textContent = r.msg;
    });
    var rm = $("#cp-remove");
    if (rm) rm.addEventListener("click", function () { IS.removeCoupon(); $("#cp-in").value = ""; $("#cp-msg").textContent = ""; });
  }

  /* checkout */
  var form = $("#co-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pin = $("#c-pin");
      pin.setCustomValidity(/^[1-9][0-9]{5}$/.test(pin.value.trim()) ? "" : "Enter a valid 6-digit pincode");
      var ph = $("#c-phone");
      ph.setCustomValidity(/^[6-9][0-9]{9}$/.test(ph.value.replace(/\s/g, "")) ? "" : "Enter a 10-digit mobile number");
      if (!form.querySelector("input[name=pay]:checked")) { IS.toast("Choose a payment method"); return; }
      syncCard();
      form.classList.add("was-validated");
      if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
      if (IS.totals().count === 0) { IS.toast("Your bag is empty"); return; }
      var pay = form.querySelector("input[name=pay]:checked").value;
      var id = "IS" + Date.now().toString().slice(-8);
      var t = IS.totals();
      $("#o-id").textContent = id;
      $("#o-total").textContent = IS.inr(t.total);
      $("#o-pay").textContent = pay === "cod" ? "Cash on delivery. Please keep the amount ready." : "Your payment has been received.";
      $("#o-name").textContent = $("#c-name").value.trim().split(" ")[0];
      IS.clearCart();
      $("#co-grid").hidden = true;
      $("#confirm").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    var payRadios = form.querySelectorAll("input[name=pay]");
    var cardBox = $("#card-box");
    function syncCard() {
      var on = form.querySelector("input[name=pay]:checked").value === "card";
      cardBox.hidden = !on;
      cardBox.querySelectorAll("input").forEach(function (i) { i.required = on; });
    }
    payRadios.forEach(function (r) {
      r.addEventListener("change", syncCard);
    });
    syncCard();
  }
  paint();
})();
