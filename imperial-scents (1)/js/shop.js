/* ==========================================================================
   Imperial Scents / shop.js
   Shop page: filter, sort and search the product cards that are already
   written in shop.html. Cards carry data-* attributes (gender, line, notes,
   occasion, price, rating). Nothing is generated here, cards are only shown,
   hidden and re-ordered.
   ========================================================================== */
(function () {
  "use strict";
  var grid = document.getElementById("grid");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".pc"));
  var original = cards.slice();
  var count = document.getElementById("count");
  var empty = document.getElementById("none");
  var sortSel = document.getElementById("sort");
  var findNote = document.getElementById("find-note");
  var params = new URLSearchParams(window.location.search);

  var GROUPS = ["gender", "type", "line", "note", "occ", "price", "col"];
  var checks = {};
  GROUPS.forEach(function (g) { checks[g] = Array.prototype.slice.call(document.querySelectorAll('input[data-f="' + g + '"]')); });

  /* ---- read the URL into the controls ---- */
  GROUPS.forEach(function (g) {
    var v = params.get(g);
    if (!v) return;
    checks[g].forEach(function (c) { if (c.value === v) c.checked = true; });
    var det = document.querySelector('details[data-g="' + g + '"]');
    if (det) det.open = true;
  });
  if (params.get("sort")) sortSel.value = params.get("sort");
  var query = (params.get("q") || "").trim().toLowerCase();
  var searchIn = document.getElementById("q");
  if (searchIn && query) searchIn.value = params.get("q");

  function selected(g) { return checks[g].filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }

  function matches(card) {
    var d = card.dataset;
    var gender = selected("gender");
    if (gender.length && gender.indexOf(d.gender) === -1 && !(d.gender === "unisex" && (gender.indexOf("men") !== -1 || gender.indexOf("women") !== -1))) return false;
    var type = selected("type"); if (type.length && type.indexOf(d.type) === -1) return false;
    var line = selected("line"); if (line.length && line.indexOf(d.line) === -1) return false;
    var note = selected("note");
    if (note.length && !note.some(function (n) { return d.notes.split(" ").indexOf(n) !== -1; })) return false;
    var occ = selected("occ");
    if (occ.length && !occ.some(function (o) { return d.occ.split(" ").indexOf(o) !== -1; })) return false;
    var price = selected("price");
    if (price.length) {
      var p = Number(d.price);
      var ok = price.some(function (r) { var a = r.split("-"); return p >= Number(a[0]) && (a[1] === "" || p <= Number(a[1])); });
      if (!ok) return false;
    }
    var col = selected("col");
    if (col.indexOf("best") !== -1 && d.best !== "1") return false;
    if (col.indexOf("new") !== -1 && d.new !== "1") return false;
    if (query && d.search.indexOf(query) === -1) return false;
    return true;
  }

  /* ---- "Find my scent" ranking (arrives as ?match=1&who=&when=&fnote=) ---- */
  var finder = params.get("match") === "1" ? { who: params.get("who"), when: params.get("when"), note: params.get("fnote") } : null;
  function score(card) {
    var d = card.dataset, n = Number(d.rating) / 10;
    if (finder.who && finder.who !== "any") n += d.gender === finder.who ? 3 : d.gender === "unisex" ? 2 : -6;
    if (d.occ.split(" ").indexOf(finder.when) !== -1) n += 3;
    var notes = d.notes.split(" ");
    if (notes.indexOf(finder.note) !== -1) n += 4 + (notes[0] === finder.note ? 1 : 0);
    if (d.type === "set") n -= 2;
    return n;
  }

  function order(list) {
    var s = sortSel.value, out = list.slice();
    if (finder && s === "featured") return out.sort(function (a, b) { return score(b) - score(a); });
    if (s === "low") out.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
    else if (s === "high") out.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
    else if (s === "rating") out.sort(function (a, b) { return b.dataset.rating - a.dataset.rating; });
    else if (s === "new") out.sort(function (a, b) { return (b.dataset.new === "1") - (a.dataset.new === "1"); });
    else if (s === "az") out.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); });
    else out = original.slice();
    return out;
  }

  function apply() {
    var shown = 0;
    order(original).forEach(function (c) { grid.appendChild(c); });
    cards.forEach(function (c) { var ok = matches(c); c.hidden = !ok; if (ok) shown++; });
    count.textContent = shown + (shown === 1 ? " fragrance" : " fragrances");
    empty.hidden = shown !== 0;
    if (findNote) findNote.hidden = !finder;
    /* keep the address bar in step so a filtered view can be shared */
    var q = new URLSearchParams();
    GROUPS.forEach(function (g) { var v = selected(g); if (v.length === 1) q.set(g, v[0]); });
    if (sortSel.value !== "featured") q.set("sort", sortSel.value);
    if (query) q.set("q", params.get("q"));
    if (finder) { q.set("match", "1"); q.set("who", finder.who); q.set("when", finder.when); q.set("fnote", finder.note); }
    var s = q.toString();
    history.replaceState(null, "", window.location.pathname + (s ? "?" + s : ""));
  }

  GROUPS.forEach(function (g) { checks[g].forEach(function (c) { c.addEventListener("change", apply); }); });
  sortSel.addEventListener("change", apply);
  var clear = document.querySelectorAll("[data-clear]");
  clear.forEach(function (b) {
    b.addEventListener("click", function () {
      GROUPS.forEach(function (g) { checks[g].forEach(function (c) { c.checked = false; }); });
      query = ""; finder = null; if (searchIn) searchIn.value = ""; sortSel.value = "featured";
      apply();
    });
  });
  apply();

  /* ---- deep links: ?open=<id> opens that product's quick view, ?finder=1 opens the finder ---- */
  if (window.bootstrap) {
    var open = params.get("open");
    if (open) { var m = document.getElementById("qv-" + open); if (m) window.bootstrap.Modal.getOrCreateInstance(m).show(); }
    if (params.get("finder") === "1") { var f = document.getElementById("finder"); if (f) window.bootstrap.Modal.getOrCreateInstance(f).show(); }
  }
})();
