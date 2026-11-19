(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function codeScene(root, api) {
    var DE = api.lang === "de";
    var program = DE ? "bewerte_text.py" : "score_text.py";
    var sample = DE ? "Ich mag LLM." : "The lecture was clear and useful.";
    var modelName = DE ? "oliverguhr/german-sentiment-bert" : "distilbert-base-uncased-finetuned-sst-2-english";
    var codeText = [
      "import sys",
      "from transformers import pipeline",
      "",
      'model = "' + modelName + '"',
      'classifier = pipeline("sentiment-analysis", model=model)',
      "",
      "text = sys.argv[1]",
      "for result in classifier(text, top_k=None):",
      "    print(f\"{result['label']}: {result['score']:.4f}\")"
    ];
    var scores = DE
      ? [["negative", "0.0021"], ["neutral", "0.0064"], ["positive", "0.9915"]]
      : [["NEGATIVE", "0.0007"], ["POSITIVE", "0.9993"]];
    var outLines = [(DE ? "Lade " : "Loading ") + modelName + " ..."].concat(scores.map(function (pair) {
      return pair[0] + ": " + pair[1];
    }));
    var commandText = "$ python3 " + program + ' "' + sample + '"';
    var agentText = DE ? "Ich lade ein kleines Transformer-Modell und bewerte einen Text." : "I'll load a small transformer model and score a text.";
    var userText = DE ? "Schreibe ein Python-Programm, das ein Transformer-Modell lädt und einen Text bewertet." : "Write a Python program that loads a transformer model and scores a text.";
    var el = document.createElement("div");
    el.className = "ls-code-monitor";
    el.innerHTML =
      '<div class="ls-code-frame"><div class="ls-code-screen">' +
        '<div class="ls-code-desktop" style="background-image:url(\'opera.jpg\')">' +
          '<div class="ls-code-window ls-code-window--agent">' +
            '<div class="ls-code-bar"><i></i><i></i><i></i><span>Agent</span></div>' +
            '<div class="ls-code-chat">' +
              '<div class="ls-code-msg is-user ls-code-user-msg" hidden><span class="ls-code-user-text"></span></div>' +
              '<div class="ls-code-msg is-agent" hidden><span class="ls-code-agent-text"></span><span class="ls-code-thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
              '<div class="ls-code-msg is-agent ls-code-run-msg" hidden>' + (DE ? "Ich führe " + program + " im Terminal aus." : "I'll run " + program + " in the terminal.") + '</div>' +
            '</div>' +
            '<div class="ls-code-filehead">' + program + '</div>' +
            '<pre class="ls-code-body"><code></code></pre>' +
            '<div class="ls-code-agent-prompt"><b>$</b><span></span></div>' +
          '</div>' +
          '<div class="ls-code-window ls-code-window--run" hidden>' +
            '<div class="ls-code-bar"><i></i><i></i><i></i><span>Terminal</span></div>' +
            '<div class="ls-code-term"><b class="ls-code-command"></b><span></span></div>' +
          '</div>' +
          '<div class="ls-code-startmenu" hidden><button type="button" data-start="agent">Agent</button><button type="button" data-start="run">Terminal</button><div class="ls-code-startjoke">' + (DE ? "Keine Updates verfügbar. Alles läuft lokal." : "No updates available. Everything runs locally.") + '</div></div>' +
          '<div class="ls-code-taskbar"><button type="button" class="ls-code-start" aria-label="Start">▦</button><button type="button" class="ls-code-task is-on" data-task="agent">Agent</button><button type="button" class="ls-code-task" data-task="run">Terminal</button><span class="ls-code-clock">14:32</span></div>' +
        '</div>' +
      '</div></div>' +
      '<button type="button" class="ls-btn ls-btn--tiny ls-code-replay" disabled>' + (DE ? "Weiter" : "Next") + '</button>';
    root.appendChild(el);
    var codeEl = el.querySelector(".ls-code-body code");
    var commandEl = el.querySelector(".ls-code-command");
    var term = el.querySelector(".ls-code-term span");
    var userPromptEl = el.querySelector(".ls-code-agent-prompt span");
    var userMsgEl = el.querySelector(".ls-code-user-msg");
    var userTextEl = el.querySelector(".ls-code-user-text");
    var promptRow = el.querySelector(".ls-code-agent-prompt");
    var agentMsgEl = el.querySelector(".ls-code-agent-text");
    var agentBubbleEl = agentMsgEl ? agentMsgEl.closest(".ls-code-msg") : null;
    var thinkingEl = el.querySelector(".ls-code-thinking");
    var agentWin = el.querySelector(".ls-code-window--agent");
    var runWin = el.querySelector(".ls-code-window--run");
    var runMsgEl = el.querySelector(".ls-code-run-msg");
    var replayBtn = el.querySelector(".ls-code-replay");
    var taskButtons = el.querySelectorAll("[data-task]");
    var startBtn = el.querySelector(".ls-code-start");
    var startMenu = el.querySelector(".ls-code-startmenu");
    var startItems = el.querySelectorAll("[data-start]");
    var clockEl = el.querySelector(".ls-code-clock");
    if (clockEl) {
      try { clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) {}
    }
    function syntaxClass(text, lineText) {
      var t = text.trim();
      if (!t) return "";
      if (lineText.trim().indexOf("#") === 0) return "is-comment";
      if (/^(def|return|import|from|as|for|in|if|else|elif|while|with|lambda)$/.test(t)) return "is-keyword";
      if (/^(print|round|len|range|sum|min|max)$/.test(t)) return "is-builtin";
      if (/^-?\d/.test(t) || /e[+-]?\d+$/i.test(t)) return "is-number";
      if (/^[A-Za-z_]\w*\(/.test(t)) return "is-function";
      if (/^[=+\-*/%<>!]+$/.test(t) || /^[()\[\]{},.:;]+$/.test(t)) return "is-op";
      return "";
    }
    var tokens = [];
    codeText.forEach(function (line, li) {
      line.split(/(\s+)/).forEach(function (part) {
        if (part) tokens.push({ text: part, line: li, lineText: line });
      });
      tokens.push({ text: "\n", line: li, lineText: line });
    });
    var spans = tokens.map(function (t) {
      var span = document.createElement("span");
      var cls = syntaxClass(t.text, t.lineText);
      span.className = "ls-code-token" + (cls ? " " + cls : "");
      span.textContent = t.text;
      codeEl.appendChild(span);
      return span;
    });
    var timers = [], phase = "idle";
    var codePre = el.querySelector(".ls-code-body");
    function fitCode() {
      if (!codePre || !agentWin || !agentWin.classList.contains("is-coding")) return;
      var sizes = [14, 12, 11, 10, 9, 8, 7, 6];
      for (var i = 0; i < sizes.length; i++) {
        codePre.style.fontSize = sizes[i] + "px";
        codePre.style.lineHeight = "1.35";
        if (codePre.scrollHeight <= codePre.clientHeight + 1 && codePre.scrollWidth <= codePre.clientWidth + 1) break;
      }
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function show(win, on) {
      if (!win) return;
      win.hidden = !on;
      if (on) {
        win.classList.remove("is-open");
        void win.offsetWidth;
        win.classList.add("is-open");
      }
    }
    function setButton(label, disabled) {
      replayBtn.textContent = label;
      replayBtn.disabled = !!disabled;
    }
    function typeUser(done) {
      if (!userPromptEl) { if (done) done(); return; }
      var i = 0;
      var stepMs = Math.max(12, 2000 / Math.max(1, userText.length));
      function step() {
        if (i >= userText.length) {
          if (userTextEl) userTextEl.textContent = userText;
          if (userMsgEl) userMsgEl.hidden = false;
          userPromptEl.textContent = "";
          if (promptRow) promptRow.classList.add("is-sent");
          if (done) done();
          return;
        }
        i++;
        userPromptEl.textContent = userText.slice(0, i);
        later(step, stepMs);
      }
      step();
    }
    function typeAgent(done) {
      if (!agentMsgEl) { if (done) done(); return; }
      if (agentBubbleEl) agentBubbleEl.hidden = false;
      var i = 0;
      function step() {
        if (i >= agentText.length) { if (done) done(); return; }
        i++;
        agentMsgEl.textContent = agentText.slice(0, i);
        later(step, 16);
      }
      step();
    }
    function typeCode() {
      if (agentWin) agentWin.classList.add("is-coding");
      fitCode();
      var i = 0;
      function typeNext() {
        if (i >= spans.length) {
          phase = "ready";
          fitCode();
          setButton(DE ? "Weiter" : "Next", false);
          later(function () { if (phase === "ready") runProgram(); }, 300);
          return;
        }
        spans[i].classList.add("is-visible");
        var delay = /^\s+$/.test(tokens[i].text) ? 0 : 24;
        i++;
        later(typeNext, delay);
      }
      later(typeNext, 180);
    }
    function reset() {
      clearTimers();
      phase = "typing";
      spans.forEach(function (s) { s.classList.remove("is-visible"); });
      if (userPromptEl) userPromptEl.textContent = "";
      if (userMsgEl) userMsgEl.hidden = true;
      if (userTextEl) userTextEl.textContent = "";
      if (promptRow) promptRow.classList.remove("is-sent");
      if (agentMsgEl) agentMsgEl.textContent = "";
      if (agentBubbleEl) agentBubbleEl.hidden = true;
      if (agentWin) agentWin.classList.remove("is-coding");
      if (thinkingEl) thinkingEl.classList.remove("on");
      if (runMsgEl) runMsgEl.hidden = true;
      if (commandEl) commandEl.textContent = "";
      if (term) term.textContent = "";
      show(agentWin, true);
      show(runWin, false);
      syncTasks();
      setButton(DE ? "Weiter" : "Next", true);
      fitCode();
      later(function () {
        typeUser(function () {
          phase = "thinking";
          if (agentBubbleEl) agentBubbleEl.hidden = false;
          if (thinkingEl) thinkingEl.classList.add("on");
          later(function () {
            if (thinkingEl) thinkingEl.classList.remove("on");
            typeAgent(function () {
              typeCode();
            });
          }, 750);
        });
      }, 250);
    }
    function runProgram() {
      phase = "running";
      if (runMsgEl) runMsgEl.hidden = false;
      show(runWin, true);
      syncTasks();
      if (commandEl) commandEl.textContent = "";
      if (term) term.textContent = "";
      var stepMs = 300 / Math.max(1, commandText.length);
      var j = 0;
      function showOutput(index) {
        if (!term) return;
        term.textContent = outLines.slice(0, index + 1).join("\n");
        if (index + 1 < outLines.length) {
          later(function () { showOutput(index + 1); }, 260);
        } else {
          later(function () {
            phase = "done";
            setButton(DE ? "Nochmal" : "Replay", false);
          }, 480);
        }
      }
      function typeCommand() {
        if (j >= commandText.length) {
          later(function () { showOutput(0); }, 260);
          return;
        }
        j++;
        if (commandEl) commandEl.textContent = commandText.slice(0, j);
        later(typeCommand, stepMs * (0.7 + Math.random() * 0.6));
      }
      typeCommand();
    }
    function syncTasks() {
      taskButtons.forEach(function (b) {
        var win = b.getAttribute("data-task") === "agent" ? agentWin : runWin;
        b.classList.toggle("is-on", win && !win.hidden);
      });
    }
    taskButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        var win = b.getAttribute("data-task") === "agent" ? agentWin : runWin;
        show(win, true);
        syncTasks();
      });
    });
    if (startBtn && startMenu) {
      startBtn.addEventListener("click", function () { startMenu.hidden = !startMenu.hidden; startBtn.classList.toggle("is-open", !startMenu.hidden); });
    }
    startItems.forEach(function (b) {
      b.addEventListener("click", function () {
        var win = b.getAttribute("data-start") === "agent" ? agentWin : runWin;
        show(win, true); syncTasks();
        if (startMenu) startMenu.hidden = true;
        if (startBtn) startBtn.classList.remove("is-open");
      });
    });

    replayBtn.addEventListener("click", function () {
      if (phase === "ready") runProgram();
      else if (phase === "done") reset();
    });
    reset();
    function busy() { return phase === "typing" || phase === "thinking" || phase === "running" || phase === "ready"; }
    function showRunComplete() {
      if (runMsgEl) runMsgEl.hidden = false;
      show(runWin, true);
      syncTasks();
      if (commandEl) commandEl.textContent = commandText;
      if (term) term.textContent = outLines.join("\n");
      phase = "done";
      setButton(DE ? "Nochmal" : "Replay", false);
      fitCode();
    }
    function finish() {
      if (phase === "done") return;
      clearTimers();
      if (userTextEl) userTextEl.textContent = userText;
      if (userMsgEl) userMsgEl.hidden = false;
      if (userPromptEl) userPromptEl.textContent = "";
      if (promptRow) promptRow.classList.add("is-sent");
      if (agentBubbleEl) agentBubbleEl.hidden = false;
      if (agentMsgEl) agentMsgEl.textContent = agentText;
      if (thinkingEl) thinkingEl.classList.remove("on");
      if (agentWin) agentWin.classList.add("is-coding");
      spans.forEach(function (sp) { sp.classList.add("is-visible"); });
      showRunComplete();
    }
    return {
      update: function () {},
      start: function () { reset(); },
      busy: busy,
      finish: finish,
      pause: function () {
        clearTimers();
        if (phase !== "ready" && phase !== "done") phase = "paused";
      },
      resume: function () { if (phase === "idle" || phase === "paused") reset(); },
      resize: function () { fitCode(); },
      destroy: function () { clearTimers(); el.remove(); }
    };
  }

  core.register("code", codeScene);
})();
