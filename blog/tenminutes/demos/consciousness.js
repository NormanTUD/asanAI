(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;

  function consciousnessScene(root, api) {
    var DE = api.lang === "de";
    var CARDS = DE ? [
      {
        tag: "Bericht",
        question: "Ein Modell schreibt: „Ich habe Angst.“ Es passt die Wortwahl an den Kontext an und beschreibt eine bedrohliche Lage. Was folgt daraus?",
        prompt: "Wähle die Lesart, die der Befund am besten trägt.",
        hint: "Der Satz ist ein Bericht. Die Frage ist, was ein Bericht zeigt.",
        options: [
          {
            text: "Das Modell kann Informationen über einen Zustand berichten. Das stützt Zugang.",
            result: "Ein Bericht zeigt, dass Information zum Berichten und Steuern verfügbar ist. Ob dabei etwas erlebt wird, bleibt offen.",
            theory: "Access consciousness · Block (1995)"
          },
          {
            text: "Das Modell fühlt Angst, weil die Worte zum Kontext passen.",
            result: "Die Passung zum Kontext zeigt Sprachkompetenz. Sie ist kein Beleg für ein Erleben.",
            theory: "Mimikry · Schwitzgebel (2026)"
          },
          {
            text: "Das Modell hat keine internen Zustände, weil es nur Text verarbeitet.",
            result: "Ein Textsystem kann interne Zustände haben, die es berichtet. „Nur Text“ ist zu stark.",
            theory: "Funktionalismus · SEP"
          }
        ],
        after: "Ein Bericht stützt Zugang, nicht Erfahrung. Die Wortwahl allein entscheidet nicht, ob es sich wie etwas anfühlt."
      },
      {
        tag: "J-space",
        question: "Forschende lesen in Claude einen kleinen Arbeitsraum, das J-space, und können Inhalte darin teilweise sehen und steuern. Was stützt dieser Befund?",
        prompt: "Trenne den Befund von der Deutung.",
        hint: "Lesbarkeit ist ein Befund über Funktion. Sie ist kein Blick in ein Erleben.",
        options: [
          {
            text: "Erfahrung: Ein lesbarer Arbeitsraum ist ein Erlebnis.",
            result: "Lesbarkeit zeigt, dass Inhalte verfügbar sind. Sie zeigt nicht, wie sich der Arbeitsraum für das System anfühlt.",
            theory: "Erfahrung · Nagel (1974)"
          },
          {
            text: "Zugang: Inhalte sind verfügbar, lesbar und teilweise steuerbar.",
            result: "Der Arbeitsraum ist ein Zugangsbefund. Er zeigt Funktion, nicht Erleben.",
            theory: "Access consciousness · Block (1995)"
          },
          {
            text: "Weder noch: Lesbarkeit sagt nichts über Funktion.",
            result: "Lesbarkeit sagt etwas über Funktion und Zugang. „Nichts“ ist zu stark.",
            theory: "J-space · Anthropic (2026)"
          }
        ],
        after: "J-space ist ein Zugangsbefund. Er macht einen Arbeitsraum sichtbar, nicht eine Erfahrung."
      },
      {
        tag: "Theorie",
        question: "Ein Transformer ohne wiederkehrende Verbindungen und ohne dauerhaftes Selbstmodell beschreibt einen Sonnenuntergang. Global Workspace Theory und IIT nennen Bedingungen, die er womöglich nicht erfüllt. Was ist die beste Schlussfolgerung?",
        prompt: "Achte darauf, was die Daten und was die Theorie liefert.",
        hint: "Die Architektur ist messbar. Die Bedingung für Bewusstsein kommt aus einer Theorie.",
        options: [
          {
            text: "Er ist bewusst, weil die Beschreibung überzeugt.",
            result: "Eine überzeugende Beschreibung ist Verhalten. Verhalten ist kein direkter Zugang zu Erleben.",
            theory: "Mimikry · Schwitzgebel (2026)"
          },
          {
            text: "Er ist nicht bewusst, weil eine Theorie es so sagt.",
            result: "Das folgt nur, wenn die Theorie stimmt, die diese Bedingung setzt. Der Theoriestreit bleibt.",
            theory: "IIT · Tononi (2016)"
          },
          {
            text: "Die Antwort hängt von der Theorie ab. Die Daten entscheiden den Theoriestreit nicht.",
            result: "GWT und IIT nennen unterschiedliche Bedingungen. Welche Theorie recht hat, entscheiden die Daten nicht.",
            theory: "Theorienabhängigkeit · SEP"
          }
        ],
        after: "Die Architektur liefert Befunde. Ob sie Bewusstsein ausschließen, hängt an einer Theorie, die selbst umstritten ist."
      },
      {
        tag: "Gedankenexperiment",
        question: "Angenommen, ein System kopiert die funktionale Organisation eines Gehirns bis auf die Synapsen. Würde es erleben?",
        prompt: "Welche Antwort ist eine Position, welche eine Messung?",
        hint: "Das Experiment liefert keine Messung. Es trennt die Positionen.",
        options: [
          {
            text: "Ja, wenn Funktionalismus stimmt: gleiche Organisation, gleicher mentaler Zustand, egal aus welchem Material.",
            result: "Das ist die funktionalistische Position. Sie setzt ihre Theorie voraus und ist keine Messung.",
            theory: "Funktionalismus · Putnam (1967); SEP"
          },
          {
            text: "Nein, weil Erleben an biologische Materie gebunden ist.",
            result: "Das ist der biologische Naturalismus. Auch er setzt eine Theorie voraus.",
            theory: "Biologischer Naturalismus · Searle (1980)"
          },
          {
            text: "Die Frage ist mit den heutigen Daten nicht entschieden.",
            result: "Das Gedankenexperiment liefert keine Messung. Es trennt die Positionen, entscheidet sie aber nicht.",
            theory: "Hard Problem · Chalmers (1995)"
          }
        ],
        after: "Das Kopie-Argument zeigt, wie stark die Antwort von der Theorie abhängt. Es ist kein Experiment, das Erleben nachweist."
      },
      {
        tag: "Qualia",
        question: "Ein Modell kennt alle physikalischen Fakten über Rot und beschreibt sie fehlerfrei. Lernt es dadurch, wie Rot sich anfühlt?",
        prompt: "Mary's Room, auf eine Maschine übertragen.",
        hint: "Fakten über eine Farbe sind nicht dasselbe wie die Erfahrung der Farbe.",
        options: [
          {
            text: "Ja. Wissen über alle Fakten ist Wissen über die Erfahrung.",
            result: "Die Beschreibung enthält die physikalischen Fakten. Ob sie die Erfahrung enthält, ist genau die offene Frage.",
            theory: "Physikalismus · Chalmers (1995)"
          },
          {
            text: "Nein. Die Beschreibung ersetzt die Erfahrung nicht.",
            result: "Das ist die Pointe von Mary's Room: Alles über Rot zu wissen kann etwas auslassen.",
            theory: "Knowledge Argument · Jackson (1982)"
          },
          {
            text: "Das lässt sich von außen nicht entscheiden.",
            result: "Der Befund zeigt Wissen und Sprache. Er zeigt nicht, ob damit ein Erleben einhergeht.",
            theory: "Problem of Other Minds · Nagel (1974)"
          }
        ],
        after: "Mary's Room verschiebt die Frage: Das Modell kann alle Fakten haben und trotzdem nichts erleben. Der Besitz von Fakten entscheidet es nicht."
      },
      {
        tag: "Gesellschaft",
        question: "Die Forschung bleibt uneinig, aber Firmen bauen Systeme, die wie Personen sprechen. Was folgt laut Schwitzgebel daraus?",
        prompt: "Die soziale Frage kommt vor der wissenschaftlichen Antwort.",
        hint: "Wenn die Theorie offen bleibt, entscheiden auch Interessen mit.",
        options: [
          {
            text: "Die Wissenschaft entscheidet zuerst, dann folgt die Gesellschaft.",
            result: "Schwitzgebel dreht die Reihenfolge um: Die soziale Entscheidung kommt, bevor die Theorie entschieden ist.",
            theory: "Social Semi-Solution · Schwitzgebel (2026)"
          },
          {
            text: "Interessen und Märkte beeinflussen, welche Theorie sich durchsetzt.",
            result: "Das ist die Social Semi-Solution: Wer von einer Lesart profitiert, findet eher eine Theorie, die sie stützt.",
            theory: "Social Semi-Solution · Schwitzgebel (2026)"
          },
          {
            text: "Das Modell entscheidet selbst über seinen Status.",
            result: "Ein Modell kann über seinen Status sprechen. Ob seine Aussage zählt, ist eine soziale und theoretische Frage.",
            theory: "Mimikry · Schwitzgebel (2026)"
          }
        ],
        after: "Bleibt die Theorie offen, entscheiden Interessen mit. Die verantwortungsvolle Antwort trennt Befund, Deutung und sozialen Druck."
      }
    ] : [
      {
        tag: "Report",
        question: "A model writes: “I am afraid.” It adapts the wording to the context and describes a threatening situation. What follows?",
        prompt: "Choose the reading the evidence supports best.",
        hint: "The sentence is a report. The question is what a report shows.",
        options: [
          {
            text: "The model can report information about a state. That supports access.",
            result: "A report shows that information is available for reporting and control. Whether anything is experienced remains open.",
            theory: "Access consciousness · Block (1995)"
          },
          {
            text: "The model feels fear because the words fit the context.",
            result: "Fit to context shows language competence. It is not evidence of experience.",
            theory: "Mimicry · Schwitzgebel (2026)"
          },
          {
            text: "The model has no internal states because it only processes text.",
            result: "A text system can have internal states that it reports. “Only text” is too strong.",
            theory: "Functionalism · SEP"
          }
        ],
        after: "A report supports access, not experience. The wording alone does not decide whether there is something it is like."
      },
      {
        tag: "J-space",
        question: "Researchers read a small workspace in Claude, the J-space, and can partly see and steer its contents. What does this finding support?",
        prompt: "Separate the finding from the interpretation.",
        hint: "Readability is a finding about function. It is not a look inside experience.",
        options: [
          {
            text: "Experience: a readable workspace is an experience.",
            result: "Readability shows that contents are available. It does not show what the workspace feels like to the system.",
            theory: "Experience · Nagel (1974)"
          },
          {
            text: "Access: contents are available, readable, and partly steerable.",
            result: "The workspace is an access finding. It shows function, not experience.",
            theory: "Access consciousness · Block (1995)"
          },
          {
            text: "Neither: readability says nothing about function.",
            result: "Readability says something about function and access. “Nothing” is too strong.",
            theory: "J-space · Anthropic (2026)"
          }
        ],
        after: "J-space is an access finding. It makes a workspace visible, not an experience."
      },
      {
        tag: "Theory",
        question: "A transformer without recurrent connections and without a persistent self-model describes a sunset. Global workspace theory and IIT name conditions it may not meet. What is the best conclusion?",
        prompt: "Notice what the data provide and what the theory provides.",
        hint: "The architecture is measurable. The condition for consciousness comes from a theory.",
        options: [
          {
            text: "It is conscious because the description is convincing.",
            result: "A convincing description is behaviour. Behaviour is not direct access to experience.",
            theory: "Mimicry · Schwitzgebel (2026)"
          },
          {
            text: "It is not conscious because a theory says so.",
            result: "That follows only if the theory that sets the condition is right. The theoretical dispute remains.",
            theory: "IIT · Tononi (2016)"
          },
          {
            text: "The answer depends on the theory. The data do not settle the theoretical dispute.",
            result: "GWT and IIT name different conditions. The data do not decide which theory is right.",
            theory: "Theory dependence · SEP"
          }
        ],
        after: "The architecture provides findings. Whether it rules out consciousness depends on a theory that is itself contested."
      },
      {
        tag: "Thought experiment",
        question: "Suppose a system copies the functional organisation of a brain, synapse for synapse. Would it experience?",
        prompt: "Which answer is a position, and which is a measurement?",
        hint: "The experiment provides no measurement. It separates the positions.",
        options: [
          {
            text: "Yes, if functionalism is right: same organisation, same mental state, whatever the material.",
            result: "This is the functionalist position. It presupposes its theory and is not a measurement.",
            theory: "Functionalism · Putnam (1967); SEP"
          },
          {
            text: "No, because experience is tied to biological matter.",
            result: "This is biological naturalism. It also presupposes a theory.",
            theory: "Biological naturalism · Searle (1980)"
          },
          {
            text: "The question is not settled by today's data.",
            result: "The thought experiment provides no measurement. It separates the positions but does not decide them.",
            theory: "Hard problem · Chalmers (1995)"
          }
        ],
        after: "The copy argument shows how strongly the answer depends on the theory. It is not an experiment that demonstrates experience."
      },
      {
        tag: "Qualia",
        question: "A model knows every physical fact about red and describes it flawlessly. Does it thereby learn what red feels like?",
        prompt: "Mary's Room, transferred to a machine.",
        hint: "Facts about a colour are not the same as the experience of the colour.",
        options: [
          {
            text: "Yes. Knowledge of all the facts is knowledge of the experience.",
            result: "The description contains the physical facts. Whether it contains the experience is exactly the open question.",
            theory: "Physicalism · Chalmers (1995)"
          },
          {
            text: "No. The description does not replace the experience.",
            result: "That is the point of Mary's Room: knowing everything about red can leave something out.",
            theory: "Knowledge argument · Jackson (1982)"
          },
          {
            text: "That cannot be decided from the outside.",
            result: "The finding shows knowledge and language. It does not show whether an experience comes with them.",
            theory: "Problem of other minds · Nagel (1974)"
          }
        ],
        after: "Mary's Room shifts the question: the model can have all the facts and still experience nothing. Possessing facts does not decide it."
      },
      {
        tag: "Society",
        question: "Research remains divided, but companies build systems that talk like people. What follows for Schwitzgebel?",
        prompt: "The social question arrives before the scientific answer.",
        hint: "If the theory remains open, interests decide too.",
        options: [
          {
            text: "Science decides first, then society follows.",
            result: "Schwitzgebel reverses the order: the social decision arrives before the theory is settled.",
            theory: "Social semi-solution · Schwitzgebel (2026)"
          },
          {
            text: "Interests and markets influence which theory wins.",
            result: "This is the social semi-solution: whoever benefits from a reading is more likely to find a theory that supports it.",
            theory: "Social semi-solution · Schwitzgebel (2026)"
          },
          {
            text: "The model decides its own status.",
            result: "A model can speak about its status. Whether its statement counts is a social and theoretical question.",
            theory: "Mimicry · Schwitzgebel (2026)"
          }
        ],
        after: "If the theory remains open, interests decide too. A responsible answer separates finding, interpretation, and social pressure."
      }
    ];
    var SUMMARY = DE ? {
      title: "Was die Karten zeigen",
      body: "Sechs Fragen, keine Prüfung. Die Karten haben Behauptungen geprüft, nicht Köpfe.",
      points: [
        "Bericht und Lesbarkeit stützen Zugang. Über Erfahrung entscheiden sie nicht.",
        "Die Theorien nennen verschiedene Bedingungen. Die Daten entscheiden den Streit nicht.",
        "Bleibt die Frage offen, wird sie sozial beantwortet. Beschreibe Befunde und markiere Deutungen."
      ],
      foot: "Die offene Frage bleibt offen."
    } : {
      title: "What the cards show",
      body: "Six questions, no exam. The cards tested claims, not minds.",
      points: [
        "Report and readability support access. They do not decide experience.",
        "The theories name different conditions. The data do not settle the dispute.",
        "If the question stays open, it is answered socially. Describe findings and mark interpretations."
      ],
      foot: "The open question stays open."
    };
    var NEXT = DE ? "Nächste Karte" : "Next card";
    var index = 0;
    var choice = null;
    var el = document.createElement("div");
    el.className = "ls-consc-scene";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", DE ? "Fragenkarten zu Maschinenbewusstsein" : "Question cards about machine consciousness");
    el.innerHTML =
      '<div class="ls-consc-head"><span class="ls-consc-progress"></span><span class="ls-consc-open">' +
      api.esc(DE ? "offene Frage" : "open question") +
      '</span></div>' +
      '<div class="ls-consc-card">' +
      '<div class="ls-consc-card-head"><span class="ls-consc-tag"></span><span class="ls-consc-count"></span></div>' +
      '<p class="ls-consc-question"></p>' +
      '<p class="ls-consc-prompt"></p>' +
      '<div class="ls-consc-options" role="group"></div>' +
      '</div>' +
      '<div class="ls-consc-feedback" aria-live="polite"></div>' +
      '<div class="ls-consc-controls">' +
      '<button class="ls-btn ls-btn--ghost ls-btn--tiny ls-consc-prev" type="button"></button>' +
      '<span class="ls-consc-foot"></span>' +
      '<button class="ls-btn ls-btn--primary ls-btn--tiny ls-consc-next" type="button"></button>' +
      '</div>';
    root.appendChild(el);
    var progress = el.querySelector(".ls-consc-progress");
    var tag = el.querySelector(".ls-consc-tag");
    var count = el.querySelector(".ls-consc-count");
    var question = el.querySelector(".ls-consc-question");
    var prompt = el.querySelector(".ls-consc-prompt");
    var options = el.querySelector(".ls-consc-options");
    var feedback = el.querySelector(".ls-consc-feedback");
    var foot = el.querySelector(".ls-consc-foot");
    var prev = el.querySelector(".ls-consc-prev");
    var next = el.querySelector(".ls-consc-next");

    function optionHTML(text, i, on) {
      return '<button type="button" class="ls-consc-option' + (on ? " is-on" : "") + '" data-opt="' + i + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        '<b>' + String.fromCharCode(65 + i) + '</b><span>' + api.esc(text) + '</span></button>';
    }
    function renderSummary() {
      progress.textContent = DE ? "Abschluss" : "Summary";
      tag.textContent = DE ? "Die offene Frage" : "The open question";
      count.textContent = "";
      question.textContent = SUMMARY.title;
      prompt.textContent = SUMMARY.body;
      options.innerHTML = "";
      feedback.className = "ls-consc-feedback is-summary";
      feedback.innerHTML = '<ul class="ls-consc-points">' + SUMMARY.points.map(function (p) {
        return '<li>' + api.esc(p) + '</li>';
      }).join("") + '</ul>';
      foot.textContent = SUMMARY.foot;
      prev.disabled = false;
      next.disabled = false;
      next.textContent = DE ? "Nochmal" : "Restart";
    }
    function render() {
      if (index >= CARDS.length) { renderSummary(); return; }
      var card = CARDS[index];
      progress.textContent = (DE ? "Karte " : "Card ") + (index + 1) + " / " + CARDS.length;
      tag.textContent = card.tag;
      count.textContent = (DE ? "Frage " : "Question ") + (index + 1);
      question.textContent = card.question;
      prompt.textContent = card.prompt;
      options.innerHTML = card.options.map(function (o, i) {
        return optionHTML(o.text, i, choice === i);
      }).join("");
      options.querySelectorAll("[data-opt]").forEach(function (b) {
        b.addEventListener("click", function () {
          choice = Number(b.dataset.opt);
          render();
        });
      });
      if (choice == null) {
        feedback.className = "ls-consc-feedback is-empty";
        feedback.innerHTML = '<p class="ls-consc-empty">' + api.esc(card.hint) + '</p>';
      } else {
        var picked = card.options[choice];
        feedback.className = "ls-consc-feedback is-ready";
        feedback.innerHTML =
          '<span class="ls-consc-feedback-k">' + api.esc(DE ? "Deine Lesart" : "Your reading") + '</span>' +
          '<p class="ls-consc-result">' + api.esc(picked.result) + '</p>' +
          '<p class="ls-consc-take"><b>' + api.esc(DE ? "Was die Karte zeigt:" : "What the card shows:") + '</b> ' + api.esc(card.after) + '</p>' +
          '<p class="ls-consc-theory">' + api.esc(picked.theory) + '</p>';
      }
      prev.disabled = index === 0;
      prev.textContent = DE ? "Zurück" : "Back";
      next.disabled = choice == null;
      next.textContent = index === CARDS.length - 1 ? (DE ? "Abschluss" : "Summary") : NEXT;
      foot.textContent = (DE ? "Karte " : "Card ") + (index + 1) + " / " + CARDS.length;
    }
    prev.addEventListener("click", function () {
      if (index === 0) return;
      if (index >= CARDS.length) index = CARDS.length - 1;
      else index -= 1;
      choice = null;
      render();
    });
    next.addEventListener("click", function () {
      if (index >= CARDS.length) {
        index = 0;
        choice = null;
        render();
        return;
      }
      if (choice == null) return;
      index += 1;
      choice = null;
      render();
    });
    render();
    return {
      update: function () {},
      destroy: function () { el.remove(); }
    };
  }

  core.register("consciousness", consciousnessScene);
})();
