(function () {
  function init() {
    if (window.__validationSplitGuardCleanup) {
      window.__validationSplitGuardCleanup();
    }

    var currentPopup = null;
    var popupTimeout = null;
    var manualOverride = false;
    var listeners = [];
    var POPUP_DURATION = 10000;
    var timerStart = null;
    var timerRemaining = 0;
    var timerBarEl = null;
    var timerAnimFrame = null;

    function listen(el, evt, fn) {
      el.addEventListener(evt, fn);
      listeners.push({ el: el, evt: evt, fn: fn });
    }

    window.__validationSplitGuardCleanup = function () {
      closePopup();
      listeners.forEach(function (l) {
        l.el.removeEventListener(l.evt, l.fn);
      });
      listeners = [];
    };

    function positionPopup() {
      if (!currentPopup) return;
      var splitEl = document.getElementById("validationSplit");
      if (!splitEl) return;

      var rect = splitEl.getBoundingClientRect();
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      currentPopup.style.top = (rect.bottom + scrollY + 6) + "px";
      currentPopup.style.left = (rect.left + scrollX) + "px";
    }

    function startTimerBar() {
      timerRemaining = POPUP_DURATION;
      timerStart = performance.now();
      animateTimerBar();
      popupTimeout = setTimeout(closePopup, POPUP_DURATION);
    }

    function animateTimerBar() {
      if (!timerBarEl || !currentPopup) return;
      var elapsed = performance.now() - timerStart;
      var pct = Math.max(0, 100 - (elapsed / timerRemaining) * 100);
      timerBarEl.style.width = pct + "%";
      if (pct > 0) {
        timerAnimFrame = requestAnimationFrame(animateTimerBar);
      }
    }

    function pauseTimer() {
      if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
      }
      if (timerAnimFrame) {
        cancelAnimationFrame(timerAnimFrame);
        timerAnimFrame = null;
      }
      var elapsed = performance.now() - timerStart;
      timerRemaining = Math.max(0, timerRemaining - elapsed);
    }

    function resumeTimer() {
      if (!currentPopup || timerRemaining <= 0) return;
      timerStart = performance.now();
      animateTimerBar();
      popupTimeout = setTimeout(closePopup, timerRemaining);
    }

    function closePopup() {
      if (timerAnimFrame) {
        cancelAnimationFrame(timerAnimFrame);
        timerAnimFrame = null;
      }
      if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
      }
      if (currentPopup && currentPopup.parentNode) {
        currentPopup.parentNode.removeChild(currentPopup);
      }
      currentPopup = null;
      timerBarEl = null;
    }

    function create_popup_dom() {
      var popup = document.createElement("div");
      popup.setAttribute("id", "validationSplitGuardPopup");
      popup.style.cssText =
        "position:absolute;z-index:999999;padding:0;background:#fff3cd;" +
        "border:1px solid #ffc107;border-radius:4px;color:#856404;font-size:13px;" +
        "max-width:360px;line-height:1.4;box-shadow:0 2px 6px rgba(0,0,0,0.12);" +
        "box-sizing:border-box;cursor:pointer;overflow:hidden;";

      timerBarEl = document.createElement("div");
      timerBarEl.style.cssText =
        "width:100%;height:4px;background:#ffc107;border-radius:4px 4px 0 0;" +
        "transition:none;";
      popup.appendChild(timerBarEl);

      var content = document.createElement("div");
      content.style.cssText = "padding:8px 32px 8px 12px;";

      var closeBtn = document.createElement("span");
      closeBtn.textContent = "\u2715";
      closeBtn.style.cssText =
        "cursor:pointer;font-weight:bold;position:absolute;top:10px;right:10px;" +
        "font-size:15px;line-height:1;color:#856404;";
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        closePopup();
      });

      var text = document.createElement("span");
      text.className = "TRANSLATEME_valsplitsettozero";

      content.appendChild(text);
      popup.appendChild(content);
      popup.appendChild(closeBtn);

      popup.addEventListener("click", closePopup);
      popup.addEventListener("mouseenter", pauseTimer);
      popup.addEventListener("mouseleave", resumeTimer);

      return popup;
    }

    function showPopup() {
      closePopup();

      var splitEl = document.getElementById("validationSplit");
      if (!splitEl) return;

      var popup = create_popup_dom();
      document.body.appendChild(popup);
      currentPopup = popup;

      positionPopup();

      if (typeof update_translations === "function") {
        update_translations();
      }

      startTimerBar();
    }

    function check() {
      var splitEl = document.getElementById("validationSplit");
      var maxFilesEl = document.getElementById("max_number_of_files_per_category");
      if (!splitEl || !maxFilesEl) return;

      var valSplit = Number(splitEl.value);
      var maxFiles = Number(maxFilesEl.value);

      if (isNaN(valSplit) || isNaN(maxFiles)) return;
      if (valSplit <= 0) return;

      // 0 means "all" — no limit, so don't interfere
      if (maxFiles <= 0) return;

      var valCount = Math.floor(maxFiles * (valSplit / 100));
      var trainCount = maxFiles - valCount;

      if ((trainCount <= 0 || valCount <= 0) && !manualOverride) {
        splitEl.value = 0;
        showPopup();
      }
    }

    function setup_split_guard_listeners(splitEl, maxFilesEl) {
      listen(maxFilesEl, "blur", function () {
        manualOverride = false;
        check();
      });
      listen(maxFilesEl, "change", function () {
        manualOverride = false;
        check();
      });

      listen(splitEl, "input", function () {
        manualOverride = true;
        closePopup();
      });
      listen(splitEl, "change", function () {
        manualOverride = true;
        closePopup();
      });

      listen(document, "keydown", function (e) {
        if (e.key === "Escape" || e.key === "Esc") {
          closePopup();
        }
      });

      listen(window, "resize", positionPopup);
      listen(window, "scroll", positionPopup);

      var parent = splitEl.parentElement;
      while (parent && parent !== document.body) {
        var overflow = getComputedStyle(parent).overflow;
        if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") {
          listen(parent, "scroll", positionPopup);
        }
        parent = parent.parentElement;
      }
    }

    var splitEl = document.getElementById("validationSplit");
    var maxFilesEl = document.getElementById("max_number_of_files_per_category");

    if (!splitEl || !maxFilesEl) {
      console.warn("[splitGuard] Required elements not found.");
      return;
    }

    setup_split_guard_listeners(splitEl, maxFilesEl);
    check();
  }

  // Run init when DOM is ready, or immediately if it already is
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
