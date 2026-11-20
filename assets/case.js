/* Case study pages: scroll progress bar, contents highlighting, smooth jumps. No dependencies. */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var bar = document.querySelector(".progress");
  function onScroll() {
    if (!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[data-jump]"));
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var el = document.getElementById(a.dataset.jump);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", "#" + a.dataset.jump);
    });
  });

  if (!("IntersectionObserver" in window) || !links.length) return;
  var sections = Array.prototype.slice.call(document.querySelectorAll(".cs[id]"));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) {
        if (a.dataset.jump === e.target.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-20% 0px -65% 0px" });
  sections.forEach(function (s) { io.observe(s); });
})();

/*__CHAT__*/
/* Chat assistant. Answers from the portfolio content. If /api/chat is configured it asks Claude;
   otherwise it falls back to the built-in answers below. KB is generated from content.mjs at build time. */
(function () {
  "use strict";
  var K = {"name":"Vaishnavi Vidwans","email":"vaishnavividwans@gmail.com","linkedin":"https://www.linkedin.com/in/vaishnavi-vidwans/","wa":"917218270459","status":"Available for freelance projects · Mumbai & remote","services":[{"t":"Branding","x":"Identity, logo, type and colour systems that feel considered, not templated."},{"t":"UX writing","x":"Microcopy, onboarding, empty and error states, and a product voice that helps people decide."},{"t":"UX research","x":"Interviews, usability tests and audits, turned into clear, prioritised findings."},{"t":"UX design","x":"Flows, information architecture and prototypes for products that need to make sense."},{"t":"UI design","x":"Polished, accessible interfaces and component libraries, ready for developer handoff."},{"t":"Personal brand websites","x":"Portfolios and personal sites that look and sound like you, not a template."},{"t":"Complex enterprise systems","x":"Dashboards, workflows and AI features for operational tools, with IBM-grade rigour."},{"t":"Social media creatives","x":"Posts, carousels and launch assets that stay on-brand and easy to reuse."}],"projects":[{"slug":"service-forge","title":"Service Forge","meta":"Restaurant ops · 0→1","blurb":"A shared service board for kitchens, ops and vendors, built around trusted ticket state.","tagline":"A shared service board for kitchens, operations teams, and vendors—built around the one thing everyone needs to trust: ticket state.","contribution":"Product concept, information architecture, interface system, and clickable prototype.","stat":{"value":"3","label":"roles, one source of truth"},"keys":["service forge","forge","restaurant","kitchen","ticket","vendor"]},{"slug":"ai-academic-dashboards","title":"AI academic dashboards","meta":"Singularis · EdTech","blurb":"One university platform for students, staff and admins — three very different jobs.","tagline":"One university platform, three very different jobs: career planning for students, daily operations for staff, and institutional control for admins.","contribution":"Research, IA, aspiration-engine UX, analytics visualisation, and the product design system.","stat":{"value":"0→1","label":"platform & design system"},"keys":["academic","university","student","edtech","aspiration"]},{"slug":"clinical-ai","title":"Clinical AI, with a human exit","meta":"Psych UK · Healthcare","blurb":"Drafts intake notes, shows uncertainty, cites sources, and keeps the human one tap away.","tagline":"A clinical assistant that drafts intake notes, exposes uncertainty, cites sources, and never buries the human handoff.","contribution":"Conversation model, safety and handoff patterns, high-fidelity prototype, and stakeholder deck.","stat":{"value":"1 tap","label":"to human escalation"},"keys":["clinical","healthcare","patient","psych","escalat","intake"]},{"slug":"field-ops","title":"Field ops under pressure","meta":"Oil & gas · Field","blurb":"Handheld inspections for gloves, glare, interruptions and shift handoffs.","tagline":"Handheld-first inspections designed for gloves, glare, interrupted attention, and the reality of a shift handoff.","contribution":"Research framing, interaction model, handheld and supervisor UI, and full-shift prototype.","stat":{"value":"12","label":"steps, one live loop"},"keys":["field ops","field","inspection","oil","gas","handheld","shift"]},{"slug":"unvoro","title":"One flow for AI SEO","meta":"Unvoro · AI SEO","blurb":"Scattered SEO, GEO and AI-writing tools reworked into one path to a published post.","tagline":"Powerful SEO, GEO and AI-writing features that felt like separate tools, reworked into one flow—from keyword opportunity to a published, measurable post.","contribution":"UX audit and end-to-end flow redesign.","stat":{"value":"296→1","label":"noisy actions, one next step"},"keys":["unvoro","seo","geo","writing tool"]}],"exp":[{"org":"Singularis Ventures","role":"Senior Product Designer","text":"Sole designer on a 0→1 B2B2C EdTech platform and agentic AI aspiration engine.","years":"2025–26"},{"org":"IBM","role":"UX & Visual Designer","text":"Process Mining, RPA and EaseJava, aligned to Carbon and accessibility.","years":"2023–25"},{"org":"arieotech","role":"UI Design Intern","text":"Product interfaces, brand collateral, decks and product films.","years":"2022"}],"tools":["Figma","Framer","Blender","After Effects","Notion","Claude","IBM Carbon"],"approach":[["Frame the real problem","Turn stakeholder noise and user friction into one shared product question."],["Design the decision surface","Make the next useful action obvious, even when the system underneath is not."],["Bring the system with you","States, principles and patterns that keep working beyond one screen."],["Leave evidence behind","Research signals, shipped scope and usability findings — not invented numbers."]],"notes":[{"title":"On the shelf","text":"Long books keep me patient with complexity, and curious about how other people think."},{"title":"Made by hand","text":"I love objects where you can see the seams, and the care that went into them."},{"title":"On the trail","text":"Hiking is wayfinding at its most honest: where am I, and what’s next?"},{"title":"Sitting still","text":"Meditation is practice in noticing what’s essential and letting the rest go. Interfaces need the same."}]};
  var HOME = "/", WORK = "/work/", EXT = "";
  if (!K) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmt(t) {
    return esc(t)
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (_, a, u) {
        var ext = /^(https?:|mailto:)/.test(u);
        return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + a + "</a>";
      })
      .replace(/\n/g, "<br>");
  }
  function proj(p) { return "[[Read the case study|" + WORK + p.slug + EXT + "]]"; }
  var WA = "https://wa.me/" + K.wa + "?text=" + encodeURIComponent("Hi Vaishnavi, I found you through your portfolio.");
  var CONTACT = "WhatsApp: [[Message Vaishnavi|" + WA + "]]\nEmail: [[" + K.email + "|mailto:" + K.email + "]]\nLinkedIn: [[vaishnavi-vidwans|" + K.linkedin + "]]";

  /* ---------- Built-in answers ---------- */
  var E = [];
  function add(keys, text, chips) { E.push({ k: keys, a: text, c: chips || [] }); }

  add(["hello", "hi", "hey", "namaste", "good morning", "good evening"],
    "Hi! I'm Vaishnavi's assistant. I can tell you about her work, services, experience, or how to start a project. What would you like to know?");
  add(["who is", "who are", "about her", "about you", "about vaishnavi", "background", "introduce", "yourself", "vaishnavi"],
    K.name + " is a senior product designer in Mumbai who works with founders and teams, remotely and in person. Her focus is enterprise tools and AI products. She has worked at IBM and Singularis Ventures, and she cares most about interfaces that help people understand what happened, what matters and what to do next.\n[[Read her story|" + HOME + "#about]]",
    ["What has she worked on?", "What services do you offer?"]);
  add(["service", "offer", "what do you do", "what can you do", "help with", "branding", "logo", "ux writing", "research", "ui design", "ux design", "social"],
    "Vaishnavi offers:\n" + K.services.map(function (s) { return "• " + s.t; }).join("\n") + "\n\nYou can pick the ones you need on the home page and it builds a brief you can send her.\n[[See services|" + HOME + "#services]]",
    ["How do I start a project?", "What does it cost?"]);
  add(["available", "availability", "freelance", "hire", "hiring", "open to", "free", "work with", "book", "slot"],
    "Yes. " + K.status + ". The quickest way to start is to describe your project on WhatsApp, or build a brief from the services list.\n" + CONTACT,
    ["What does it cost?", "Show me her AI work"]);
  add(["price", "pricing", "cost", "rate", "rates", "budget", "quote", "charge", "fee", "how much", "expensive"],
    "There's no fixed rate card, because it depends on scope and timeline. Tell Vaishnavi what you're building, when you need it and your rough budget, and she'll reply with a proposal.\n" + CONTACT,
    ["How do I start a project?", "What services do you offer?"]);
  add(["start", "begin", "get started", "process", "how do i", "next step", "brief", "kick off", "engage"],
    "1. Tell her what you're building (use \"Add to brief\" on the services list, or just message her).\n2. She replies, usually the same day, with questions or a plan.\n3. You agree scope and timeline, then she starts.\n[[Start a brief|" + HOME + "#services]]\n" + CONTACT,
    ["What does it cost?", "How does she work?"]);
  add(["contact", "email", "mail", "whatsapp", "phone", "number", "linkedin", "reach", "talk to", "call", "message"],
    "You can reach Vaishnavi here:\n" + CONTACT + "\nShe usually replies the same day.");
  add(["where", "location", "based", "mumbai", "remote", "timezone", "time zone", "india"],
    "Vaishnavi is based in Mumbai and works with teams remotely and in person.");
  add(["experience", "worked", "career", "ibm", "singularis", "arieotech", "company", "companies", "job", "years", "resume", "cv", "employer"],
    "Her experience:\n" + K.exp.map(function (e) { return "• " + e.role + ", " + e.org + " (" + e.years + "): " + e.text; }).join("\n") + "\n[[Full history on LinkedIn|" + K.linkedin + "]]",
    ["What has she worked on?", "What tools does she use?"]);
  add(["tool", "tools", "stack", "software", "figma", "framer", "blender", "carbon", "use"],
    "Her main tools are " + K.tools.join(", ") + ". She also works within IBM Carbon and accessibility standards on enterprise products.");
  add(["how does she work", "approach", "method", "way of working", "think", "principle", "philosophy"],
    "Her approach:\n" + K.approach.map(function (a, i) { return (i + 1) + ". " + a[0] + ": " + a[1]; }).join("\n"),
    ["What has she worked on?", "Is she available?"]);
  add(["hobby", "hobbies", "interest", "interests", "free time", "outside work", "read", "hike", "hiking", "meditat", "book", "craft", "personal"],
    "Outside work: " + K.notes.map(function (n) { return n.title.toLowerCase() + " (" + n.text.replace(/\.$/, "").toLowerCase() + ")"; }).join("; ") + ".\n[[Field notes|" + HOME + "#notes]]");
  add(["ai", "agent", "agents", "agentic", "llm", "machine learning", "artificial"],
    "Her AI work includes:\n• Clinical AI: a clinical assistant with visible uncertainty and one-tap human escalation.\n• AI academic dashboards: an agentic aspiration engine for a university platform.\n• Unvoro: an AI SEO workflow that turns scattered tools into one path.\n[[See all work|" + HOME + "#work]]",
    ["Tell me about Clinical AI", "Tell me about Unvoro"]);
  add(["work", "projects", "portfolio", "case study", "case studies", "examples", "show me", "what has she", "built"],
    "Selected work:\n" + K.projects.map(function (p) { return "• " + p.title + ": " + p.blurb; }).join("\n") + "\n[[See all work|" + HOME + "#work]]",
    ["Tell me about Service Forge", "Show me her AI work"]);
  K.projects.forEach(function (p) {
    var keys = p.keys.slice(), n0 = E.length;
    add(keys,
      p.title + " (" + p.meta + ")\n" + p.tagline + "\n\nHer role: " + p.contribution + "\nOutcome: " + p.stat.value + " " + p.stat.label + ".\n" + proj(p),
      ["Show me other projects", "How do I start a project?"]);
    E[n0].p = true;
  });
  add(["mobile", "app", "apps", "saas", "b2b", "enterprise", "dashboard"],
    "Vaishnavi designs B2B SaaS and enterprise products, including dashboards, field and handheld tools, and AI features. Good examples are Service Forge, Field ops under pressure, and the AI academic dashboards.\n[[See all work|" + HOME + "#work]]");
  add(["are you", "bot", "chatbot", "real", "human", "robot", "assistant", "claude", "gpt"],
    "I'm an assistant on Vaishnavi's site. I answer from what's on this portfolio, and for anything else I'll point you to her directly.\n" + CONTACT);
  add(["thanks", "thank you", "thx", "great", "awesome", "cool", "nice"],
    "You're welcome! If you'd like to talk to Vaishnavi directly, here's how:\n" + CONTACT);

  var FALLBACK = "I don't have that in her portfolio, so it's best to ask Vaishnavi directly. She usually replies the same day.\n" + CONTACT;
  var STARTERS = ["What services do you offer?", "Show me her AI work", "Is she available?", "How do I start a project?"];

  function hit(q, key) {
    if (key.length <= 3) return new RegExp("(^|[^a-z0-9])" + key + "([^a-z0-9]|$)").test(q);
    return q.indexOf(key) >= 0;
  }
  function local(q) {
    q = q.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    var best = null, bs = 0;
    E.forEach(function (e, i) {
      var s = 0;
      e.k.forEach(function (k) { if (hit(q, k)) s += (k.length > 5 ? 2 : 1) * (e.p ? 3 : 1); });
      if (e.a.indexOf("Hi! I'm") === 0 && q.split(" ").length > 3) s = 0;
      if (s > bs) { bs = s; best = e; }
    });
    return best ? { text: best.a, chips: best.c } : { text: FALLBACK, chips: STARTERS.slice(0, 3) };
  }

  /* ---------- UI ---------- */
  var open = false, api = true, busy = false, history = [];
  var root = document.createElement("div");
  root.className = "ask";
  root.innerHTML =
    '<button class="ask__fab" type="button" aria-expanded="false" aria-controls="chat-panel">' +
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2c.6 5.2 2.8 7.4 8 8-5.2.6-7.4 2.8-8 8-.6-5.2-2.8-7.4-8-8 5.2-.6 7.4-2.8 8-8z"/><path d="M19 15c.3 2.3 1.2 3.2 3.5 3.5-2.3.3-3.2 1.2-3.5 3.5-.3-2.3-1.2-3.2-3.5-3.5 2.3-.3 3.2-1.2 3.5-3.5z"/></svg>' +
    '<span class="ask__fab-label">Ask about my work</span></button>' +
    '<div class="ask__nudge" hidden>Ask me anything about Vaishnavi’s work</div>' +
    '<section class="ask__panel" id="chat-panel" role="dialog" aria-label="Chat with Vaishnavi’s assistant" hidden>' +
    '<header class="ask__head"><span class="ask__live" aria-hidden="true"></span><div><strong>Ask Vaishnavi’s assistant</strong><small>Answers from this portfolio</small></div>' +
    '<button class="ask__close" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
    '<div class="ask__log" aria-live="polite"></div>' +
    '<div class="ask__chips" role="group" aria-label="Suggested questions"></div>' +
    '<form class="ask__form" novalidate><label class="sr-only" for="chat-input">Your question</label>' +
    '<input id="chat-input" type="text" autocomplete="off" maxlength="300" placeholder="Ask about services, projects, availability…">' +
    '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form></section>';
  document.body.appendChild(root);

  var fab = $(".ask__fab", root), panel = $(".ask__panel", root), log = $(".ask__log", root),
      chips = $(".ask__chips", root), form = $(".ask__form", root), input = $("#chat-input", root),
      nudge = $(".ask__nudge", root);

  function scroll() { log.scrollTop = log.scrollHeight; }
  function bubble(who, html) {
    var d = document.createElement("div");
    d.className = "ask__msg ask__msg--" + who;
    d.innerHTML = html;
    log.appendChild(d); scroll();
    return d;
  }
  function setChips(list) {
    chips.innerHTML = "";
    (list || []).slice(0, 3).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = t;
      b.addEventListener("click", function () { ask(t); });
      chips.appendChild(b);
    });
  }
  function save() { try { sessionStorage.setItem("chat-h", JSON.stringify(history.slice(-12))); } catch (e) {} }
  function load() {
    try { var h = JSON.parse(sessionStorage.getItem("chat-h") || "[]"); if (Array.isArray(h)) return h; } catch (e) {}
    return [];
  }

  function toggle(force) {
    open = typeof force === "boolean" ? force : !open;
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    root.classList.toggle("is-open", open);
    nudge.hidden = true;
    if (open) { setTimeout(function () { input.focus({ preventScroll: true }); scroll(); }, 60); }
    else fab.focus({ preventScroll: true });
  }
  fab.addEventListener("click", function () { toggle(); });
  $(".ask__close", root).addEventListener("click", function () { toggle(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) toggle(false); });

  function remote(messages) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    return fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }), signal: ctl ? ctl.signal : undefined,
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("api " + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || !j.reply) throw new Error("empty");
      return j.reply;
    });
  }

  function reply(text, chipList) {
    var t = $(".ask__typing", log); if (t) t.remove();
    bubble("bot", fmt(text));
    history.push({ role: "assistant", content: text }); save();
    setChips(chipList && chipList.length ? chipList : STARTERS.slice(0, 3));
    scroll();
    busy = false; form.classList.remove("is-busy");
  }

  function ask(text) {
    text = String(text || "").trim().slice(0, 300);
    if (!text || busy) return;
    busy = true; form.classList.add("is-busy");
    bubble("me", esc(text));
    history.push({ role: "user", content: text }); save();
    setChips([]);
    var typing = bubble("bot", '<span class="ask__typing" aria-label="Typing"><i></i><i></i><i></i></span>');
    typing.classList.add("ask__typing-wrap");
    var delay = reduce ? 0 : 450;
    var fallback = function () { var r = local(text); setTimeout(function () { typing.remove(); reply(r.text, r.chips); }, delay); };
    if (!api || !/^https?:$/.test(location.protocol)) return fallback();
    remote(history.slice(-8)).then(function (txt) { typing.remove(); reply(txt, []); }).catch(function () { api = false; fallback(); });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });

  /* Start: restore or greet */
  history = load();
  if (history.length) {
    history.forEach(function (m) { bubble(m.role === "user" ? "me" : "bot", m.role === "user" ? esc(m.content) : fmt(m.content)); });
    setChips(STARTERS.slice(0, 3));
  } else {
    bubble("bot", fmt("Hi, I'm Vaishnavi's assistant. Ask me about her work, services or availability, and I'll point you to the right place."));
    setChips(STARTERS);
  }
  setTimeout(scroll, 0);

  /* One gentle nudge per visit */
  var seen = false; try { seen = sessionStorage.getItem("chat-nudge") === "1"; } catch (e) {}
  if (!seen) {
    setTimeout(function () {
      if (open) return;
      nudge.hidden = false;
      try { sessionStorage.setItem("chat-nudge", "1"); } catch (e) {}
      setTimeout(function () { nudge.hidden = true; }, 7000);
    }, 6000);
  }
  nudge.addEventListener("click", function () { toggle(true); });
})();
