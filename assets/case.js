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
