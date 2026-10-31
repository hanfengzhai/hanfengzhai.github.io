(function () {
  var nav = document.querySelector(".intro-inline-nav");
  if (!nav || !("IntersectionObserver" in window)) return;

  // Sentinel sits just above the nav. When it leaves the viewport,
  // the sticky nav has pinned — toggle a class for the frosted look only.
  var sentinel = document.createElement("div");
  sentinel.className = "intro-nav-sentinel";
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "width:100%;height:1px;margin:0;padding:0;border:0;pointer-events:none;";
  nav.parentNode.insertBefore(sentinel, nav);

  var observer = new IntersectionObserver(
    function (entries) {
      var entry = entries[0];
      nav.classList.toggle("is-stuck", entry && entry.boundingClientRect.top < 10 && !entry.isIntersecting);
    },
    { threshold: [0, 1], rootMargin: "-10px 0px 0px 0px" }
  );

  observer.observe(sentinel);
})();
