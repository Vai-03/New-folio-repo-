/* Portfolio behaviour: brief matcher, services cart, receipt, screenshot fallbacks,
   contents highlighting, and (preview build only) hash routing between pages. */
(function () {
  "use strict";
  var D = window.__SITE__ || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var picked = [];           // service ids, in the order they were added
  var intentKey = null;      // chosen intent, if any
  var freeText = "";
  var route = "home";

  /* ---------- Screenshots and videos that fail to load ---------- */
  function markMissing(el) {
    var host = el.closest(".shot, .vid");
    if (host) host.classList.add("is-missing");
  }
  $$(".shot img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener("error", function () { markMissing(img); });
  });

  /* ---------- Scroll progress and thumbnail tilt (from the live site) ---------- */
  var bar = $(".progress");
  function onScroll() {
    if (!bar) return;
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (!reduce && !(window.matchMedia && window.matchMedia("(hover: none)").matches)) {
    $$("[data-tilt]").forEach(function (card) {
      var m = $(".shot", card);
      if (!m) return;
      card.addEventListener("mousemove", function (e) {
        var r = m.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        m.style.transform = "perspective(900px) translateY(-4px) rotateX(" + (-y * 6) + "deg) rotateY(" + (x * 8) + "deg)";
      });
      card.addEventListener("mouseleave", function () { m.style.transform = ""; });
    });
  }

  /* ---------- Services cart ---------- */
  var svcById = {};
  (D.services || []).forEach(function (s, i) { svcById[s.id] = { title: s.title, code: "SVC-0" + (i + 1) }; });

  function setPicked(id, on) {
    var i = picked.indexOf(id);
    if (on && i < 0) picked.push(id);
    if (!on && i >= 0) picked.splice(i, 1);
  }
  function syncCart() {
    $$(".add[data-svc]").forEach(function (b) {
      var on = picked.indexOf(b.dataset.svc) >= 0;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      $(".add__label", b).textContent = on ? "Added" : "Add to brief";
      $(".mark", b).textContent = on ? "✓" : "+";
    });
    var bar = $("#cartbar");
    if (bar) {
      bar.hidden = !(picked.length && route === "home");
      var n = $("#cartcount");
      if (n) n.textContent = picked.length + (picked.length === 1 ? " service" : " services");
    }
    renderReceipt();
  }
  $$(".add[data-svc]").forEach(function (b) {
    b.addEventListener("click", function () {
      setPicked(b.dataset.svc, b.getAttribute("aria-pressed") !== "true");
      syncCart();
    });
  });

  /* ---------- Receipt and outgoing message ---------- */
  function composeMessage() {
    var lines = [D.contact.whatsappDefault];
    if (intentKey && D.intents[intentKey]) lines.push("I'm looking to " + D.intents[intentKey].echo + ".");
    else if (freeText) lines.push("I'm looking to: " + freeText);
    if (picked.length) {
      lines.push("Services I'm interested in: " + picked.map(function (id) { return svcById[id].title; }).join(", ") + ".");
    }
    var note = $("#brief-note");
    if (note && note.value.trim()) lines.push(note.value.trim());
    return lines.join("\n");
  }
  function renderReceipt() {
    var rows = $("#receipt-rows");
    if (!rows) return;
    rows.textContent = "";
    function row(k, v) {
      var d = document.createElement("div"); d.className = "row";
      var dt = document.createElement("dt"); dt.textContent = k;
      var dd = document.createElement("dd"); dd.textContent = v;
      d.appendChild(dt); d.appendChild(dd); rows.appendChild(d);
    }
    if (intentKey && D.intents[intentKey]) row("Looking to", D.intents[intentKey].echo);
    else if (freeText) row("Looking to", freeText);
    picked.forEach(function (id) { row(svcById[id].code, svcById[id].title); });
    if (!rows.children.length) {
      var e = document.createElement("p"); e.className = "empty";
      e.textContent = "Nothing in your brief yet. Add services above, or tell me what you are building.";
      rows.appendChild(e);
    }
    var msg = composeMessage();
    var wa = $("#wa-link"), mail = $("#mail-link");
    if (wa) wa.href = "https://wa.me/" + D.contact.whatsapp + "?text=" + encodeURIComponent(msg);
    if (mail) mail.href = "mailto:" + D.contact.email + "?subject=" + encodeURIComponent("A project for you") + "&body=" + encodeURIComponent(msg);
  }
  var note = $("#brief-note");
  if (note) note.addEventListener("input", renderReceipt);
  var copyBtn = $("#copy-brief");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var msg = composeMessage();
    var done = function (ok) {
      var h = $("#copy-hint");
      if (h) h.textContent = ok ? "Copied. Paste it wherever you prefer." : "Copy blocked here. Select the message above and copy it.";
    };
    var box = $("#brief-preview");
    if (box) { box.value = msg; box.hidden = false; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(function () { done(true); }, function () { if (box) box.select(); done(false); });
    } else { if (box) box.select(); done(false); }
  });

  /* ---------- Brief console ---------- */
  var out = $("#console-out"), acts = $("#console-actions"), stateEl = $("#console-state");
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function line(mark, html, cls) {
    var p = document.createElement("p");
    p.className = "tl" + (cls ? " " + cls : "") + (reduce ? "" : " tl--in");
    var b = document.createElement("b"); b.textContent = mark;
    var s = document.createElement("span");
    if (typeof html === "string") s.textContent = html; else s.appendChild(html);
    p.appendChild(b); p.appendChild(s);
    return p;
  }
  function dimLine(label, value) {
    var f = document.createDocumentFragment();
    var em = document.createElement("em"); em.textContent = label + " ";
    f.appendChild(em); f.appendChild(document.createTextNode(value));
    return f;
  }
  function play(lines, then) {
    clearTimers();
    out.textContent = "";
    if (acts) acts.hidden = true;
    if (stateEl) stateEl.textContent = "working";
    var i = 0;
    function next() {
      if (i >= lines.length) { if (stateEl) stateEl.textContent = "ready"; if (then) then(); return; }
      out.appendChild(lines[i++]);
      if (reduce) next(); else timers.push(setTimeout(next, 300));
    }
    next();
  }
  function setMatches(projSlugs, svcIds) {
    $$(".card[data-slug]").forEach(function (c) { c.dataset.match = projSlugs.indexOf(c.dataset.slug) >= 0 ? "1" : "0"; });
    $$(".svc[data-id]").forEach(function (c) { c.dataset.match = svcIds.indexOf(c.dataset.id) >= 0 ? "1" : "0"; });
  }
  function setActions(buttons) {
    if (!acts) return;
    acts.textContent = "";
    buttons.forEach(function (b) { acts.appendChild(b); });
    acts.hidden = false;
  }
  function actLink(label, hash, alt) {
    var a = document.createElement("a");
    a.textContent = label; a.href = D.home(hash); if (alt) a.className = "alt";
    return a;
  }
  function actButton(label, fn, alt) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = label; if (alt) b.className = "alt";
    b.addEventListener("click", fn); return b;
  }
  function chooseIntent(key) {
    var it = D.intents[key];
    intentKey = key; freeText = "";
    $$(".chip[data-intent]").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.intent === key ? "true" : "false"); });
    setMatches(it.projects, it.services);
    var titles = it.projects.map(function (s) { return D.projectTitles[s]; });
    var svcTitles = it.services.map(function (id) { return svcById[id].title; });
    var lines = [
      line("›", dimLine("brief", it.echo)),
      line("›", dimLine("looking for", it.looking)),
      line("›", it.projects.length
        ? dimLine("found " + it.projects.length + (it.projects.length === 1 ? " project" : " projects"), titles.join(", "))
        : dimLine("projects", "none under this label yet, services fit better")),
      line("›", dimLine("suggested", svcTitles.join(" + "))),
      line("✓", "ready. look at the work, or add these to your brief.")
    ];
    play(lines, function () {
      var btns = [];
      if (it.projects.length) btns.push(actLink("See matching work", "work"));
      btns.push(actButton("Add suggested services", function () {
        it.services.forEach(function (id) { setPicked(id, true); });
        syncCart();
        var el = $("#services"); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }, it.projects.length > 0));
      setActions(btns);
    });
    renderReceipt();
  }
  function matchText(text) {
    var t = text.toLowerCase();
    if (/\b(agent|agents|agentic|ai|llm|gpt|bot|chatbot|copilot|automation|assistant)\b/.test(t)) return "agent";
    if (/\b(saas|b2b|dashboard|platform|enterprise|admin|crm|analytics|workflow|tool)\b/.test(t)) return "saas";
    if (/\b(mobile|app|ios|android|handheld|iphone)\b/.test(t)) return "mobile";
    if (/\b(brand|branding|logo|website|portfolio|identity|social|landing)\b/.test(t)) return "brand";
    return null;
  }
  var form = $("#brief-form");
  if (form) {
    $$(".chip[data-intent]").forEach(function (c) {
      c.addEventListener("click", function () { chooseIntent(c.dataset.intent); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#brief-input"), text = input.value.trim();
      if (!text) { input.focus(); return; }
      var key = matchText(text);
      if (key) { chooseIntent(key); return; }
      intentKey = null; freeText = text;
      $$(".chip[data-intent]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      setMatches([], []);
      play([
        line("›", dimLine("brief", text)),
        line("›", "no direct match in my past work, which is fine."),
        line("✓", "put it in your brief and I will read it myself.")
      ], function () {
        setActions([actLink("Start your brief", "contact")]);
      });
      renderReceipt();
    });
  }

  /* ---------- Case study contents ---------- */
  $$("a[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var el = document.getElementById(a.dataset.scroll);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });
  if ("IntersectionObserver" in window) {
    var secs = $$(".cs[id]");
    if (secs.length) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          $$(".toc a").forEach(function (a) {
            if (a.dataset.scroll === e.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-20% 0px -65% 0px" });
      secs.forEach(function (s) { tio.observe(s); });
    }
  }

  /* ---------- Preview routing (single-file preview only) ---------- */
  if (D.preview) {
    var routes = $$("[data-route]");
    var applyRoute = function () {
      var h = (location.hash || "").slice(1), anchor = "", next = "home";
      if (h.indexOf("p-") === 0 && routes.some(function (r) { return r.dataset.route === h; })) next = h;
      else if (h.indexOf("home-") === 0) anchor = h.slice(5);
      var changed = next !== route;
      route = next;
      routes.forEach(function (r) { r.hidden = r.dataset.route !== route; });
      var bar = $("#cartbar"); if (bar) bar.hidden = !(picked.length && route === "home");
      var target = anchor && document.getElementById(anchor);
      if (target) target.scrollIntoView({ behavior: changed || reduce ? "auto" : "smooth" });
      else if (changed || !anchor) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", applyRoute);
    applyRoute();
  }

  /* ---------- Hero: variable-font headline that follows the cursor, glow, magnetic buttons ---------- */
  (function () {
    var hero = $(".hero"); if (!hero) return;
    var chars = $$(".hero__title .c");
    chars.forEach(function (c, i) { c.style.setProperty("--i", i); });
    var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;
    var mx = -1e4, my = -1e4, raf = 0, rects = [];
    function measure() { rects = chars.map(function (c) { var r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); }
    function frame() {
      raf = 0;
      for (var i = 0; i < chars.length; i++) {
        var dx = rects[i][0] - mx, dy = rects[i][1] - my, t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
        chars[i].style.setProperty("--t", (t * t * (3 - 2 * t)).toFixed(3));
      }
    }
    hero.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      var b = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (e.clientX - b.left) + "px"); hero.style.setProperty("--my", (e.clientY - b.top) + "px");
      if (!raf) { measure(); raf = requestAnimationFrame(frame); }
    });
    hero.addEventListener("pointerleave", function () { mx = my = -1e4; if (!raf) raf = requestAnimationFrame(frame); });
    $$(".hero__cta .btn, .badge").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * .18) + "px " + ((e.clientY - r.top - r.height / 2) * .28) + "px";
      });
      el.addEventListener("pointerleave", function () { el.style.translate = ""; });
    });
  })();

  /* ---------- Scroll reveal ---------- */
  (function () {
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = $$(".section__head, .svc, .card, .passage, .note, .ledger li, .portrait, .contact > *");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el, i) { el.classList.add("rv"); el.style.setProperty("--d", ((i % 4) * 70) + "ms"); io.observe(el); });
  })();

  syncCart();
})();
