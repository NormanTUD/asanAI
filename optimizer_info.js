"use strict";

// ============================================================
// OPTIMIZER INFO POPUP — IIFE
// Interactive 3D visualization of how each optimizer navigates
// a loss landscape. Uses Plotly surface + scatter3d.
// Architecture inspired by trace_through_loss_landscape.js.
// Math rendered with temml. Bilingual (de/en) via global `lang`.
// ============================================================

(function () {

  var _POPUP_ID = "optimizer_info_popup_overlay";
  var _PLOT_ID = "optimizer_info_3d_plot";

  var _state = {
    animationId: null,
    animationFrame: 0,
    path: null,
    plotlyReady: false,
    lastCamera: null,
    userInteracting: false,
    interactionTimeout: null,
    pendingRender: false,
    currentOptimizer: null
  };

  // ─── HELPER: get language ─────────────────────────────────────────────────
  function L() {
    return (typeof lang !== "undefined" && lang === "de") ? "de" : "en";
  }

  // ─── HELPER: render math with temml ───────────────────────────────────────
  function renderMath(latex) {
    if (typeof temml !== "undefined") {
      try {
        return temml.renderToString(latex, { displayMode: false });
      } catch (e) {
        return "<code>" + latex + "</code>";
      }
    }
    return "<code>" + latex + "</code>";
  }

  function renderMathBlock(latex) {
    if (typeof temml !== "undefined") {
      try {
        return temml.renderToString(latex, { displayMode: true });
      } catch (e) {
        return "<pre>" + latex + "</pre>";
      }
    }
    return "<pre>" + latex + "</pre>";
  }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────
  var i18n = {
    en: {
      title: "How does «{name}» work?",
      analogyTitle: "🎯 Intuition",
      techTitle: "⚙️ The Math",
      paramTitle: "📐 Parameters",
      whenTitle: "✅ When to use / ❌ When not",
      playgroundTitle: "🎮 3D Loss Landscape — Interactive Demo",
      playDesc: "The surface shows the loss (error) for different parameter values. In reality, neural networks have millions of parameters — here we show just 2 (x and y) so you can visualize it. The optimizer tries to find the lowest point (minimum). The white path shows its journey.",
      playDescDim: "⚠️ Real neural networks have thousands to billions of parameters. This 2D surface is a simplified slice — but the optimizer behavior (momentum, adaptive rates, etc.) works the same way in high dimensions.",
      startLabel: "Start X:",
      startLabel2: "Start Y:",
      stepsLabel: "Steps:",
      runLabel: "▶ Run",
      resetCamLabel: "🎥 Reset Camera",
      surfaceLabel: "Loss Surface",
      stepLabel: "Step",
      lossLabel: "Loss",
      doneLabel: "✓ Converged!",
      waitLabel: "Press Run to start",
      demoParamsTitle: "🎛️ Demo Parameters (change these to see the effect!)",
      validationError: "⚠️ Invalid value for \"{param}\": must be a number between {min} and {max}.",
      lossFnLabel: "Loss function for this demo:",
      xIsParam: "x, y = model parameters (weights)",
      goalExplain: "Goal: find (x,y) where loss is minimal (the dark blue valley at 0,0)"
    },
    de: {
      title: "Wie funktioniert «{name}»?",
      analogyTitle: "🎯 Intuition",
      techTitle: "⚙️ Die Mathematik",
      paramTitle: "📐 Parameter",
      whenTitle: "✅ Wann verwenden / ❌ Wann nicht",
      playgroundTitle: "🎮 3D-Verlustlandschaft — Interaktive Demo",
      playDesc: "Die Oberfläche zeigt den Verlust (Fehler) für verschiedene Parameterwerte. In Wirklichkeit haben neuronale Netze Millionen von Parametern — hier zeigen wir nur 2 (x und y) zur Visualisierung. Der Optimierer versucht den tiefsten Punkt (Minimum) zu finden. Der weiße Pfad zeigt seinen Weg.",
      playDescDim: "⚠️ Echte neuronale Netze haben Tausende bis Milliarden Parameter. Diese 2D-Oberfläche ist ein vereinfachter Schnitt — aber das Verhalten des Optimierers (Impuls, adaptive Raten, etc.) funktioniert in hohen Dimensionen genauso.",
      startLabel: "Start X:",
      startLabel2: "Start Y:",
      stepsLabel: "Schritte:",
      runLabel: "▶ Start",
      resetCamLabel: "🎥 Kamera zurücksetzen",
      surfaceLabel: "Verlustfläche",
      stepLabel: "Schritt",
      lossLabel: "Verlust",
      doneLabel: "✓ Konvergiert!",
      waitLabel: "Drücke Start zum Beginnen",
      demoParamsTitle: "🎛️ Demo-Parameter (ändere diese um den Effekt zu sehen!)",
      validationError: "⚠️ Ungültiger Wert für \"{param}\": muss eine Zahl zwischen {min} und {max} sein.",
      lossFnLabel: "Verlustfunktion für diese Demo:",
      xIsParam: "x, y = Modellparameter (Gewichte)",
      goalExplain: "Ziel: finde (x,y) wo der Verlust minimal ist (das dunkelblaue Tal bei 0,0)"
    }
  };

  // ─── OPTIMIZER INFO DATA ──────────────────────────────────────────────────
  var optimizerInfo = {
    adam: {
      en: {
        analogy: "Adam combines two ideas:\n\n1) <b>Momentum</b> — it remembers which direction it was moving and keeps going that way (like a heavy ball that doesn't instantly change direction)\n\n2) <b>Adaptive learning rate</b> — it tracks how much each parameter has been changing. Parameters that change a lot get smaller steps; parameters that barely change get bigger steps.\n\nThe result: fast convergence, works well out-of-the-box for most problems.",
        when_use: "• Default choice for most deep learning tasks\n• Works well without much tuning\n• Good for sparse gradients (NLP, embeddings)\n• Good for noisy gradients",
        when_not: "• Sometimes generalizes worse than SGD+momentum on image tasks\n• Can converge to sharp minima (worse generalization)\n• Memory: stores 2 extra values per parameter",
        math: [
          { label: "1st moment (direction memory):", tex: "m_t = \\beta_1 \\cdot m_{t-1} + (1 - \\beta_1) \\cdot g_t" },
          { label: "2nd moment (magnitude memory):", tex: "v_t = \\beta_2 \\cdot v_{t-1} + (1 - \\beta_2) \\cdot g_t^2" },
          { label: "Bias correction:", tex: "\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}" },
          { label: "Update rule:", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t} + \\varepsilon} \\cdot \\hat{m}_t" }
        ]
      },
      de: {
        analogy: "Adam kombiniert zwei Ideen:\n\n1) <b>Impuls (Momentum)</b> — er merkt sich, in welche Richtung er sich bewegt hat und macht dort weiter (wie ein schwerer Ball, der nicht sofort die Richtung ändert)\n\n2) <b>Adaptive Lernrate</b> — er verfolgt, wie stark sich jeder Parameter verändert hat. Parameter die sich viel ändern bekommen kleinere Schritte; Parameter die sich kaum ändern bekommen größere Schritte.\n\nDas Ergebnis: schnelle Konvergenz, funktioniert für die meisten Probleme gut ohne viel Tuning.",
        when_use: "• Standardwahl für die meisten Deep-Learning-Aufgaben\n• Funktioniert gut ohne viel Tuning\n• Gut für dünn besetzte Gradienten (NLP, Embeddings)\n• Gut für verrauschte Gradienten",
        when_not: "• Generalisiert manchmal schlechter als SGD+Momentum bei Bildaufgaben\n• Kann zu scharfen Minima konvergieren (schlechtere Generalisierung)\n• Speicher: speichert 2 Extra-Werte pro Parameter",
        math: [
          { label: "1. Moment (Richtungs-Gedächtnis):", tex: "m_t = \\beta_1 \\cdot m_{t-1} + (1 - \\beta_1) \\cdot g_t" },
          { label: "2. Moment (Betrags-Gedächtnis):", tex: "v_t = \\beta_2 \\cdot v_{t-1} + (1 - \\beta_2) \\cdot g_t^2" },
          { label: "Bias-Korrektur:", tex: "\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}" },
          { label: "Update-Regel:", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t} + \\varepsilon} \\cdot \\hat{m}_t" }
        ]
      },
      params: {
        learning_rate: { min: 0.0001, max: 1, default: 0.15, step: 0.001 },
        beta1: { min: 0, max: 0.9999, default: 0.9, step: 0.01 },
        beta2: { min: 0, max: 0.9999, default: 0.999, step: 0.001 },
        epsilon: { min: 1e-10, max: 1, default: 1e-7, step: 1e-8 }
      },
      paramInfo: {
        en: {
          learning_rate: "Controls the base step size. Multiplied with the adaptive factor. Larger = faster but may overshoot. For this demo, try 0.05–0.3.",
          beta1: "Exponential decay rate for the 1st moment (gradient direction average). 0.9 means: keep 90% of previous direction, add 10% of new gradient. Higher = smoother path but slower to react to changes.",
          beta2: "Exponential decay rate for the 2nd moment (gradient magnitude average). 0.999 means: very long memory of how large gradients were. Keeps step sizes stable over time.",
          epsilon: "Added to the denominator to prevent division by zero. Without it, if the 2nd moment is exactly 0, the update would be undefined (division by zero → infinity → NaN). Normally never needs changing."
        },
        de: {
          learning_rate: "Steuert die Basis-Schrittweite. Wird mit dem adaptiven Faktor multipliziert. Größer = schneller aber kann überschießen. Für diese Demo probiere 0.05–0.3.",
          beta1: "Exponentieller Abklingfaktor für das 1. Moment (Gradienten-Richtungsdurchschnitt). 0.9 bedeutet: behalte 90% der vorherigen Richtung, füge 10% des neuen Gradienten hinzu. Höher = glatterer Pfad aber langsamer bei Richtungsänderungen.",
          beta2: "Exponentieller Abklingfaktor für das 2. Moment (Gradienten-Betragsdurchschnitt). 0.999 bedeutet: sehr langes Gedächtnis wie groß Gradienten waren. Hält Schrittweiten über die Zeit stabil.",
          epsilon: "Wird zum Nenner addiert um Division durch Null zu verhindern. Ohne epsilon: wenn das 2. Moment exakt 0 ist, wäre das Update undefiniert (Division durch 0 → Unendlich → NaN). Muss normalerweise nie geändert werden."
        }
      }
    },
    sgd: {
      en: {
        analogy: "The simplest optimizer. At each step:\n\n1) Compute the gradient (which direction is downhill?)\n2) Take a step in that direction\n\nWith <b>momentum</b>: instead of stopping after each step, you accumulate velocity. Like a ball rolling downhill — it speeds up on consistent slopes and rolls over small bumps.\n\nWithout momentum, SGD can oscillate wildly in narrow valleys (ravines). With momentum, it smooths out these oscillations.",
        when_use: "• Often generalizes BETTER than Adam on image classification (CNNs)\n• Well-understood theoretically\n• Minimal memory (only 1 extra value per parameter with momentum)\n• Good with learning rate schedules (warmup + decay)",
        when_not: "• Requires careful learning rate tuning\n• Slow without momentum\n• Struggles with sparse gradients\n• Needs learning rate schedule for best results",
        math: [
          { label: "Basic SGD:", tex: "\\theta_{t+1} = \\theta_t - \\alpha \\cdot g_t" },
          { label: "With momentum:", tex: "v_t = \\mu \\cdot v_{t-1} + g_t" },
          { label: "", tex: "\\theta_{t+1} = \\theta_t - \\alpha \\cdot v_t" }
        ]
      },
      de: {
        analogy: "Der einfachste Optimierer. Bei jedem Schritt:\n\n1) Berechne den Gradienten (welche Richtung geht bergab?)\n2) Mache einen Schritt in diese Richtung\n\nMit <b>Momentum (Impuls)</b>: statt nach jedem Schritt zu stoppen, baust du Geschwindigkeit auf. Wie ein Ball der bergab rollt — er wird schneller auf gleichmäßigen Hängen und rollt über kleine Hügel hinweg.\n\nOhne Momentum kann SGD in engen Tälern (Schluchten) wild oszillieren. Mit Momentum werden diese Oszillationen geglättet.",
        when_use: "• Generalisiert oft BESSER als Adam bei Bildklassifikation (CNNs)\n• Theoretisch gut verstanden\n• Minimaler Speicher (nur 1 Extra-Wert pro Parameter mit Momentum)\n• Gut mit Lernraten-Schedules (Warmup + Decay)",
        when_not: "• Erfordert sorgfältiges Lernraten-Tuning\n• Langsam ohne Momentum\n• Probleme mit dünn besetzten Gradienten\n• Braucht Lernraten-Schedule für beste Ergebnisse",
        math: [
          { label: "Einfaches SGD:", tex: "\\theta_{t+1} = \\theta_t - \\alpha \\cdot g_t" },
          { label: "Mit Momentum:", tex: "v_t = \\mu \\cdot v_{t-1} + g_t" },
          { label: "", tex: "\\theta_{t+1} = \\theta_t - \\alpha \\cdot v_t" }
        ]
      },
      params: {
        learning_rate: { min: 0.001, max: 2, default: 0.12, step: 0.001 },
        momentum: { min: 0, max: 0.999, default: 0.9, step: 0.01 }
      },
      paramInfo: {
        en: {
          learning_rate: "THE most important hyperparameter. Controls step size. Too large → overshoots and diverges. Too small → takes forever. For this demo try 0.05–0.5.",
          momentum: "How much of the previous velocity to keep. 0 = pure gradient descent (no memory). 0.9 = keep 90% of previous velocity. Helps escape small local bumps and reduces oscillation in ravines."
        },
        de: {
          learning_rate: "DER wichtigste Hyperparameter. Steuert die Schrittweite. Zu groß → überschießt und divergiert. Zu klein → dauert ewig. Für diese Demo probiere 0.05–0.5.",
          momentum: "Wie viel der vorherigen Geschwindigkeit beibehalten wird. 0 = reiner Gradientenabstieg (kein Gedächtnis). 0.9 = behalte 90% der vorherigen Geschwindigkeit. Hilft über kleine lokale Hügel und reduziert Oszillation in Schluchten."
        }
      }
    },
    rmsprop: {
      en: {
        analogy: "RMSprop keeps a <b>running average</b> of how large recent gradients were for each parameter.\n\nIf a parameter had large gradients recently → divide by a large number → smaller step.\nIf a parameter had small gradients recently → divide by a small number → larger step.\n\nUnlike Adagrad, it FORGETS old history (exponential decay). So the learning rate doesn't shrink to zero over time.",
        when_use: "• Good for RNNs (recurrent neural networks)\n• Good for non-stationary problems (data distribution changes)\n• Simpler than Adam (no bias correction)\n• Works well with default parameters",
        when_not: "• Adam usually works equally well or better\n• No momentum by default (must add explicitly)\n• Less popular in modern practice (Adam dominates)",
        math: [
          { label: "Running average of squared gradients:", tex: "E[g^2]_t = \\rho \\cdot E[g^2]_{t-1} + (1 - \\rho) \\cdot g_t^2" },
          { label: "Update:", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{E[g^2]_t} + \\varepsilon} \\cdot g_t" },
          { label: "With momentum:", tex: "v_t = \\mu \\cdot v_{t-1} + \\frac{\\alpha}{\\sqrt{E[g^2]_t} + \\varepsilon} \\cdot g_t" },
          { label: "", tex: "\\theta_{t+1} = \\theta_t - v_t" }
        ]
      },
      de: {
        analogy: "RMSprop speichert einen <b>laufenden Durchschnitt</b> davon, wie groß die letzten Gradienten für jeden Parameter waren.\n\nWenn ein Parameter zuletzt große Gradienten hatte → teile durch eine große Zahl → kleinerer Schritt.\nWenn ein Parameter zuletzt kleine Gradienten hatte → teile durch eine kleine Zahl → größerer Schritt.\n\nAnders als Adagrad VERGISST es alte Geschichte (exponentieller Abfall). So schrumpft die Lernrate nicht auf Null.",
        when_use: "• Gut für RNNs (rekurrente neuronale Netze)\n• Gut für nicht-stationäre Probleme (Datenverteilung ändert sich)\n• Einfacher als Adam (keine Bias-Korrektur)\n• Funktioniert gut mit Standardparametern",
        when_not: "• Adam funktioniert meist gleich gut oder besser\n• Kein Momentum standardmäßig (muss explizit hinzugefügt werden)\n• Weniger populär in moderner Praxis (Adam dominiert)",
        math: [
          { label: "Laufender Durchschnitt der quadrierten Gradienten:", tex: "E[g^2]_t = \\rho \\cdot E[g^2]_{t-1} + (1 - \\rho) \\cdot g_t^2" },
          { label: "Update:", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{E[g^2]_t} + \\varepsilon} \\cdot g_t" },
          { label: "Mit Momentum:", tex: "v_t = \\mu \\cdot v_{t-1} + \\frac{\\alpha}{\\sqrt{E[g^2]_t} + \\varepsilon} \\cdot g_t" },
          { label: "", tex: "\\theta_{t+1} = \\theta_t - v_t" }
        ]
      },
      params: {
        learning_rate: { min: 0.001, max: 1, default: 0.1, step: 0.001 },
        rho: { min: 0.01, max: 0.9999, default: 0.9, step: 0.01 },
        momentum: { min: 0, max: 0.999, default: 0, step: 0.01 },
        epsilon: { min: 1e-10, max: 1, default: 1e-7, step: 1e-8 }
      },
      paramInfo: {
        en: {
          learning_rate: "Base step size. Gets divided by the RMS of recent gradients. For this demo try 0.05–0.3.",
          rho: "Decay rate for the running average. 0.9 = keep 90% of history, add 10% new. Higher = longer memory, smoother adaptation. Lower = reacts faster to changes.",
          momentum: "Optional velocity accumulation. 0 = no momentum (pure RMSprop). 0.9 = strong momentum. Helps in ravines.",
          epsilon: "Prevents division by zero. If the running average of squared gradients is 0 (parameter hasn't been updated), without epsilon you'd get infinity. Keep at default."
        },
        de: {
          learning_rate: "Basis-Schrittweite. Wird durch den RMS der letzten Gradienten geteilt. Für diese Demo probiere 0.05–0.3.",
          rho: "Abklingrate für den laufenden Durchschnitt. 0.9 = behalte 90% der Geschichte, füge 10% Neues hinzu. Höher = längeres Gedächtnis, glattere Anpassung. Niedriger = reagiert schneller auf Änderungen.",
          momentum: "Optionale Geschwindigkeitsakkumulation. 0 = kein Momentum (reines RMSprop). 0.9 = starkes Momentum. Hilft in Schluchten.",
          epsilon: "Verhindert Division durch Null. Wenn der laufende Durchschnitt der quadrierten Gradienten 0 ist (Parameter wurde nicht aktualisiert), würde man ohne epsilon Unendlich bekommen. Beim Standard belassen."
        }
      }
    },
    adagrad: {
      en: {
        analogy: "Adagrad gives each parameter its own learning rate that <b>decreases over time</b>.\n\nIt accumulates ALL past squared gradients. Parameters that received large gradients get progressively smaller learning rates. Parameters that received small gradients keep larger learning rates.\n\nProblem: the accumulated sum only grows → learning rate eventually shrinks to zero and learning stops completely. This is why RMSprop and Adam were invented.",
        when_use: "• Excellent for sparse data (NLP, recommender systems)\n• Rare features get larger updates (they need it!)\n• No manual learning rate decay needed\n• Simple to implement",
        when_not: "• Learning rate decays to zero → training stops prematurely\n• Bad for deep networks with many epochs\n• Not suitable for dense, non-sparse problems\n• Superseded by Adam/RMSprop in most cases",
        math: [
          { label: "Accumulate all past squared gradients:", tex: "G_t = G_{t-1} + g_t^2" },
          { label: "Update (per-parameter adaptive rate):", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{G_t} + \\varepsilon} \\cdot g_t" },
          { label: "Note: G only grows → α/√G shrinks to 0", tex: "G_t \\geq G_{t-1} \\quad \\Rightarrow \\quad \\frac{\\alpha}{\\sqrt{G_t}} \\to 0" }
        ]
      },
      de: {
        analogy: "Adagrad gibt jedem Parameter seine eigene Lernrate, die <b>über die Zeit abnimmt</b>.\n\nEs sammelt ALLE vergangenen quadrierten Gradienten auf. Parameter die große Gradienten bekamen, erhalten progressiv kleinere Lernraten. Parameter die kleine Gradienten bekamen, behalten größere Lernraten.\n\nProblem: die akkumulierte Summe wächst nur → Lernrate schrumpft irgendwann auf Null und das Lernen stoppt komplett. Deshalb wurden RMSprop und Adam erfunden.",
        when_use: "• Exzellent für dünn besetzte Daten (NLP, Empfehlungssysteme)\n• Seltene Features bekommen größere Updates (sie brauchen es!)\n• Kein manueller Lernraten-Decay nötig\n• Einfach zu implementieren",
        when_not: "• Lernrate fällt auf Null → Training stoppt vorzeitig\n• Schlecht für tiefe Netze mit vielen Epochen\n• Nicht geeignet für dichte, nicht-dünn-besetzte Probleme\n• Von Adam/RMSprop in den meisten Fällen abgelöst",
        math: [
          { label: "Alle vergangenen quadrierten Gradienten aufsammeln:", tex: "G_t = G_{t-1} + g_t^2" },
          { label: "Update (pro-Parameter adaptive Rate):", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{G_t} + \\varepsilon} \\cdot g_t" },
          { label: "Beachte: G wächst nur → α/√G schrumpft auf 0", tex: "G_t \\geq G_{t-1} \\quad \\Rightarrow \\quad \\frac{\\alpha}{\\sqrt{G_t}} \\to 0" }
        ]
      },
      params: {
        learning_rate: { min: 0.01, max: 5, default: 1.5, step: 0.01 },
        epsilon: { min: 1e-10, max: 1, default: 1e-7, step: 1e-8 },
        initial_accumulator_value: { min: 0, max: 10, default: 0.1, step: 0.01 }
      },
      paramInfo: {
        en: {
          learning_rate: "Initial step size before per-parameter scaling. Needs to be LARGER than Adam's because the denominator grows over time. For this demo try 0.5–3.0.",
          epsilon: "Prevents division by zero at the very start when G is still near 0. Without it, the first update could be astronomically large (dividing by ~0).",
          initial_accumulator_value: "Starting value for G (the gradient accumulator). Acts as 'fake history'. Larger = more conservative first steps. Prevents the first few updates from being too aggressive."
        },
        de: {
          learning_rate: "Anfängliche Schrittweite vor der pro-Parameter-Skalierung. Muss GRÖSSER sein als bei Adam, weil der Nenner über die Zeit wächst. Für diese Demo probiere 0.5–3.0.",
          epsilon: "Verhindert Division durch Null ganz am Anfang wenn G noch nahe 0 ist. Ohne epsilon könnte das erste Update astronomisch groß sein (Division durch ~0).",
          initial_accumulator_value: "Startwert für G (den Gradienten-Akkumulator). Wirkt als 'Fake-Geschichte'. Größer = konservativere erste Schritte. Verhindert dass die ersten Updates zu aggressiv sind."
        }
      }
    },
    adadelta: {
      en: {
        analogy: "Adadelta fixes Adagrad's dying learning rate problem by using a <b>sliding window</b> instead of accumulating ALL history.\n\nIt also has a unique trick: instead of needing a learning rate parameter, it uses the ratio of accumulated parameter updates to accumulated gradients. The units 'match up' automatically.\n\nThink of it as: \"adjust step size based on recent terrain, and scale it by how much you've been moving lately.\"",
        when_use: "• When you don't want to tune a learning rate\n• Fixes Adagrad's decaying rate problem\n• Good for problems where the optimal learning rate changes over time",
        when_not: "• Rarely used in modern practice (Adam is preferred)\n• Can be slow to converge\n• Less community support and fewer tutorials\n• The 'no learning rate' claim is somewhat misleading (there's still a scaling factor)",
        math: [
          { label: "Running average of squared gradients:", tex: "E[g^2]_t = \\rho \\cdot E[g^2]_{t-1} + (1 - \\rho) \\cdot g_t^2" },
          { label: "Compute update (note: uses previous Δθ):", tex: "\\Delta\\theta_t = -\\frac{\\sqrt{E[\\Delta\\theta^2]_{t-1} + \\varepsilon}}{\\sqrt{E[g^2]_t + \\varepsilon}} \\cdot g_t" },
          { label: "Running average of squared updates:", tex: "E[\\Delta\\theta^2]_t = \\rho \\cdot E[\\Delta\\theta^2]_{t-1} + (1 - \\rho) \\cdot \\Delta\\theta_t^2" },
          { label: "Apply:", tex: "\\theta_{t+1} = \\theta_t + \\Delta\\theta_t" }
        ]
      },
      de: {
        analogy: "Adadelta behebt Adagrads sterbendes-Lernraten-Problem durch ein <b>gleitendes Fenster</b> statt ALLE Geschichte aufzusammeln.\n\nEs hat auch einen einzigartigen Trick: statt statt ALLE Geschichte aufzusammeln.\n\nEs hat auch einen einzigartigen Trick: statt einer festen Lernrate nutzt es das Verhältnis von akkumulierten Parameter-Updates zu akkumulierten Gradienten. Die Einheiten 'passen' automatisch zusammen.\n\nStell es dir so vor: \"Passe die Schrittweite an das jüngste Gelände an, und skaliere es danach, wie viel du dich zuletzt bewegt hast.\"",
        when_use: "• Wenn du keine Lernrate tunen willst\n• Behebt Adagrads sterbendes-Lernraten-Problem\n• Gut für Probleme wo die optimale Lernrate sich über die Zeit ändert",
        when_not: "• Wird in moderner Praxis selten verwendet (Adam wird bevorzugt)\n• Kann langsam konvergieren\n• Weniger Community-Support und weniger Tutorials\n• Die 'keine Lernrate'-Behauptung ist etwas irreführend (es gibt trotzdem einen Skalierungsfaktor)",
        math: [
          { label: "Laufender Durchschnitt der quadrierten Gradienten:", tex: "E[g^2]_t = \\rho \\cdot E[g^2]_{t-1} + (1 - \\rho) \\cdot g_t^2" },
          { label: "Update berechnen (nutzt vorheriges Δθ):", tex: "\\Delta\\theta_t = -\\frac{\\sqrt{E[\\Delta\\theta^2]_{t-1} + \\varepsilon}}{\\sqrt{E[g^2]_t + \\varepsilon}} \\cdot g_t" },
          { label: "Laufender Durchschnitt der quadrierten Updates:", tex: "E[\\Delta\\theta^2]_t = \\rho \\cdot E[\\Delta\\theta^2]_{t-1} + (1 - \\rho) \\cdot \\Delta\\theta_t^2" },
          { label: "Anwenden:", tex: "\\theta_{t+1} = \\theta_t + \\Delta\\theta_t" }
        ]
      },
      params: {
        learning_rate: { min: 0.01, max: 10, default: 1.0, step: 0.01 },
        rho: { min: 0.01, max: 0.9999, default: 0.95, step: 0.01 },
        epsilon: { min: 1e-10, max: 1, default: 1e-6, step: 1e-8 }
      },
      paramInfo: {
        en: {
          learning_rate: "Scaling factor applied to the computed update. Usually 1.0 because Adadelta computes its own effective learning rate from the ratio of RMS(updates)/RMS(gradients). Increase if convergence is too slow.",
          rho: "Decay rate for the sliding window. 0.95 = keep 95% of recent history. Controls how quickly old gradient information is forgotten. Lower = adapts faster but noisier. Higher = smoother but slower to react.",
          epsilon: "Prevents division by zero AND bootstraps the first update. At step 0, E[Δθ²] is 0, so without epsilon the numerator would be 0 and no update would ever happen. It 'kickstarts' learning."
        },
        de: {
          learning_rate: "Skalierungsfaktor für das berechnete Update. Meist 1.0, weil Adadelta seine eigene effektive Lernrate aus dem Verhältnis RMS(Updates)/RMS(Gradienten) berechnet. Erhöhen wenn Konvergenz zu langsam.",
          rho: "Abklingrate für das gleitende Fenster. 0.95 = behalte 95% der jüngsten Geschichte. Steuert wie schnell alte Gradienteninfo vergessen wird. Niedriger = passt sich schneller an aber verrauschter. Höher = glatter aber langsamer.",
          epsilon: "Verhindert Division durch Null UND startet das erste Update. Bei Schritt 0 ist E[Δθ²] = 0, also wäre ohne epsilon der Zähler 0 und es würde NIE ein Update passieren. Es 'kickstartet' das Lernen."
        }
      }
    },
    adamax: {
      en: {
        analogy: "Adamax is a variant of Adam that uses the <b>infinity norm</b> (maximum absolute value) instead of the L2 norm (root mean square) for the second moment.\n\nIn Adam, the denominator is √(average of g²). In Adamax, it's max(previous_max × β₂, |current_gradient|).\n\nWhy? When gradients occasionally spike very large, Adam's squared average can become unstable. Adamax just tracks the maximum — simpler, more robust to outlier gradients.",
        when_use: "• When Adam becomes unstable (gradient spikes)\n• For models with embedding layers (sparse, large gradients)\n• When you see NaN or Inf during Adam training\n• Theoretically more stable than Adam in some cases",
        when_not: "• Adam works fine for most problems\n• Less studied than Adam (fewer papers, less tuning advice)\n• The max operation can be overly conservative\n• Rarely the first choice in practice",
        math: [
          { label: "1st moment (same as Adam):", tex: "m_t = \\beta_1 \\cdot m_{t-1} + (1 - \\beta_1) \\cdot g_t" },
          { label: "∞-norm (max instead of mean):", tex: "u_t = \\max(\\beta_2 \\cdot u_{t-1}, \\; |g_t|)" },
          { label: "Update (no bias correction needed for u):", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{1 - \\beta_1^t} \\cdot \\frac{m_t}{u_t + \\varepsilon}" }
        ]
      },
      de: {
        analogy: "Adamax ist eine Variante von Adam, die die <b>Unendlich-Norm</b> (maximaler Absolutwert) statt der L2-Norm (quadratisches Mittel) für das zweite Moment verwendet.\n\nBei Adam ist der Nenner √(Durchschnitt von g²). Bei Adamax ist es max(vorheriges_max × β₂, |aktueller_gradient|).\n\nWarum? Wenn Gradienten gelegentlich sehr groß werden, kann Adams quadratischer Durchschnitt instabil werden. Adamax verfolgt einfach das Maximum — einfacher, robuster gegen Ausreißer-Gradienten.",
        when_use: "• Wenn Adam instabil wird (Gradienten-Spitzen)\n• Für Modelle mit Embedding-Layern (dünn besetzt, große Gradienten)\n• Wenn NaN oder Inf während Adam-Training auftreten\n• Theoretisch stabiler als Adam in manchen Fällen",
        when_not: "• Adam funktioniert für die meisten Probleme gut\n• Weniger erforscht als Adam (weniger Papers, weniger Tuning-Ratschläge)\n• Die Max-Operation kann übermäßig konservativ sein\n• Selten die erste Wahl in der Praxis",
        math: [
          { label: "1. Moment (wie bei Adam):", tex: "m_t = \\beta_1 \\cdot m_{t-1} + (1 - \\beta_1) \\cdot g_t" },
          { label: "∞-Norm (Max statt Mittel):", tex: "u_t = \\max(\\beta_2 \\cdot u_{t-1}, \\; |g_t|)" },
          { label: "Update (keine Bias-Korrektur für u nötig):", tex: "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{1 - \\beta_1^t} \\cdot \\frac{m_t}{u_t + \\varepsilon}" }
        ]
      },
      params: {
        learning_rate: { min: 0.0001, max: 1, default: 0.15, step: 0.001 },
        beta1: { min: 0, max: 0.9999, default: 0.9, step: 0.01 },
        beta2: { min: 0, max: 0.9999, default: 0.999, step: 0.001 },
        epsilon: { min: 1e-10, max: 1, default: 1e-7, step: 1e-8 },
        decay: { min: 0, max: 0.1, default: 0, step: 0.0001 }
      },
      paramInfo: {
        en: {
          learning_rate: "Base step size. Gets divided by the infinity-norm of gradients. For this demo try 0.05–0.3.",
          beta1: "Momentum decay rate (same as Adam). Controls how much of the previous gradient direction is kept. 0.9 = keep 90%.",
          beta2: "Decay rate for the infinity norm tracker. Controls how quickly the 'maximum gradient memory' fades. 0.999 = very long memory of the largest gradient seen.",
          epsilon: "Prevents division by zero when u_t is 0 (at the very start, or if all gradients are exactly 0). Without it: 0/0 = NaN → training crashes.",
          decay: "Learning rate decay per step: lr_effective = lr / (1 + decay × t). Gradually reduces step size over time. 0 = no decay. Use small values like 0.0001."
        },
        de: {
          learning_rate: "Basis-Schrittweite. Wird durch die Unendlich-Norm der Gradienten geteilt. Für diese Demo probiere 0.05–0.3.",
          beta1: "Momentum-Abklingrate (wie bei Adam). Steuert wie viel der vorherigen Gradientenrichtung beibehalten wird. 0.9 = behalte 90%.",
          beta2: "Abklingrate für den Unendlich-Norm-Tracker. Steuert wie schnell das 'Maximum-Gradienten-Gedächtnis' verblasst. 0.999 = sehr langes Gedächtnis des größten gesehenen Gradienten.",
          epsilon: "Verhindert Division durch Null wenn u_t = 0 ist (ganz am Anfang, oder wenn alle Gradienten exakt 0 sind). Ohne epsilon: 0/0 = NaN → Training stürzt ab.",
          decay: "Lernraten-Decay pro Schritt: lr_effektiv = lr / (1 + decay × t). Reduziert Schrittweite über die Zeit. 0 = kein Decay. Nutze kleine Werte wie 0.0001."
        }
      }
    }
  };

  // ─── LOSS FUNCTION & GRADIENT ─────────────────────────────────────────────
  // Elongated bowl: f(x,y) = x² + 10y²
  // This shows optimizer behavior in ravines (narrow valleys)
  // x and y represent model parameters (weights)
  function lossFn(x, y) {
    return x * x + 10 * y * y;
  }

  function gradFn(x, y) {
    return [2 * x, 20 * y];
  }

  // ─── OPTIMIZER IMPLEMENTATIONS ────────────────────────────────────────────
  function createOptimizer(name, params) {
    switch (name) {
      case "adam": return _createAdam(params);
      case "adadelta": return _createAdadelta(params);
      case "adagrad": return _createAdagrad(params);
      case "adamax": return _createAdamax(params);
      case "rmsprop": return _createRMSprop(params);
      case "sgd": return _createSGD(params);
      default: return _createSGD(params);
    }
  }

  function _createSGD(p) {
    var lr = p.learning_rate;
    var mom = p.momentum || 0;
    var vx = 0, vy = 0;
    return function (x, y) {
      var g = gradFn(x, y);
      vx = mom * vx + g[0];
      vy = mom * vy + g[1];
      return [x - lr * vx, y - lr * vy];
    };
  }

  function _createAdam(p) {
    var lr = p.learning_rate;
    var b1 = p.beta1;
    var b2 = p.beta2;
    var eps = p.epsilon;
    var mx = 0, my = 0, vx = 0, vy = 0, t = 0;
    return function (x, y) {
      t++;
      var g = gradFn(x, y);
      mx = b1 * mx + (1 - b1) * g[0];
      my = b1 * my + (1 - b1) * g[1];
      vx = b2 * vx + (1 - b2) * g[0] * g[0];
      vy = b2 * vy + (1 - b2) * g[1] * g[1];
      var mxh = mx / (1 - Math.pow(b1, t));
      var myh = my / (1 - Math.pow(b1, t));
      var vxh = vx / (1 - Math.pow(b2, t));
      var vyh = vy / (1 - Math.pow(b2, t));
      return [x - lr * mxh / (Math.sqrt(vxh) + eps), y - lr * myh / (Math.sqrt(vyh) + eps)];
    };
  }

  function _createAdadelta(p) {
    var rho = p.rho;
    var eps = p.epsilon;
    var lr = p.learning_rate || 1.0;
    var egx = 0, egy = 0, edx = 0, edy = 0;
    return function (x, y) {
      var g = gradFn(x, y);
      egx = rho * egx + (1 - rho) * g[0] * g[0];
      egy = rho * egy + (1 - rho) * g[1] * g[1];
      var dx = -lr * Math.sqrt(edx + eps) / Math.sqrt(egx + eps) * g[0];
      var dy = -lr * Math.sqrt(edy + eps) / Math.sqrt(egy + eps) * g[1];
      edx = rho * edx + (1 - rho) * dx * dx;
      edy = rho * edy + (1 - rho) * dy * dy;
      return [x + dx, y + dy];
    };
  }

  function _createAdagrad(p) {
    var lr = p.learning_rate;
    var eps = p.epsilon;
    var init = p.initial_accumulator_value || 0.1;
    var gx_sum = init, gy_sum = init;
    return function (x, y) {
      var g = gradFn(x, y);
      gx_sum += g[0] * g[0];
      gy_sum += g[1] * g[1];
      return [x - lr / (Math.sqrt(gx_sum) + eps) * g[0], y - lr / (Math.sqrt(gy_sum) + eps) * g[1]];
    };
  }

  function _createAdamax(p) {
    var lr = p.learning_rate;
    var b1 = p.beta1;
    var b2 = p.beta2;
    var eps = p.epsilon;
    var decay = p.decay || 0;
    var mx = 0, my = 0, ux = eps, uy = eps, t = 0;
    return function (x, y) {
      t++;
      var effectiveLr = lr / (1 + decay * t);
      var g = gradFn(x, y);
      mx = b1 * mx + (1 - b1) * g[0];
      my = b1 * my + (1 - b1) * g[1];
      ux = Math.max(b2 * ux, Math.abs(g[0]));
      uy = Math.max(b2 * uy, Math.abs(g[1]));
      var bc = 1 - Math.pow(b1, t);
      return [x - (effectiveLr / bc) * mx / (ux + eps), y - (effectiveLr / bc) * my / (uy + eps)];
    };
  }

  function _createRMSprop(p) {
    var lr = p.learning_rate;
    var rho = p.rho || 0.9;
    var eps = p.epsilon;
    var mom = p.momentum || 0;
    var egx = 0, egy = 0, vx = 0, vy = 0;
    return function (x, y) {
      var g = gradFn(x, y);
      egx = rho * egx + (1 - rho) * g[0] * g[0];
      egy = rho * egy + (1 - rho) * g[1] * g[1];
      var dx = lr / (Math.sqrt(egx) + eps) * g[0];
      var dy = lr / (Math.sqrt(egy) + eps) * g[1];
      vx = mom * vx + dx;
      vy = mom * vy + dy;
      return [x - vx, y - vy];
    };
  }

  // ─── SIMULATION ───────────────────────────────────────────────────────────
  function runSimulation(optimizerName, params, startX, startY, maxSteps) {
    var step = createOptimizer(optimizerName, params);
    var path = [{ x: startX, y: startY, z: lossFn(startX, startY) }];
    var x = startX, y = startY;
    for (var i = 0; i < maxSteps; i++) {
      var next = step(x, y);
      x = Math.max(-5, Math.min(5, next[0]));
      y = Math.max(-5, Math.min(5, next[1]));
      path.push({ x: x, y: y, z: lossFn(x, y) });
      if (Math.abs(x) < 1e-8 && Math.abs(y) < 1e-8) break;
    }
    return path;
  }

  // ─── READ PARAMS FROM PAGE (optimizer.php generated inputs) ───────────────
  function readPageParams(optimizerName) {
    var info = optimizerInfo[optimizerName];
    if (!info) return {};
    var params = {};
    for (var key in info.params) {
      if (!info.params.hasOwnProperty(key)) continue;
      params[key] = info.params[key].default;
    }
    return params;
  }

  // ─── VALIDATION ───────────────────────────────────────────────────────────
  function validateParam(name, value, meta) {
    var t = i18n[L()];
    if (value === "" || value === null || value === undefined) {
      return t.validationError.replace("{param}", name).replace("{min}", meta.min).replace("{max}", meta.max);
    }
    var num = parseFloat(value);
    if (isNaN(num)) {
      return t.validationError.replace("{param}", name).replace("{min}", meta.min).replace("{max}", meta.max);
    }
    if (num < meta.min || num > meta.max) {
      return t.validationError.replace("{param}", name).replace("{min}", meta.min).replace("{max}", meta.max);
    }
    return null; // valid
  }

  // ─── SURFACE DATA GENERATION ──────────────────────────────────────────────
  function generateSurfaceData(gridSize, range) {
    var n = gridSize || 50;
    var r = range || 5;
    var xVals = [], yVals = [], zVals = [];
    for (var i = 0; i < n; i++) {
      xVals.push(-r + (2 * r * i) / (n - 1));
    }
    for (var j = 0; j < n; j++) {
      yVals.push(-r + (2 * r * j) / (n - 1));
    }
    for (var j = 0; j < n; j++) {
      var row = [];
      for (var i = 0; i < n; i++) {
        row.push(lossFn(xVals[i], yVals[j]));
      }
      zVals.push(row);
    }
    return { x: xVals, y: yVals, z: zVals };
  }

  // ─── PLOTLY 3D RENDERING ──────────────────────────────────────────────────
  function renderPlotly3D(container, path, optimizerName, animUpTo) {
    if (typeof Plotly === "undefined") return;

    if (_state.userInteracting) {
      _state.pendingRender = { container: container, path: path, name: optimizerName, frame: animUpTo };
      return;
    }

    _saveCamera(container);

    var surface = generateSurfaceData(50, 5);

    var surfaceTrace = {
      type: "surface",
      x: surface.x,
      y: surface.y,
      z: surface.z,
      colorscale: [
        [0, "rgb(0, 0, 80)"],
        [0.12, "rgb(0, 80, 180)"],
        [0.25, "rgb(0, 180, 255)"],
        [0.4, "rgb(50, 255, 200)"],
        [0.55, "rgb(150, 255, 50)"],
        [0.7, "rgb(255, 220, 0)"],
        [0.85, "rgb(255, 100, 0)"],
        [1, "rgb(180, 0, 0)"]
      ],
      opacity: 0.82,
      showscale: true,
      colorbar: {
        title: { text: "Loss", side: "right", font: { size: 11, color: "#aaa" } },
        thickness: 14,
        len: 0.55,
        tickfont: { color: "#888", size: 10 }
      },
      contours: {
        z: { show: true, usecolormap: true, highlightcolor: "#fff", project: { z: false } }
      },
      hovertemplate: "x (param 1): %{x:.3f}<br>y (param 2): %{y:.3f}<br>Loss: %{z:.4f}<extra></extra>",
      name: "f(x,y) = x² + 10y²"
    };

    var traces = [surfaceTrace];

    var frameIdx = (typeof animUpTo === "number") ? Math.min(animUpTo, path.length - 1) : path.length - 1;
    if (frameIdx < 0) frameIdx = 0;

    var pathX = [], pathY = [], pathZ = [];
    for (var i = 0; i <= frameIdx; i++) {
      pathX.push(path[i].x);
      pathY.push(path[i].y);
      pathZ.push(path[i].z + 0.5);
    }

    if (pathX.length > 1) {
      traces.push({
        type: "scatter3d",
        mode: "lines+markers",
        x: pathX,
        y: pathY,
        z: pathZ,
        line: { color: "#ffffff", width: 5 },
        marker: { size: 2.5, color: "#ffffff", opacity: 0.7 },
        name: optimizerName + " path",
        hovertemplate: "Step %{pointNumber}<br>x: %{x:.4f}<br>y: %{y:.4f}<br>Loss: %{z:.4f}<extra></extra>"
      });
    }

    // Start marker
    if (path.length > 0) {
      traces.push({
        type: "scatter3d",
        mode: "markers",
        x: [path[0].x],
        y: [path[0].y],
        z: [path[0].z + 0.5],
        marker: { size: 8, color: "#2ecc71", symbol: "diamond", line: { color: "#fff", width: 1 } },
        name: "Start",
        hovertemplate: "START<br>x: %{x:.4f}<br>y: %{y:.4f}<br>Loss: %{z:.4f}<extra></extra>"
      });
    }

    // Current position
    if (frameIdx > 0) {
      var cur = path[frameIdx];
      traces.push({
        type: "scatter3d",
        mode: "markers",
        x: [cur.x],
        y: [cur.y],
        z: [cur.z + 0.5],
        marker: { size: 10, color: "#e74c3c", symbol: "circle", line: { color: "#fff", width: 2 } },
        name: "Current (step " + frameIdx + ")",
        hovertemplate: "CURRENT<br>x: %{x:.4f}<br>y: %{y:.4f}<br>Loss: %{z:.4f}<extra></extra>"
      });
    }

    // Goal
    traces.push({
      type: "scatter3d",
      mode: "markers",
      x: [0],
      y: [0],
      z: [0.3],
      marker: { size: 7, color: "#f9e2af", symbol: "x", line: { color: "#1e1e2e", width: 1 } },
      name: "Minimum (0,0)",
      hovertemplate: "GOAL<br>x: 0<br>y: 0<br>Loss: 0<extra></extra>"
    });

    var t = i18n[L()];

    var layout = {
      scene: {
        xaxis: {
          title: { text: "x (param 1)", font: { size: 12, color: "#89b4fa" } },
          range: [-5, 5],
          gridcolor: "rgba(255,255,255,0.08)",
          color: "#888",
          tickfont: { size: 9, color: "#666" }
        },
        yaxis: {
          title: { text: "y (param 2)", font: { size: 12, color: "#89b4fa" } },
          range: [-5, 5],
          gridcolor: "rgba(255,255,255,0.08)",
          color: "#888",
          tickfont: { size: 9, color: "#666" }
        },
        zaxis: {
          title: { text: "Loss", font: { size: 12, color: "#89b4fa" } },
          gridcolor: "rgba(255,255,255,0.08)",
          color: "#888",
          tickfont: { size: 9, color: "#666" },
          rangemode: "tozero"
        },
        bgcolor: "#0d0d1a",
        camera: _state.lastCamera || { eye: { x: 1.6, y: 1.6, z: 1.0 } }
      },
      paper_bgcolor: "#0d0d1a",
      plot_bgcolor: "#0d0d1a",
      font: { color: "#cdd6f4", size: 11 },
      margin: { l: 0, r: 0, t: 36, b: 0 },
      title: {
        text: optimizerName.toUpperCase() + " — " + t.surfaceLabel,
        font: { size: 13, color: "#89b4fa" }
      },
      showlegend: true,
      legend: { x: 0.01, y: 0.99, bgcolor: "rgba(13,13,26,0.85)", font: { size: 10, color: "#cdd6f4" } },
      dragmode: "turntable"
    };

    var config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
      displaylogo: false,
      scrollZoom: true
    };

    if (!_state.plotlyReady) {
      Plotly.newPlot(container, traces, layout, config).then(function () {
        _state.plotlyReady = true;
        _setupInteractionListeners(container);
      });
    } else {
      Plotly.react(container, traces, layout, config);
    }
  }

  // ─── CAMERA & INTERACTION ─────────────────────────────────────────────────
  function _saveCamera(plotDiv) {
    if (!plotDiv || !plotDiv._fullLayout) return;
    try {
      var scene = plotDiv._fullLayout.scene;
      if (scene && scene._scene && scene._scene.getCamera) {
        _state.lastCamera = scene._scene.getCamera();
      } else if (scene && scene.camera) {
        _state.lastCamera = JSON.parse(JSON.stringify(scene.camera));
      }
    } catch (e) {}
  }

  function _setupInteractionListeners(plotDiv) {
    if (!plotDiv) return;
    plotDiv.addEventListener("mousedown", _onInteractionStart, { passive: true });
    plotDiv.addEventListener("touchstart", _onInteractionStart, { passive: true });
    plotDiv.addEventListener("wheel", function (e) {
      e.stopPropagation();
      _onInteractionStart();
    }, { passive: true });

    if (plotDiv.on) {
      plotDiv.on("plotly_relayouting", function (eventData) {
        _state.userInteracting = true;
        _clearInteractionTimeout();
        _state.interactionTimeout = setTimeout(_onInteractionEnd, 350);
        if (eventData && eventData["scene.camera"]) {
          _state.lastCamera = eventData["scene.camera"];
        }
      });
      plotDiv.on("plotly_relayout", function () {
        _saveCamera(plotDiv);
      });
    }
  }

  function _onInteractionStart() {
    _state.userInteracting = true;
    _clearInteractionTimeout();
    _state.interactionTimeout = setTimeout(_onInteractionEnd, 400);
  }

  function _onInteractionEnd() {
    _state.userInteracting = false;
    var plotDiv = document.getElementById(_PLOT_ID);
    if (plotDiv) _saveCamera(plotDiv);
    if (_state.pendingRender) {
      var pr = _state.pendingRender;
      _state.pendingRender = null;
      renderPlotly3D(pr.container, pr.path, pr.name, pr.frame);
    }
  }

  function _clearInteractionTimeout() {
    if (_state.interactionTimeout) {
      clearTimeout(_state.interactionTimeout);
      _state.interactionTimeout = null;
    }
  }

  // ─── ANIMATION LOOP ───────────────────────────────────────────────────────
  function startAnimation(plotDiv, path, optimizerName) {
    stopAnimation();
    _state.path = path;
    _state.animationFrame = 0;

    // Calculate delay so that the full animation takes ~15-20 seconds
    var totalFrames = path.length;
    var targetDuration = 18000; // 18 seconds total
    var baseDelay = Math.max(30, Math.min(300, targetDuration / totalFrames));

    function tick() {
      if (_state.animationFrame >= path.length) {
        renderPlotly3D(plotDiv, path, optimizerName, path.length - 1);
        updateStatus(path.length - 1, path);
        return;
      }

      renderPlotly3D(plotDiv, path, optimizerName, _state.animationFrame);
      updateStatus(_state.animationFrame, path);
      _state.animationFrame++;

      _state.animationId = setTimeout(tick, baseDelay);
    }

    tick();
  }

  function stopAnimation() {
    if (_state.animationId) {
      clearTimeout(_state.animationId);
      _state.animationId = null;
    }
  }

  function updateStatus(frameIdx, path) {
    var statusEl = document.getElementById("optimizer-info-status");
    if (!statusEl) return;
    var t = i18n[L()];
    if (frameIdx >= path.length - 1) {
      var finalLoss = path[path.length - 1].z;
      statusEl.innerHTML = "<span style='color:#a6e3a1;font-weight:bold;'>" + t.doneLabel + "</span> &nbsp; " +
        t.lossLabel + ": " + finalLoss.toFixed(6) +
        " &nbsp;|&nbsp; x: " + path[path.length - 1].x.toFixed(5) +
        ", y: " + path[path.length - 1].y.toFixed(5);
    } else {
      var curLoss = path[frameIdx].z;
      statusEl.textContent = t.stepLabel + " " + frameIdx + " / " + (path.length - 1) +
        "  —  " + t.lossLabel + ": " + curLoss.toFixed(4) +
        "  |  x: " + path[frameIdx].x.toFixed(4) + ", y: " + path[frameIdx].y.toFixed(4);
    }
  }

  // ─── BUILD POPUP ──────────────────────────────────────────────────────────
  function buildPopup(optimizerName) {
    var t = i18n[L()];
    var info = optimizerInfo[optimizerName];
    if (!info) return;

    var localInfo = info[L()];
    if (!localInfo) return;

    removePopup();
    stopAnimation();
    _state.plotlyReady = false;
    _state.lastCamera = null;
    _state.currentOptimizer = optimizerName;

    // Overlay
    var overlay = document.createElement("div");
    overlay.id = _POPUP_ID;
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;" +
      "background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;" +
      "justify-content:center;padding:16px;box-sizing:border-box;";

    // Modal
    var modal = document.createElement("div");
    modal.style.cssText = "background:#1e1e2e;color:#cdd6f4;border-radius:16px;" +
      "width:min(97vw,1250px);max-height:94vh;overflow-y:auto;padding:28px 32px;" +
      "position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7);" +
      "font-family:'Segoe UI',system-ui,sans-serif;";

    // Close button
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = "position:sticky;top:0;float:right;background:#f38ba8;" +
      "border:none;color:#1e1e2e;font-size:20px;font-weight:bold;width:36px;height:36px;" +
      "border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "transition:transform 0.2s;z-index:10;margin-left:auto;";
    closeBtn.onmouseenter = function () { closeBtn.style.transform = "scale(1.2)"; };
    closeBtn.onmouseleave = function () { closeBtn.style.transform = "scale(1)"; };
    closeBtn.onclick = removePopup;
    modal.appendChild(closeBtn);

    // Title
    var title = document.createElement("h2");
    title.textContent = t.title.replace("{name}", optimizerName.toUpperCase());
    title.style.cssText = "margin:0 0 6px 0;color:#89b4fa;font-size:22px;";
    modal.appendChild(title);

    // ─── Analogy section ───
    var analogyH = document.createElement("h3");
    analogyH.textContent = t.analogyTitle;
    analogyH.style.cssText = "color:#f9e2af;margin:20px 0 8px 0;font-size:16px;";
    modal.appendChild(analogyH);

    var analogyBox = document.createElement("div");
    analogyBox.style.cssText = "background:#313244;border-radius:12px;padding:16px;" +
      "margin-bottom:20px;font-size:14px;line-height:1.7;border-left:4px solid #f9e2af;";
    analogyBox.innerHTML = localInfo.analogy.replace(/\n/g, "<br>");
    modal.appendChild(analogyBox);

    // ─── Math section ───
    var techH = document.createElement("h3");
    techH.textContent = t.techTitle;
    techH.style.cssText = "color:#89b4fa;margin:0 0 8px 0;font-size:16px;";
    modal.appendChild(techH);

    var mathBox = document.createElement("div");
    mathBox.style.cssText = "background:#313244;border-radius:12px;padding:16px;" +
      "margin-bottom:20px;border-left:4px solid #89b4fa;";

    for (var mi = 0; mi < localInfo.math.length; mi++) {
      var eq = localInfo.math[mi];
      if (eq.label) {
        var lbl = document.createElement("div");
        lbl.style.cssText = "font-size:12px;color:#a6adc8;margin-top:" + (mi > 0 ? "12px" : "0") + ";margin-bottom:4px;";
        lbl.textContent = eq.label;
        mathBox.appendChild(lbl);
      }
      var mathDiv = document.createElement("div");
      mathDiv.style.cssText = "margin:4px 0 4px 12px;font-size:16px;overflow-x:auto;";
      mathDiv.innerHTML = renderMathBlock(eq.tex);
      mathBox.appendChild(mathDiv);
    }
    modal.appendChild(mathBox);

    // ─── When to use / when not ───
    var whenH = document.createElement("h3");
    whenH.textContent = t.whenTitle;
    whenH.style.cssText = "color:#a6e3a1;margin:0 0 8px 0;font-size:16px;";
    modal.appendChild(whenH);

    var whenGrid = document.createElement("div");
    whenGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;";

    var useBox = document.createElement("div");
    useBox.style.cssText = "background:#313244;border-radius:12px;padding:14px;border-left:4px solid #a6e3a1;font-size:13px;line-height:1.6;white-space:pre-wrap;";
    useBox.textContent = localInfo.when_use;
    whenGrid.appendChild(useBox);

    var notBox = document.createElement("div");
    notBox.style.cssText = "background:#313244;border-radius:12px;padding:14px;border-left:4px solid #f38ba8;font-size:13px;line-height:1.6;white-space:pre-wrap;";
    notBox.textContent = localInfo.when_not;
    whenGrid.appendChild(notBox);

    modal.appendChild(whenGrid);

    // ─── Parameters section ───
    var paramH = document.createElement("h3");
    paramH.textContent = t.paramTitle;
    paramH.style.cssText = "color:#cba6f7;margin:0 0 12px 0;font-size:16px;";
    modal.appendChild(paramH);

    var paramInfo = info.paramInfo[L()];
    var paramGrid = document.createElement("div");
    paramGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));" +
      "gap:10px;margin-bottom:24px;";

    for (var pName in paramInfo) {
      if (!paramInfo.hasOwnProperty(pName)) continue;
      var card = document.createElement("div");
      card.style.cssText = "background:#45475a;border-radius:10px;padding:12px 14px;";

      var pTitle = document.createElement("div");
      pTitle.style.cssText = "margin-bottom:6px;";
      pTitle.innerHTML = "<strong style='color:#cba6f7;font-size:14px;'>" + pName + "</strong>";

      // Show the math context for this param
      var paramMathCtx = _getParamMathContext(optimizerName, pName);
      if (paramMathCtx) {
        var mathSpan = document.createElement("span");
        mathSpan.style.cssText = "margin-left:8px;font-size:13px;";
        mathSpan.innerHTML = renderMath(paramMathCtx);
        pTitle.appendChild(mathSpan);
      }
      card.appendChild(pTitle);

      var pDesc = document.createElement("p");
      pDesc.textContent = paramInfo[pName];
      pDesc.style.cssText = "margin:0;font-size:12.5px;color:#bac2de;line-height:1.5;";
      card.appendChild(pDesc);

      // Show what happens without epsilon (for epsilon params)
      if (pName === "epsilon") {
        var epsDemo = document.createElement("div");
        epsDemo.style.cssText = "margin-top:8px;padding:8px;background:#313244;border-radius:8px;font-size:12px;";
        epsDemo.innerHTML = "<span style='color:#f38ba8;'>⚠️ " +
          (L() === "de" ? "Ohne ε:" : "Without ε:") + "</span> " +
          renderMath("\\frac{\\alpha}{\\sqrt{0} + 0} = \\frac{\\alpha}{0} = \\infty \\rightarrow \\text{NaN}") +
          "<br><span style='color:#a6e3a1;margin-top:4px;display:inline-block;'>✓ " +
          (L() === "de" ? "Mit ε:" : "With ε:") + "</span> " +
          renderMath("\\frac{\\alpha}{\\sqrt{0} + \\varepsilon} = \\frac{\\alpha}{\\varepsilon} \\approx " +
            (L() === "de" ? "\\text{großer aber endlicher Wert}" : "\\text{large but finite value}"));
        card.appendChild(epsDemo);
      }

      paramGrid.appendChild(card);
    }
    modal.appendChild(paramGrid);

    // ─── 3D Playground section ───
    var playH = document.createElement("h3");
    playH.textContent = t.playgroundTitle;
    playH.style.cssText = "color:#94e2d5;margin:0 0 8px 0;font-size:16px;";
    modal.appendChild(playH);

    var playDesc = document.createElement("p");
    playDesc.style.cssText = "font-size:13px;color:#a6adc8;margin:0 0 6px 0;line-height:1.5;";
    playDesc.textContent = t.playDesc;
    modal.appendChild(playDesc);

    var dimNote = document.createElement("p");
    dimNote.style.cssText = "font-size:12px;color:#f9e2af;margin:0 0 6px 0;line-height:1.4;font-style:italic;";
    dimNote.textContent = t.playDescDim;
    modal.appendChild(dimNote);

    // Loss function display
    var lossFnBox = document.createElement("div");
    lossFnBox.style.cssText = "background:#313244;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:inline-block;";
    lossFnBox.innerHTML = "<span style='color:#a6adc8;font-size:12px;'>" + t.lossFnLabel + "</span><br>" +
      "<span style='font-size:15px;'>" + renderMath("f(x, y) = x^2 + 10y^2") + "</span>" +
      "<br><span style='color:#888;font-size:11px;'>" + t.xIsParam + " &nbsp;|&nbsp; " + t.goalExplain + "</span>";
    modal.appendChild(lossFnBox);

    // ─── Demo parameter controls ───
    var demoH = document.createElement("h4");
    demoH.textContent = t.demoParamsTitle;
    demoH.style.cssText = "color:#94e2d5;margin:16px 0 10px 0;font-size:14px;";
    modal.appendChild(demoH);

    var demoGrid = document.createElement("div");
    demoGrid.id = "optimizer-info-demo-params";
    demoGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));" +
      "gap:8px;margin-bottom:14px;";

    var demoInputs = {};
    for (var dpName in info.params) {
      if (!info.params.hasOwnProperty(dpName)) continue;
      var meta = info.params[dpName];

      var demoCard = document.createElement("div");
      demoCard.style.cssText = "background:#45475a;border-radius:8px;padding:8px 10px;";

      var demoLabel = document.createElement("label");
      demoLabel.style.cssText = "font-size:11px;color:#bac2de;display:block;margin-bottom:3px;";
      demoLabel.textContent = dpName + " [" + meta.min + " – " + meta.max + "]";
      demoCard.appendChild(demoLabel);

      var demoInput = document.createElement("input");
      demoInput.type = "text";
      demoInput.value = meta.default;
      demoInput.dataset.param = dpName;
      demoInput.dataset.min = meta.min;
      demoInput.dataset.max = meta.max;
      demoInput.style.cssText = "width:100%;background:#313244;border:1px solid #585b70;" +
        "border-radius:6px;color:#cdd6f4;padding:5px 8px;font-size:13px;box-sizing:border-box;" +
        "font-family:'Fira Code',monospace;";
      demoCard.appendChild(demoInput);

      // Validation error display
      var errSpan = document.createElement("span");
      errSpan.style.cssText = "font-size:10px;color:#f38ba8;display:none;margin-top:3px;display:block;min-height:14px;";
      errSpan.className = "demo-param-error";
      demoCard.appendChild(errSpan);

      demoGrid.appendChild(demoCard);
      demoInputs[dpName] = { input: demoInput, error: errSpan, meta: meta };
    }
    modal.appendChild(demoGrid);

    // Start position + steps controls
    var controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;align-items:center;";

    controls.appendChild(_makeLabel(t.startLabel));
    var inputSX = _makeNumberInput(-3.5, -5, 5, 0.5, "opt-info-sx");
    controls.appendChild(inputSX);

    controls.appendChild(_makeLabel(t.startLabel2));
    var inputSY = _makeNumberInput(-1.5, -5, 5, 0.5, "opt-info-sy");
    controls.appendChild(inputSY);

    controls.appendChild(_makeLabel(t.stepsLabel));
    var inputSteps = _makeNumberInput(120, 10, 500, 10, "opt-info-steps");
    controls.appendChild(inputSteps);

    var runBtn = document.createElement("button");
    runBtn.textContent = t.runLabel;
    runBtn.style.cssText = "background:#a6e3a1;color:#1e1e2e;border:none;border-radius:8px;" +
      "padding:8px 20px;font-weight:bold;cursor:pointer;font-size:14px;transition:transform 0.15s;";
    runBtn.onmouseenter = function () { runBtn.style.transform = "scale(1.05)"; };
    runBtn.onmouseleave = function () { runBtn.style.transform = "scale(1)"; };
    controls.appendChild(runBtn);

    var resetCamBtn = document.createElement("button");
    resetCamBtn.textContent = t.resetCamLabel;
    resetCamBtn.style.cssText = "background:#45475a;color:#cdd6f4;border:1px solid #585b70;" +
      "border-radius:8px;padding:8px 14px;cursor:pointer;font-size:12px;";
    controls.appendChild(resetCamBtn);

    modal.appendChild(controls);

    // Validation message area
    var validationMsg = document.createElement("div");
    validationMsg.id = "optimizer-info-validation";
    validationMsg.style.cssText = "font-size:12px;color:#f38ba8;margin-bottom:8px;min-height:16px;";
    modal.appendChild(validationMsg);

    // Status line
    var statusLine = document.createElement("div");
    statusLine.id = "optimizer-info-status";
    statusLine.style.cssText = "font-size:13px;color:#a6adc8;margin-bottom:10px;min-height:20px;";
    statusLine.textContent = t.waitLabel;
    modal.appendChild(statusLine);

    // Plot container
    var plotDiv = document.createElement("div");
    plotDiv.id = _PLOT_ID;
    plotDiv.style.cssText = "width:100%;height:520px;border-radius:12px;overflow:hidden;" +
      "background:#0d0d1a;contain:strict;";
    modal.appendChild(plotDiv);

    // Assemble
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) removePopup();
    });
    document.addEventListener("keydown", _escHandler);

    // Reset camera
    resetCamBtn.onclick = function () {
      _state.lastCamera = null;
      if (_state.path) {
        _state.plotlyReady = false; // Force newPlot for camera reset
        var pd = document.getElementById(_PLOT_ID);
        if (pd) renderPlotly3D(pd, _state.path, optimizerName, _state.animationFrame);
      }
    };

    // Run logic with validation
    function doRun() {
      var validationEl = document.getElementById("optimizer-info-validation");
      if (validationEl) validationEl.textContent = "";

      // Validate and collect demo params
      var params = {};
      var hasError = false;
      for (var pn in demoInputs) {
        if (!demoInputs.hasOwnProperty(pn)) continue;
        var di = demoInputs[pn];
        var raw = di.input.value.trim();
        var errMsg = validateParam(pn, raw, di.meta);
        if (errMsg) {
          di.error.textContent = errMsg;
          di.error.style.display = "block";
          di.input.style.borderColor = "#f38ba8";
          hasError = true;
        } else {
          di.error.textContent = "";
          di.error.style.display = "block";
          di.input.style.borderColor = "#585b70";
          params[pn] = parseFloat(raw);
        }
      }

      if (hasError) {
        if (validationEl) {
          validationEl.textContent = L() === "de"
            ? "⚠️ Bitte korrigiere die rot markierten Parameter oben."
            : "⚠️ Please fix the red-highlighted parameters above.";
        }
        return;
      }

      // Validate start position
      var sx = parseFloat(inputSX.value);
      var sy = parseFloat(inputSY.value);
      var steps = parseInt(inputSteps.value);

      if (isNaN(sx) || sx < -5 || sx > 5) {
        if (validationEl) validationEl.textContent = (L() === "de" ? "Start X ungültig (muss zwischen -5 und 5 sein)" : "Start X invalid (must be between -5 and 5)");
        return;
      }
      if (isNaN(sy) || sy < -5 || sy > 5) {
        if (validationEl) validationEl.textContent = (L() === "de" ? "Start Y ungültig (muss zwischen -5 und 5 sein)" : "Start Y invalid (must be between -5 and 5)");
        return;
      }
      if (isNaN(steps) || steps < 5 || steps > 500) {
        if (validationEl) validationEl.textContent = (L() === "de" ? "Schritte ungültig (5–500)" : "Steps invalid (5–500)");
        return;
      }

      var path = runSimulation(optimizerName, params, sx, sy, steps);
      var pd = document.getElementById(_PLOT_ID);
      if (pd) {
        startAnimation(pd, path, optimizerName);
      }
    }

    runBtn.onclick = doRun;

    // Auto-run on open
    setTimeout(doRun, 200);
  }

  // ─── HELPER: Get math context for a parameter ─────────────────────────────
  function _getParamMathContext(optimizerName, paramName) {
    var map = {
      adam: {
        learning_rate: "\\alpha",
        beta1: "\\beta_1",
        beta2: "\\beta_2",
        epsilon: "\\varepsilon"
      },
      sgd: {
        learning_rate: "\\alpha",
        momentum: "\\mu"
      },
      rmsprop: {
        learning_rate: "\\alpha",
        rho: "\\rho",
        momentum: "\\mu",
        epsilon: "\\varepsilon"
      },
      adagrad: {
        learning_rate: "\\alpha",
        epsilon: "\\varepsilon",
        initial_accumulator_value: "G_0"
      },
      adadelta: {
        learning_rate: "\\alpha",
        rho: "\\rho",
        epsilon: "\\varepsilon"
      },
      adamax: {
        learning_rate: "\\alpha",
        beta1: "\\beta_1",
        beta2: "\\beta_2",
        epsilon: "\\varepsilon",
        decay: "d"
      }
    };
    if (map[optimizerName] && map[optimizerName][paramName]) {
      return map[optimizerName][paramName];
    }
    return null;
  }

  // ─── HELPER: Create label ─────────────────────────────────────────────────
  function _makeLabel(text) {
    var lbl = document.createElement("span");
    lbl.textContent = text;
    lbl.style.cssText = "font-size:12px;color:#bac2de;";
    return lbl;
  }

  // ─── HELPER: Create number input ─────────────────────────────────────────
  function _makeNumberInput(val, min, max, step, id) {
    var inp = document.createElement("input");
    inp.type = "number";
    inp.value = val;
    inp.min = min;
    inp.max = max;
    inp.step = step;
    inp.id = id;
    inp.style.cssText = "width:62px;background:#45475a;border:1px solid #585b70;" +
      "border-radius:6px;color:#cdd6f4;padding:5px 8px;font-size:12px;";
    return inp;
  }

  // ─── POPUP MANAGEMENT ─────────────────────────────────────────────────────
  function removePopup() {
    stopAnimation();
    var overlay = document.getElementById(_POPUP_ID);
    if (overlay) {
      var pd = document.getElementById(_PLOT_ID);
      if (pd && typeof Plotly !== "undefined") {
        try { Plotly.purge(pd); } catch (e) {}
      }
      overlay.remove();
    }
    _state.plotlyReady = false;
    _state.lastCamera = null;
    _state.path = null;
    _state.userInteracting = false;
    _state.currentOptimizer = null;
    _clearInteractionTimeout();
    document.removeEventListener("keydown", _escHandler);
  }

  function _escHandler(e) {
    if (e.key === "Escape") removePopup();
  }

  // ─── INJECT INFO ICON ─────────────────────────────────────────────────────
  function injectIcon() {
    var select = document.getElementById("optimizer");
    if (!select) return;
    if (document.getElementById("optimizer-info-btn")) return;

    var btn = document.createElement("img");
    btn.id = "optimizer-info-btn";
    btn.src = "_gui/icons/info.svg";
    btn.alt = "?";
    btn.style.cssText = "height:24px;width:auto;cursor:pointer;margin-left:8px;" +
      "vertical-align:middle;transition:transform 0.2s;display:inline-block;";
    btn.title = (L() === "de") ? "Was macht dieser Optimierer?" : "What does this optimizer do?";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.2) rotate(8deg)"; };
    btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };
    btn.onclick = function () { buildPopup(select.value); };

    select.parentNode.insertBefore(btn, select.nextSibling);
  }

  // ─── WATCH FOR OPTIMIZER CHANGES ──────────────────────────────────────────
  function watchOptimizer() {
    var select = document.getElementById("optimizer");
    if (!select) return;

    select.addEventListener("change", function () {
      if (document.getElementById(_POPUP_ID)) {
        buildPopup(select.value);
      }
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        injectIcon();
        watchOptimizer();
      });
    } else {
      injectIcon();
      watchOptimizer();
    }
  }

  init();

})();
