(function () {
  var gens = document.querySelectorAll(".gen");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    gens.forEach(function (g) {
      io.observe(g);
    });
  } else {
    gens.forEach(function (g) {
      g.classList.add("in-view");
    });
  }

  document.querySelectorAll(".node").forEach(function (node) {
    node.addEventListener("click", function () {
      var open = node.classList.contains("open");
      document.querySelectorAll(".node.open").forEach(function (n) {
        n.classList.remove("open");
      });
      if (!open) node.classList.add("open");
    });

    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        node.click();
      }
    });
  });
})();
