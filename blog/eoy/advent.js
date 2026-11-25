(function () {
    "use strict";
    var doors = Array.prototype.slice.call(document.querySelectorAll(".adv-door"));
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    doors.forEach(function (door) {
        door.addEventListener("click", function (event) {
            if (door.classList.contains("is-locked")) {
                event.preventDefault();
                door.classList.remove("is-shaking");
                void door.offsetWidth;
                door.classList.add("is-shaking");
                return;
            }
            if (door.dataset.opening === "done") return;
            event.preventDefault();
            if (door.dataset.opening) return;
            var url = door.getAttribute("data-url") || door.getAttribute("href");
            if (!url) return;
            door.dataset.opening = "1";
            door.classList.add("is-opening");
            var delay = reduce ? 90 : 480;
            window.setTimeout(function () {
                var tab = window.open(url, "_blank");
                door.dataset.opening = "done";
                if (!tab) window.location.href = url;
            }, delay);
        });
    });
})();
