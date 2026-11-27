/* ==========================================================================
   Imperial Scents / main.js
   Behaviour shared by every page. All page content lives in the HTML;
   this file only adds interaction: theme switch, live ticker, wishlist,
   shopping bag (saved in localStorage) and small helpers.
   ========================================================================== */
(function () {
  "use strict";

  var ROOT = document.body.dataset.root || "";
  var KEY = { cart: "is4_cart", wish: "is4_wish", coupon: "is4_coupon", theme: "is4_theme" };
  var FREE_SHIP_ABOVE = 1999;
  var SHIP_FEE = 99;
  var COUPONS = {
    NOIR10: { kind: "pct", value: 10, text: "NOIR10, 10% off" },
    FIRST200: { kind: "flat", value: 200, min: 1999, text: "FIRST200, Rs 200 off" }
  };
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };
  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: ignore */ }
  }

  /* ---------- theme switch (dark default, light optional) ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-bs-theme", t);
    var btn = $("#theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("aria-pressed", String(t === "light"));
    }
  }
  var themeBtn = $("#theme-toggle");
  applyTheme(document.documentElement.getAttribute("data-bs-theme") || "dark");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      write(KEY.theme, next);
    });
  }

  /* ---------- header shadow once scrolled ---------- */
  var head = $("#site-head");
  if (head) {
    var onScroll = function () { head.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- live ticker: IST clock and dispatch countdown ---------- */
  function istParts() {
    var now = new Date();
    var label = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", hour12: true
    }).format(now).replace(",", "");
    var hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false })
      .format(now).split(":").map(Number);
    var wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now);
    return { label: label + " IST", mins: hm[0] * 60 + hm[1], wd: wd };
  }
  function dispatchText() {
    var t = istParts(), cutoff = 17 * 60;
    var order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (t.wd !== "Sun" && t.mins < cutoff) {
      var m = cutoff - t.mins;
      return "Order in the next <b>" + Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m</b> for same-day dispatch";
    }
    var days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var next = (t.wd === "Sat" || t.wd === "Sun") ? "Monday" : days[order.indexOf(t.wd)];
    return "Orders placed now dispatch on <b>" + next + "</b>";
  }
  function tick() {
    $$('[data-live="clock"]').forEach(function (e) { e.textContent = istParts().label; });
    $$('[data-live="dispatch"]').forEach(function (e) { e.innerHTML = dispatchText(); });
  }
  tick();
  setInterval(tick, 20000);

  /* ---------- toast ---------- */
  function toast(msg) {
    var host = $("#toasts");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "toast-is";
    el.setAttribute("role", "status");
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 400); }, 2600);
  }

  /* ---------- wishlist ---------- */
  var wish = read(KEY.wish, []);
  function isWished(id) { return wish.indexOf(id) !== -1; }
  function paintWish() {
    $$("[data-wish]").forEach(function (b) {
      var on = isWished(b.dataset.wish);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      var i = $("i", b);
      if (i) i.className = "bi " + (on ? "bi-heart-fill" : "bi-heart");
    });
    $$('[data-count="wish"]').forEach(function (c) { c.textContent = wish.length; c.classList.toggle("on", wish.length > 0); });
    document.dispatchEvent(new CustomEvent("wishchange"));
  }
  function toggleWish(id, name) {
    var i = wish.indexOf(id);
    if (i === -1) { wish.push(id); toast((name || "Fragrance") + " saved to your wishlist"); }
    else { wish.splice(i, 1); toast("Removed from your wishlist"); }
    write(KEY.wish, wish);
    paintWish();
  }

  /* ---------- shopping bag ---------- */
  var cart = read(KEY.cart, []);
  /* bags saved before the photos were renamed still point at images/imN.jpg: repair them */
  var LEGACY = ["velvet-reign","eauelite","aura-luxe","esscentia","silken-hour","maison-de-lune","essencia","fragransia","scentuelle","femme-atelier","rose-whisper","pure-root","essence-bloom","fragrant-meadow","aromique","scentlab","bare-scent","odorique","olfacta","nexteau","noir-oud","kesar-royale","mogra-midnight","shahi-gulab","the-discovery-set"];
  cart.forEach(function (l) {
    var m = /^images\/im(\d+)\.jpg$/.exec(l.img || "");
    if (m && LEGACY[Number(m[1]) - 1]) l.img = "images/" + LEGACY[Number(m[1]) - 1] + ".jpg";
  });
  var couponCode = read(KEY.coupon, "");
  function saveCart() { write(KEY.cart, cart); renderBag(); document.dispatchEvent(new CustomEvent("cartchange")); }
  function lineKey(l) { return l.id + "|" + l.size; }
  function addToCart(item, qty) {
    qty = qty || 1;
    var found = cart.filter(function (l) { return lineKey(l) === lineKey(item); })[0];
    if (found) found.qty = Math.min(10, found.qty + qty);
    else cart.push({ id: item.id, name: item.name, size: item.size, price: item.price, mrp: item.mrp, img: item.img, qty: Math.min(10, qty) });
    saveCart();
  }
  function setQty(key, q) {
    cart = cart.map(function (l) { if (lineKey(l) === key) l.qty = q; return l; }).filter(function (l) { return l.qty > 0; });
    saveCart();
  }
  function removeLine(key) { cart = cart.filter(function (l) { return lineKey(l) !== key; }); saveCart(); }
  function clearCart() { cart = []; couponCode = ""; write(KEY.coupon, ""); saveCart(); }
  function totals() {
    var sub = 0, mrp = 0, count = 0;
    cart.forEach(function (l) { sub += l.price * l.qty; mrp += l.mrp * l.qty; count += l.qty; });
    var c = COUPONS[couponCode], off = 0;
    if (c && (!c.min || sub >= c.min)) off = c.kind === "pct" ? Math.round(sub * c.value / 100) : c.value;
    var after = sub - off;
    var ship = count === 0 ? 0 : (after >= FREE_SHIP_ABOVE ? 0 : SHIP_FEE);
    return { sub: sub, mrp: mrp, count: count, off: off, ship: ship, total: after + ship, after: after, coupon: off ? c : null };
  }
  function applyCoupon(code) {
    code = (code || "").trim().toUpperCase();
    var c = COUPONS[code];
    if (!c) return { ok: false, msg: "That code is not valid." };
    var t = totals();
    if (c.min && t.sub < c.min) return { ok: false, msg: "Add " + inr(c.min - t.sub) + " more to use " + code + "." };
    couponCode = code; write(KEY.coupon, code); saveCart();
    return { ok: true, msg: code + " applied." };
  }
  function removeCoupon() { couponCode = ""; write(KEY.coupon, ""); saveCart(); }

  /* fill a <template id="line-tpl"> row from a cart line */
  function lineNode(l, tpl) {
    var n = tpl.content.firstElementChild.cloneNode(true);
    n.dataset.key = lineKey(l);
    var set = function (sel, fn) { $$(sel, n).forEach(fn); };
    set("[data-f=img]", function (e) { e.src = ROOT + l.img; e.alt = l.name; });
    set("[data-f=name]", function (e) { e.textContent = l.name; });
    set("[data-f=link]", function (e) { e.href = ROOT + (l.page ? "products/" + l.id + ".html" : "shop.html?open=" + l.id); });
    set("[data-f=size]", function (e) { e.textContent = l.size; });
    set("[data-f=qty]", function (e) { e.textContent = l.qty; });
    set("[data-f=price]", function (e) { e.textContent = inr(l.price * l.qty); });
    return n;
  }
  function paintLines(host, tpl) {
    if (!host || !tpl) return;
    host.innerHTML = "";
    cart.forEach(function (l) { host.appendChild(lineNode(l, tpl)); });
  }

  /* bag drawer + any page that shows totals (cart, checkout) */
  function renderBag() {
    var t = totals();
    $$('[data-count="bag"]').forEach(function (c) { c.textContent = t.count; c.classList.toggle("on", t.count > 0); });
    var bc = $("#bag-count"); if (bc) bc.textContent = t.count ? "(" + t.count + ")" : "";
    var empty = $("#bag-empty"), full = $("#bag-full");
    if (empty && full) { empty.hidden = t.count > 0; full.hidden = t.count === 0; }
    paintLines($("#bag-lines"), $("#line-tpl"));
    fillSummary(document, t);
  }
  /* shared by drawer, cart page and checkout: elements marked data-sum="..." */
  function fillSummary(root, t) {
    var map = {
      sub: inr(t.sub), ship: t.ship === 0 ? (t.count ? "Free" : "-") : inr(t.ship), total: inr(t.total),
      off: "−" + inr(t.off), save: inr(Math.max(0, t.mrp - t.sub))
    };
    $$("[data-sum]", root).forEach(function (e) {
      var k = e.dataset.sum;
      if (k === "offrow") { e.hidden = !t.off; return; }
      if (k === "coupon") { e.textContent = t.coupon ? t.coupon.text : ""; return; }
      if (map[k] !== undefined) e.textContent = map[k];
    });
    $$("[data-meter]", root).forEach(function (m) {
      var pct = Math.min(100, (t.after / FREE_SHIP_ABOVE) * 100);
      $("i", m).style.width = pct + "%";
      var msg = $(".ship-msg", m.parentNode);
      if (msg) msg.innerHTML = t.count === 0 ? "Free shipping on orders above " + inr(FREE_SHIP_ABOVE)
        : (t.after >= FREE_SHIP_ABOVE ? "You have <b>free shipping</b>." : "Add <b>" + inr(FREE_SHIP_ABOVE - t.after) + "</b> more for free shipping.");
    });
  }

  /* ---------- clicks: add to bag, wishlist, qty, remove ---------- */
  function openBag() {
    var el = $("#bag");
    if (el && window.bootstrap) window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) {
      var d = add.dataset;
      var q = d.qtyFrom ? Number(($(d.qtyFrom) || {}).textContent || 1) : 1;
      var item = { id: d.id, name: d.name, size: d.size, price: Number(d.price), mrp: Number(d.mrp), img: d.img };
      addToCart(item, q);
      /* remember whether this product has its own page (used for links in the bag) */
      cart.forEach(function (l) { if (l.id === item.id) l.page = d.page === "1"; });
      write(KEY.cart, cart);
      renderBag();
      toast(d.name + " added to your bag");
      if (d.buy === "1") { window.location.href = ROOT + "checkout.html"; return; }
      openBag();
      return;
    }
    var w = e.target.closest("[data-wish]");
    if (w) { e.preventDefault(); toggleWish(w.dataset.wish, w.dataset.name); return; }
    var row = e.target.closest("[data-key]");
    if (row) {
      var key = row.dataset.key;
      var line = cart.filter(function (l) { return lineKey(l) === key; })[0];
      if (!line) return;
      if (e.target.closest("[data-qty-minus]")) setQty(key, line.qty - 1);
      else if (e.target.closest("[data-qty-plus]")) setQty(key, Math.min(10, line.qty + 1));
      else if (e.target.closest("[data-remove]")) removeLine(key);
    }
  });

  /* ---------- newsletter and generic validated forms ---------- */
  $$("form[data-thanks]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.classList.add("was-validated"); return; }
      var p = document.createElement("p");
      p.className = "news-done";
      p.textContent = f.dataset.thanks;
      f.replaceWith(p);
    });
  });

  /* ---------- reduced motion: stop the logo shimmer ---------- */
  if (REDUCED) $$("animateTransform").forEach(function (a) { a.remove(); });

  /* ---------- expose a tiny API for page scripts ---------- */
  window.IS = {
    ROOT: ROOT, inr: inr, $: $, $$: $$, toast: toast, cart: function () { return cart; },
    totals: totals, applyCoupon: applyCoupon, removeCoupon: removeCoupon, clearCart: clearCart,
    fillSummary: fillSummary, lineNode: lineNode, paintLines: paintLines,
    isWished: isWished, couponCode: function () { return couponCode; },
    FREE_SHIP_ABOVE: FREE_SHIP_ABOVE
  };

  paintWish();
  renderBag();
})();
