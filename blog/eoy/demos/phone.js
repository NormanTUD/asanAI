(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function phoneScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-phone-scene";
    el.innerHTML =
      '<div class="ia-stage">' +
        '<div class="ia-phone-switch" role="tablist" aria-label="' + (DE ? "Suche oder Chat" : "Search or chat") + '">' +
          '<button type="button" class="is-on" data-phone="search" role="tab" aria-selected="true">' + (DE ? "Suche" : "Search") + '</button>' +
          '<button type="button" data-phone="chat" role="tab" aria-selected="false">' + (DE ? "Chat" : "Chat") + '</button>' +
        '</div>' +
        '<div class="ia-phones">' +
          '<div class="ia-phone">' +
            '<div class="ia-phone-frame"></div>' +
            '<div class="ia-phone-notch"></div>' +
            '<div class="ia-phone-screen ia-screen-layer ia-search-screen is-active" id="ia-phone">' +
              '<div class="ia-eoy-status" aria-hidden="true"><span class="ia-eoy-time">9:41</span><span class="ia-home-status-icons">' +
                '<span class="ia-status-signal"><i></i><i></i><i></i><i></i></span>' +
                '<svg class="ia-status-wifi" viewBox="0 0 18 14"><path d="M2 5.5c4-3.8 10-3.8 14 0M4.6 8.2c2.5-2.3 6.3-2.3 8.8 0M7.2 10.9c1-.9 2.6-.9 3.6 0M9 13h.01" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
                '<svg class="ia-status-battery" viewBox="0 0 20 11"><rect x="0.75" y="0.75" width="15.5" height="9.5" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2.6" y="2.6" width="10" height="5.8" rx="1.2" fill="currentColor"/><path d="M18 3.6v3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
              '</span></div>' +
              '<div class="ia-app-logo" id="ia-logo" aria-hidden="true"></div>' +
              '<div class="ia-search-bar" id="ia-search-bar">' +
                '<div class="ia-search-icon" aria-hidden="true"></div>' +
                '<div class="ia-search-text" id="ia-search-text"></div>' +
              '</div>' +
              '<div class="ia-ai-card" id="ia-ai-card">' +
                '<div class="ia-ai-text" id="ia-ai-text"></div>' +
                '<div class="ia-ai-thinking" id="ia-ai-thinking" aria-hidden="true"><span></span><span></span><span></span></div>' +
              '</div>' +
              '<div class="ia-serp" id="ia-serp"></div>' +
              '<div class="ia-eoy-keyboard" id="ia-eoy-keyboard" aria-hidden="true">' +
                '<div class="ia-eoy-swipe" id="ia-eoy-swipe"></div>' +
                '<div class="ia-eoy-keys" id="ia-eoy-keys"></div>' +
              '</div>' +
            '</div>' +
            '<div class="ia-phone-screen ia-screen-layer ia-phone--chat ia-chat-screen" id="ia-chat-phone">' +
              '<div class="ia-chat-appbar"><span>' + (DE ? "KI-Chat" : "AI chat") + '</span><i class="ia-chat-live" aria-hidden="true"></i></div>' +
              '<div class="ia-chat-thread" aria-live="polite">' +
                '<div class="ia-chat-msg is-user"><span class="ia-chat-role">' + (DE ? "Du" : "You") + '</span><span class="ia-chat-bubble ia-chat-question"></span></div>' +
                '<div class="ia-chat-msg is-ai"><span class="ia-chat-role">LLM</span><span class="ia-chat-bubble ia-chat-answer"></span><span class="ia-chat-thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '</div>' +
              '<div class="ia-chat-compose"><span class="ia-chat-placeholder">' + (DE ? "Nachricht" : "Message") + '</span><span class="ia-chat-input"></span><i class="ia-chat-send" aria-hidden="true"></i></div>' +
            '</div>' +
            '<div class="ia-phone-screen ia-screen-layer ia-home-screen" id="ia-home">' +
              '<div class="ia-home-status"><span class="ia-home-time"></span><span class="ia-home-status-icons" aria-hidden="true">' +
                '<span class="ia-status-signal"><i></i><i></i><i></i><i></i></span>' +
                '<svg class="ia-status-wifi" viewBox="0 0 18 14"><path d="M2 5.5c4-3.8 10-3.8 14 0M4.6 8.2c2.5-2.3 6.3-2.3 8.8 0M7.2 10.9c1-.9 2.6-.9 3.6 0M9 13h.01" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
                '<svg class="ia-status-battery" viewBox="0 0 20 11"><rect x="0.75" y="0.75" width="15.5" height="9.5" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2.6" y="2.6" width="10" height="5.8" rx="1.2" fill="currentColor"/><path d="M18 3.6v3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
              '</span></div>' +
              '<div class="ia-home-apps">' +
                '<button type="button" class="ia-home-app" data-home-app="chat" aria-label="' + (DE ? "KI-Chat öffnen" : "Open AI chat") + '">' +
                  '<span class="ia-home-icon ia-home-icon--chat" aria-hidden="true"></span>' +
                  '<span class="ia-home-label">' + (DE ? "KI-Chat" : "AI chat") + '</span>' +
                '</button>' +
                '<div class="ia-home-app is-muted" aria-hidden="true"><span class="ia-home-icon ia-home-icon--search"></span><span class="ia-home-label">' + (DE ? "Suche" : "Search") + '</span></div>' +
                '<div class="ia-home-app is-muted" aria-hidden="true"><span class="ia-home-icon ia-home-icon--code"></span><span class="ia-home-label">Code</span></div>' +
                '<div class="ia-home-app is-muted" aria-hidden="true"><span class="ia-home-icon ia-home-icon--photos"></span><span class="ia-home-label">' + (DE ? "Fotos" : "Photos") + '</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="ia-phone-chrome" aria-hidden="true"><div class="ia-phone-navbar" hidden>' +
              '<span class="ia-nav-key ia-nav-back"></span>' +
              '<span class="ia-nav-key ia-nav-home"></span>' +
              '<span class="ia-nav-key ia-nav-recents"></span>' +
            '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    root.appendChild(el);
    var stage = el.querySelector(".ia-stage");
    var phonesWrap = el.querySelector(".ia-phones");
    var chatPhone = el.querySelector("#ia-chat-phone");
    var chatScreen = el.querySelector(".ia-chat-screen");
    var searchPhone = el.querySelector("#ia-phone");
    var keyboardEl = el.querySelector("#ia-eoy-keyboard");
    var keysEl = el.querySelector("#ia-eoy-keys");
    var swipeLayer = el.querySelector("#ia-eoy-swipe");
    var keyEls = {};
    var swipeRaf = 0;
    var typedText = "";
    var homeScreen = el.querySelector("#ia-home");
    var homeChatApp = el.querySelector('[data-home-app="chat"]');
    var homeTimeEl = el.querySelector(".ia-home-time");
    var phoneNavbar = el.querySelector(".ia-phone-navbar");
    var chatQuestionEl = el.querySelector(".ia-chat-question");
    var chatAnswerEl = el.querySelector(".ia-chat-answer");
    var chatInputEl = el.querySelector(".ia-chat-input");
    var chatComposeEl = el.querySelector(".ia-chat-compose");
    var view = "search", chatStarted = false, launchingChat = false, sequenceDone = null, advance = null;
    var modeBtns = el.querySelectorAll("[data-phone]");
    var homeWallpaper = api.asset ? api.asset("opera.jpg") : "opera.jpg";
    if (homeScreen) homeScreen.style.backgroundImage = "url('" + homeWallpaper + "')";
    try { var preloadHome = new Image(); preloadHome.src = homeWallpaper; } catch (e) {}
    if (homeTimeEl) {
      try { homeTimeEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) {}
    }
    function setScreen(el, active) {
      if (!el) return;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
      try { el.inert = !active; } catch (e) {}
    }
    function setPhone(which) {
      var mode = which === "chat" ? "chat" : (which === "home" ? "home" : "search");
      setScreen(searchPhone, mode === "search");
      setScreen(chatPhone, mode === "chat");
      setScreen(homeScreen, mode === "home");
      if (homeChatApp) homeChatApp.tabIndex = mode === "home" ? 0 : -1;
      var activeTab = mode === "chat" ? "chat" : (mode === "search" ? "search" : null);
      modeBtns.forEach(function (b) {
        var on = b.getAttribute("data-phone") === activeTab;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    var logo = el.querySelector("#ia-logo");
    var searchBar = el.querySelector("#ia-search-bar");
    var searchText = el.querySelector("#ia-search-text");
    var card = el.querySelector("#ia-ai-card");
    var aiText = el.querySelector("#ia-ai-text");
    var thinking = el.querySelector("#ia-ai-thinking");
    var serp = el.querySelector("#ia-serp");
    var SATZ = DE ? "wie funktionieren llms?" : "how do llms work?";
    var CHAT_Q = DE ? "Wie funktionieren LLMs?" : "How do LLMs work?";
    var CHAT_A = DE ? "Ein LLM ist ein neuronales Netz, das aus sehr viel Text lernt, das jeweils nächste Token vorherzusagen. Es zerlegt deinen Text in Tokens, wandelt sie in Vektoren um, verarbeitet sie in vielen Schichten mit Attention und FFN und berechnet am Ende eine Verteilung über das nächste Token. Dieses Token wird an den Text gehängt, und der Prozess wiederholt sich. So entsteht die Antwort Schritt für Schritt. Das Modell versteht nicht wie ein Mensch; es nutzt Muster und Wahrscheinlichkeiten aus dem Trainingstext." : "An LLM is a neural network trained on a huge amount of text to predict the next token. It splits your text into tokens, turns them into vectors, processes them through many layers with attention and FFN, and produces a distribution over the next token. That token is appended to the text, and the process repeats. That is how the answer grows step by step. The model does not understand like a human; it uses patterns and probabilities from the training text.";
    var AI = DE ? [
      { t: "Ein LLM sagt das nächste Token voraus: Text wird in Tokens zerlegt, in Vektoren übersetzt, durch Attention und FFN geschickt, und am Ende entsteht eine Wahrscheinlichkeitsverteilung. " },
      { t: "Das nächste Token wird angehängt, dann beginnt die Schleife von vorn.", c: "b" }
    ] : [
      { t: "An LLM predicts the next token: text is split into tokens, turned into vectors, passed through attention and FFN, and a probability distribution comes out. " },
      { t: "The next token is appended, then the loop starts again.", c: "b" }
    ];
    var RESULTS = DE ? [
      { name: "Wikipedia", url: "de.wikipedia.org › Large language model", title: "Large language model", snippet: "Ein Sprachmodell, das das nächste Token aus dem bisherigen Text vorhersagt.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Wikipedia", url: "de.wikipedia.org › Transformer (Maschinelles Lernen)", title: "Transformer", snippet: "Die Architektur mit Self-Attention und FFN, auf der moderne LLMs aufbauen.", icon: "assets/favicon_wikipedia.ico" },
      { name: "arXiv", url: "arxiv.org › 1706.03762", title: "Attention Is All You Need", snippet: "Der Transformer: Attention, FFN, Residualverbindungen, Schichten.", icon: "assets/favicon_wikipedia.ico" }
    ] : [
      { name: "Wikipedia", url: "en.wikipedia.org › Large language model", title: "Large language model", snippet: "A language model that predicts the next token from the preceding text.", icon: "assets/favicon_wikipedia.ico" },
      { name: "Wikipedia", url: "en.wikipedia.org › Transformer (deep learning architecture)", title: "Transformer", snippet: "The architecture with self-attention and FFN behind modern LLMs.", icon: "assets/favicon_wikipedia.ico" },
      { name: "arXiv", url: "arxiv.org › 1706.03762", title: "Attention Is All You Need", snippet: "The transformer: attention, FFN, residual connections, layers.", icon: "assets/favicon_wikipedia.ico" }
    ];
    var timers = [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(function (id) { clearTimeout(id); clearInterval(id); }); timers = []; }
    function buildKeyboard() {
      if (!keysEl || keysEl.getAttribute("data-built")) return;
      var rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
      var html = "";
      rows.forEach(function (row, ri) {
        html += '<div class="ia-eoy-krow">';
        if (ri === 2) html += '<span class="ia-eoy-key ia-eoy-key--wide" data-k="shift">⇧</span>';
        row.split("").forEach(function (ch) {
          html += '<span class="ia-eoy-key" data-k="' + ch + '">' + ch + '</span>';
        });
        if (ri === 2) html += '<span class="ia-eoy-key ia-eoy-key--wide" data-k="back">⌫</span>';
        html += "</div>";
      });
      html += '<div class="ia-eoy-krow"><span class="ia-eoy-key ia-eoy-key--wide" data-k="sym">?123</span><span class="ia-eoy-key ia-eoy-key--space" data-k=" "></span><span class="ia-eoy-key ia-eoy-key--wide" data-k="enter">↵</span></div>';
      keysEl.innerHTML = html;
      keysEl.setAttribute("data-built", "1");
      keyEls = {};
      Array.prototype.forEach.call(keysEl.querySelectorAll("[data-k]"), function (key) {
        keyEls[key.getAttribute("data-k")] = key;
      });
      keyEls["?"] = keyEls.sym;
      keyEls["!"] = keyEls.sym;
      keyEls["."] = keyEls.sym;
    }
    function clearSwipe() {
      if (swipeRaf) { cancelAnimationFrame(swipeRaf); swipeRaf = 0; }
      if (swipeLayer) swipeLayer.innerHTML = "";
    }
    function clearPressed() {
      if (!keysEl) return;
      Array.prototype.forEach.call(keysEl.querySelectorAll(".is-pressed"), function (key) {
        key.classList.remove("is-pressed");
      });
    }
    function showKeyboard(on) {
      if (!searchPhone) return;
      searchPhone.classList.toggle("is-keyboard", !!on);
      if (!on) { clearSwipe(); clearPressed(); }
    }
    function pressKey(ch) {
      var key = keyEls[(ch || " ").toLowerCase()];
      if (!key) key = keyEls[" "];
      if (!key) return;
      key.classList.add("is-pressed");
      later(function () { key.classList.remove("is-pressed"); }, 90);
    }
    function keyCenter(ch) {
      var key = keyEls[(ch || " ").toLowerCase()];
      if (!key) return null;
      return { x: key.offsetLeft + key.offsetWidth / 2, y: key.offsetTop + key.offsetHeight / 2 };
    }
    function appendTyped(ch) {
      typedText += ch;
      searchText.innerHTML = api.esc(typedText) + '<span class="ia-caret"></span>';
    }
    function animateSwipe(points, duration) {
      if (!swipeLayer || !keyboardEl || points.length < 2) return;
      clearSwipe();
      var NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + keyboardEl.offsetWidth + " " + keyboardEl.offsetHeight);
      svg.setAttribute("preserveAspectRatio", "none");
      var poly = document.createElementNS(NS, "polyline");
      poly.setAttribute("points", points.map(function (p) { return p.x + "," + p.y; }).join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "rgba(63,127,176,.62)");
      poly.setAttribute("stroke-width", "6");
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "7");
      dot.setAttribute("fill", "#3f7fb0");
      dot.setAttribute("stroke", "#fff");
      dot.setAttribute("stroke-width", "2");
      svg.appendChild(poly);
      svg.appendChild(dot);
      swipeLayer.appendChild(svg);
      var len = poly.getTotalLength();
      poly.style.strokeDasharray = String(len);
      poly.style.strokeDashoffset = String(len);
      requestAnimationFrame(function () {
        poly.style.transition = "stroke-dashoffset " + duration + "ms linear";
        poly.style.strokeDashoffset = "0";
      });
      var start = performance.now();
      function tick(now) {
        var t = Math.min(1, (now - start) / duration);
        var pt = poly.getPointAtLength(len * t);
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        if (t < 1) swipeRaf = requestAnimationFrame(tick);
      }
      swipeRaf = requestAnimationFrame(tick);
      later(function () {
        svg.style.transition = "opacity .24s ease";
        svg.style.opacity = "0";
        later(function () { if (svg.parentNode) svg.remove(); }, 260);
      }, duration + 140);
    }
    function buildLogo() {
      var letters = (DE ? "Suchmaschine" : "Search Engine").split("");
      var palette = ["#1a73e8", "#e53935", "#f57c00", "#0f9d58", "#8e24aa", "#00acc1"];
      logo.removeAttribute("aria-hidden");
      logo.setAttribute("role", "img");
      logo.setAttribute("aria-label", DE ? "Suchmaschine" : "Search Engine");
      logo.innerHTML = letters.map(function (ch, i) {
        return '<span style="color:' + palette[i % palette.length] + '">' + (ch === " " ? "&nbsp;" : ch) + "</span>";
      }).join("");
    }
    function buildSerp() {
      serp.innerHTML = RESULTS.map(function (r, i) {
        return '<div class="ia-result r' + (i + 1) + '">' +
          '<div class="ia-res-head"><img class="ia-res-fav" src="' + (api.asset ? api.asset(r.icon) : r.icon) + '" alt=""><div class="ia-res-lines"><span class="ia-res-name">' + r.name + '</span><span class="ia-res-url">' + r.url + '</span></div></div>' +
          '<div class="ia-res-title">' + r.title + '</div><div class="ia-res-snippet">' + r.snippet + '</div></div>';
      }).join("");
    }
    function setCentered(on) { searchBar.classList.toggle("centered", !!on); }
    function resetChatVisuals() {
      if (chatPhone) chatPhone.classList.remove("is-thinking", "is-answered");
      if (chatScreen) chatScreen.classList.remove("is-answering", "is-composing", "is-sent");
      if (chatQuestionEl) chatQuestionEl.textContent = "";
      if (chatAnswerEl) chatAnswerEl.textContent = "";
      if (chatInputEl) chatInputEl.textContent = "";
      chatStarted = false;
    }
    var navHideTimer = null;
    function clearNavHideTimer() {
      if (navHideTimer == null) return;
      clearTimeout(navHideTimer);
      navHideTimer = null;
    }
    function showPhoneNav() {
      if (!phoneNavbar) return;
      clearNavHideTimer();
      phoneNavbar.hidden = false;
      void phoneNavbar.offsetWidth;
      phoneNavbar.classList.add("is-up");
    }
    function hidePhoneNav() {
      if (!phoneNavbar) return;
      clearNavHideTimer();
      phoneNavbar.hidden = true;
      phoneNavbar.classList.remove("is-up");
    }
    function dismissPhoneNav() {
      if (!phoneNavbar) return;
      clearNavHideTimer();
      phoneNavbar.classList.remove("is-up");
      navHideTimer = setTimeout(function () {
        navHideTimer = null;
        if (phoneNavbar) phoneNavbar.hidden = true;
      }, 340);
    }
    function reset() {
      clearTimers();
      typedText = "";
      showKeyboard(false);
      setCentered(true);
      searchText.textContent = "";
      searchText.classList.remove("typing");
      card.classList.remove("on");
      aiText.innerHTML = "";
      thinking.classList.remove("on");
      serp.classList.remove("on");
      resetChatVisuals();
      launchingChat = false;
      cleanupHomeLaunch();
      hidePhoneNav();
      setPhone(view);
    }
    function typeChat(el, text, speed, done) {
      if (reduce) { el.textContent = text; if (done) done(); return; }
      var i = 0;
      var timer = setInterval(function () {
        if (i < text.length) { i += 1; el.textContent = text.slice(0, i); }
        else { clearInterval(timer); if (done) done(); }
      }, speed);
      timers.push(timer);
    }
    function typeSearch(text, done) {
      if (reduce) { searchText.textContent = text; done(); return; }
      searchText.classList.add("typing");
      searchText.innerHTML = '<span class="ia-caret"></span>';
      var i = 0;
      var timer = setInterval(function () {
        if (i < text.length) {
          i += 1;
          searchText.innerHTML = text.slice(0, i) + '<span class="ia-caret"></span>';
        } else {
          clearInterval(timer);
          searchText.classList.remove("typing");
          searchText.textContent = text;
          later(done, 120);
        }
      }, 13);
      timers.push(timer);
    }
    function typeAnswer() {
      var spans = AI.map(function (seg) {
        var span = document.createElement("span");
        if (seg.c) span.className = "ia-" + seg.c;
        aiText.appendChild(span);
        return span;
      });
      if (reduce) { spans.forEach(function (span, i) { span.textContent = AI[i].t; }); return; }
      var si = 0, ci = 0;
      function tick() {
        var remaining = 8;
        while (remaining > 0 && si < spans.length) {
          var seg = AI[si];
          var take = Math.min(remaining, seg.t.length - ci);
          ci += take;
          remaining -= take;
          spans[si].textContent = seg.t.slice(0, ci);
          if (ci >= seg.t.length) { si += 1; ci = 0; }
        }
        if (si < spans.length) later(tick, 16);
      }
      tick();
    }
    function startChat() {
      if (chatStarted) return;
      chatStarted = true;
      hidePhoneNav();
      if (chatPhone) chatPhone.classList.remove("is-thinking", "is-answered");
      if (chatScreen) chatScreen.classList.remove("is-answering", "is-sent");
      if (chatQuestionEl) chatQuestionEl.textContent = "";
      if (chatAnswerEl) chatAnswerEl.textContent = "";
      if (chatInputEl) chatInputEl.textContent = "";
      if (chatScreen) chatScreen.classList.add("is-composing");
      if (reduce) {
        if (chatQuestionEl) chatQuestionEl.textContent = CHAT_Q;
        if (chatAnswerEl) chatAnswerEl.textContent = CHAT_A;
        if (chatPhone) chatPhone.classList.add("is-answered");
        if (chatScreen) chatScreen.classList.remove("is-composing");
        if (chatScreen) chatScreen.classList.add("is-sent", "is-answering");
        if (sequenceDone) later(function () { sequenceDone(); }, 900);
        return;
      }
      typeChat(chatInputEl, CHAT_Q, 24, function () {
        if (chatInputEl) chatInputEl.textContent = "";
        if (chatQuestionEl) chatQuestionEl.textContent = CHAT_Q;
        if (chatScreen) { chatScreen.classList.remove("is-composing"); chatScreen.classList.add("is-sent"); }
        later(function () {
          if (chatPhone) chatPhone.classList.add("is-thinking");
          later(function () {
            if (chatPhone) chatPhone.classList.remove("is-thinking");
            if (chatPhone) chatPhone.classList.add("is-answered");
            if (chatScreen) chatScreen.classList.add("is-answering");
            typeChat(chatAnswerEl, CHAT_A, 5, function () { if (sequenceDone) sequenceDone(); });
          }, 360);
        }, 260);
      });
    }
    function cleanupHomeLaunch() {
      if (homeChatApp) homeChatApp.classList.remove("is-target", "is-tapped", "is-opening");
    }
    function launchChat() {
      if (launchingChat) return;
      launchingChat = true;
      clearTimers();
      view = "chat";
      resetChatVisuals();
      cleanupHomeLaunch();
      var onSearch = !!(searchPhone && searchPhone.classList.contains("is-active"));
      if (reduce) {
        if (onSearch) showPhoneNav();
        setPhone("home");
        hidePhoneNav();
        setPhone("chat");
        startChat();
        launchingChat = false;
        return;
      }
      if (onSearch) showPhoneNav();
      var base = onSearch ? 480 : 0;
      later(function () {
        setPhone("home");
        showPhoneNav();
      }, base);
      later(function () {
        if (homeChatApp) homeChatApp.classList.add("is-target");
      }, base + 120);
      later(function () {
        if (homeChatApp) homeChatApp.classList.add("is-tapped");
      }, base + 600);
      later(function () {
        if (homeChatApp) {
          homeChatApp.classList.remove("is-tapped");
          homeChatApp.classList.add("is-opening");
        }
        dismissPhoneNav();
        setPhone("chat");
        later(startChat, 340);
      }, base + 900);
      later(function () {
        hidePhoneNav();
        cleanupHomeLaunch();
        launchingChat = false;
      }, base + 1500);
    }
    function play() {
      reset();
      buildLogo();
      buildSerp();
      if (view === "chat") { startChat(); return; }
      if (reduce) {
        searchText.textContent = SATZ;
        setCentered(false);
        card.classList.add("on");
        typeAnswer();
        serp.classList.add("on");
        if (view === "chat") startChat();
        if (view === "sequence") later(function () { setPhone("chat"); startChat(); }, 1200);
        return;
      }
      typeSearch(SATZ, function () {
        searchText.textContent = SATZ;
        setCentered(false);
        later(function () {
          card.classList.add("on");
          thinking.classList.add("on");
          later(function () {
            thinking.classList.remove("on");
            typeAnswer();
            serp.classList.add("on");
            if (view === "sequence") later(function () { setPhone("chat"); startChat(); }, 1500);
          }, 240);
        }, 320);
      });
    }
    function fit() {
      var r = stage.getBoundingClientRect();
      var scale = Math.min((r.width - 50) / 360, (r.height - 90) / 600);
      if (phonesWrap) phonesWrap.style.transform = "translate(-50%, -50%) scale(" + Math.max(0.24, scale).toFixed(3) + ")";
    }
    buildLogo();
    buildSerp();
    reset();
    var started = false, shownOnce = false;
    function startOnce() { if (started) return; started = true; play(); }
    if (reduce) startOnce();
    else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        requestAnimationFrame(function () { requestAnimationFrame(function () { later(startOnce, 180); }); });
      }, { threshold: 0.2 });
      io.observe(stage);
    } else startOnce();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(stage); }
    window.addEventListener("resize", fit);
    [searchPhone, chatPhone].forEach(function (p) {
      if (p) p.addEventListener("click", function () {
        started = true;
        if (advance) { advance(); return; }
        play();
      });
    });
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        started = true;
        var nextView = b.getAttribute("data-phone");
        if (nextView === "chat") { launchChat(); return; }
        view = nextView;
        play();
      });
    });
    if (homeChatApp) {
      homeChatApp.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        started = true;
        launchChat();
      });
    }
    fit();
    return {
      update: function (s) {
        if (s && s.view) {
          view = s.view;
          if (view === "sequence") {
            setPhone("search");
            if (started) play();
            return;
          }
          if (view === "chat") { launchChat(); return; }
          setPhone(view);
        }
      },
      start: function () { started = true; shownOnce = true; play(); },
      launchChat: launchChat,
      onSequenceDone: function (fn) { sequenceDone = fn; },
      onAdvance: function (fn) { advance = fn; },
      pause: function () {
        clearTimers();
        launchingChat = false;
        cleanupHomeLaunch();
        hidePhoneNav();
      },
      resume: function () { shownOnce = true; fit(); },
      resize: fit,
      destroy: function () {
        clearTimers();
        clearNavHideTimer();
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        el.remove();
      }
    };
  }

  core.register("phone", phoneScene);
})();
