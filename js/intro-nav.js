(function () {
  var nav = document.querySelector(".intro-inline-nav");
  if (!nav) return;

  function syncStuck() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    nav.classList.toggle("is-stuck", scrollTop > 0);
  }

  if ("IntersectionObserver" in window) {
    // Zero-footprint sentinel pinned flush at the top of the nav (y = 0).
    var sentinel = document.createElement("div");
    sentinel.className = "intro-nav-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "width:100%;height:1px;margin:0 0 -1px;padding:0;border:0;pointer-events:none;overflow:hidden;";
    nav.parentNode.insertBefore(sentinel, nav);

    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        var stuck = Boolean(
          scrollTop > 0 && entry && !entry.isIntersecting && entry.boundingClientRect.top <= 0
        );
        nav.classList.toggle("is-stuck", stuck);
      },
      { threshold: [0, 1], rootMargin: "0px" }
    );

    observer.observe(sentinel);
    syncStuck();
  } else {
    window.addEventListener("scroll", syncStuck, { passive: true });
    syncStuck();
  }
})();
