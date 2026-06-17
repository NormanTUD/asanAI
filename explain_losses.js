(function() {
  // ============================================================
  // LOSS & METRIC EXPLAINER - Self-contained module
  // ============================================================

  const HELP_ICON_PATH = '_gui/icons/help_icon.svg';

  // ============================================================
  // CONTENT DATABASE (EN/DE)
  // ============================================================
  const content = {
    losses: {
      meanSquaredError: {
        en: {
          name: "Mean Squared Error (MSE)",
          short: "Measures the average of squared differences between predicted and actual values.",
          when: "Use for regression tasks where you want to predict continuous numbers (e.g., house prices, temperatures).",
          intuition: "Imagine throwing darts at a target. MSE measures how far off your darts are, but it punishes big misses WAY more than small ones (because of squaring). A miss of 2 is punished 4x, a miss of 3 is punished 9x!",
          formula: "\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => x * x,
            xRange: [-3, 3],
            title: "MSE: How error grows with distance",
            xLabel: "Prediction Error (y - ŷ)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Mittlerer Quadratischer Fehler (MSE)",
          short: "Misst den Durchschnitt der quadrierten Differenzen zwischen vorhergesagten und tatsächlichen Werten.",
          when: "Verwende es für Regressionsaufgaben, bei denen du kontinuierliche Zahlen vorhersagen möchtest (z.B. Hauspreise, Temperaturen).",
          intuition: "Stell dir vor, du wirfst Dartpfeile auf eine Zielscheibe. MSE misst, wie weit deine Pfeile daneben liegen, aber es bestraft große Fehler VIEL mehr als kleine (wegen des Quadrierens). Ein Fehler von 2 wird 4x bestraft, ein Fehler von 3 wird 9x bestraft!",
          formula: "\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => x * x,
            xRange: [-3, 3],
            title: "MSE: Wie der Fehler mit der Distanz wächst",
            xLabel: "Vorhersagefehler (y - ŷ)",
            yLabel: "Verlust"
          }
        }
      },
      binaryCrossentropy: {
        en: {
          name: "Binary Cross-Entropy",
          short: "Measures how well predicted probabilities match actual binary labels (0 or 1).",
          when: "Use for binary classification: yes/no, cat/dog, spam/not-spam. Your output should be a single probability between 0 and 1.",
          intuition: "Think of it like a confidence penalty. If you say 'I'm 99% sure it's a cat' and it IS a cat, tiny penalty. But if you say '99% sure it's a cat' and it's actually a dog? HUGE penalty! It really punishes overconfident wrong answers.",
          formula: "\\text{BCE} = -\\frac{1}{n}\\sum_{i=1}^{n}[y_i \\log(\\hat{y}_i) + (1-y_i)\\log(1-\\hat{y}_i)]",
          plotType: "bce_curve",
          plotConfig: {
            title: "Binary Cross-Entropy: Penalty for wrong confidence",
            xLabel: "Predicted Probability",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Binäre Kreuzentropie",
          short: "Misst, wie gut vorhergesagte Wahrscheinlichkeiten mit tatsächlichen binären Labels (0 oder 1) übereinstimmen.",
          when: "Verwende es für binäre Klassifikation: ja/nein, Katze/Hund, Spam/kein Spam. Dein Output sollte eine einzelne Wahrscheinlichkeit zwischen 0 und 1 sein.",
          intuition: "Denk daran wie eine Vertrauensstrafe. Wenn du sagst 'Ich bin 99% sicher, es ist eine Katze' und es IST eine Katze, winzige Strafe. Aber wenn du sagst '99% sicher es ist eine Katze' und es ist tatsächlich ein Hund? RIESIGE Strafe! Es bestraft übermäßig selbstsichere falsche Antworten.",
          formula: "\\text{BCE} = -\\frac{1}{n}\\sum_{i=1}^{n}[y_i \\log(\\hat{y}_i) + (1-y_i)\\log(1-\\hat{y}_i)]",
          plotType: "bce_curve",
          plotConfig: {
            title: "Binäre Kreuzentropie: Strafe für falsches Vertrauen",
            xLabel: "Vorhergesagte Wahrscheinlichkeit",
            yLabel: "Verlust"
          }
        }
      },
      categoricalCrossentropy: {
        en: {
          name: "Categorical Cross-Entropy",
          short: "Measures how well predicted class probabilities match one-hot encoded true labels.",
          when: "Use for multi-class classification with one-hot encoded labels (e.g., classifying images into 10 categories). Each sample belongs to exactly ONE class.",
          intuition: "Like binary cross-entropy but for multiple choices. Imagine a multiple-choice test where you assign confidence to each answer. If the right answer is C and you put 90% on C, small penalty. But if you put 90% on A when C was correct? Big penalty!",
          formula: "\\text{CCE} = -\\sum_{i=1}^{C} y_i \\log(\\hat{y}_i)",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Categorical Cross-Entropy: Multi-class confidence",
            xLabel: "Confidence on correct class",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Kategorische Kreuzentropie",
          short: "Misst, wie gut vorhergesagte Klassenwahrscheinlichkeiten mit One-Hot-kodierten wahren Labels übereinstimmen.",
          when: "Verwende es für Mehrklassen-Klassifikation mit One-Hot-kodierten Labels (z.B. Bilder in 10 Kategorien klassifizieren). Jede Probe gehört zu genau EINER Klasse.",
          intuition: "Wie binäre Kreuzentropie, aber für mehrere Auswahlmöglichkeiten. Stell dir einen Multiple-Choice-Test vor, bei dem du jeder Antwort Vertrauen zuweist. Wenn die richtige Antwort C ist und du 90% auf C setzt, kleine Strafe. Aber wenn du 90% auf A setzt, obwohl C richtig war? Große Strafe!",
          formula: "\\text{CCE} = -\\sum_{i=1}^{C} y_i \\log(\\hat{y}_i)",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Kategorische Kreuzentropie: Mehrklassen-Vertrauen",
            xLabel: "Vertrauen in die richtige Klasse",
            yLabel: "Verlust"
          }
        }
      },
      categoricalHinge: {
        en: {
          name: "Categorical Hinge",
          short: "Measures the margin between the correct class score and the highest incorrect class score.",
          when: "Use for multi-class classification when you want SVM-style margin-based learning. Good when you care about the decision boundary being clear.",
          intuition: "Imagine a race. The correct answer needs to be winning by at least 1 point. If it's winning by more than 1, no penalty. If it's winning by less than 1 or losing, penalty increases! It only cares about the gap between winner and runner-up.",
          formula: "\\text{CatHinge} = \\max(0, 1 - y_{\\text{pos}} + y_{\\text{neg\\_max}})",
          plotType: "hinge_curve",
          plotConfig: {
            title: "Categorical Hinge: Margin-based loss",
            xLabel: "Margin (correct score - max incorrect score)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Kategorischer Hinge",
          short: "Misst den Abstand zwischen dem Score der richtigen Klasse und dem höchsten Score einer falschen Klasse.",
          when: "Verwende es für Mehrklassen-Klassifikation, wenn du SVM-artiges margin-basiertes Lernen möchtest. Gut, wenn dir eine klare Entscheidungsgrenze wichtig ist.",
          intuition: "Stell dir ein Rennen vor. Die richtige Antwort muss mit mindestens 1 Punkt führen. Wenn sie mit mehr als 1 führt, keine Strafe. Wenn sie mit weniger als 1 führt oder verliert, steigt die Strafe! Es kümmert sich nur um den Abstand zwischen Gewinner und Zweitplatziertem.",
          formula: "\\text{CatHinge} = \\max(0, 1 - y_{\\text{pos}} + y_{\\text{neg\\_max}})",
          plotType: "hinge_curve",
          plotConfig: {
            title: "Kategorischer Hinge: Margin-basierter Verlust",
            xLabel: "Margin (richtiger Score - max falscher Score)",
            yLabel: "Verlust"
          }
        }
      },
      hinge: {
        en: {
          name: "Hinge Loss",
          short: "Measures the margin for binary classification with labels -1 and +1.",
          when: "Use for binary classification (SVM-style). Labels should be -1 or +1. Good when you want a clear margin between classes.",
          intuition: "Like categorical hinge but for just two classes. The model needs to not just be right, but be right by a margin of at least 1. Think of it like a high jump bar - clearing it by a millimeter or a meter both count as success, but not clearing it gets penalized proportionally.",
          formula: "\\text{Hinge} = \\max(0, 1 - y \\cdot \\hat{y})",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.max(0, 1 - x),
            xRange: [-2, 3],
            title: "Hinge Loss: Margin requirement",
            xLabel: "y · ŷ (agreement between true and predicted)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Hinge-Verlust",
          short: "Misst den Margin für binäre Klassifikation mit Labels -1 und +1.",
          when: "Verwende es für binäre Klassifikation (SVM-Stil). Labels sollten -1 oder +1 sein. Gut, wenn du einen klaren Abstand zwischen Klassen möchtest.",
          intuition: "Wie kategorischer Hinge, aber nur für zwei Klassen. Das Modell muss nicht nur richtig liegen, sondern mit einem Abstand von mindestens 1 richtig liegen. Denk an eine Hochsprungstange - sie um einen Millimeter oder einen Meter zu überqueren zählt beides als Erfolg, aber sie nicht zu überqueren wird proportional bestraft.",
          formula: "\\text{Hinge} = \\max(0, 1 - y \\cdot \\hat{y})",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.max(0, 1 - x),
            xRange: [-2, 3],
            title: "Hinge-Verlust: Margin-Anforderung",
            xLabel: "y · ŷ (Übereinstimmung zwischen wahr und vorhergesagt)",
            yLabel: "Verlust"
          }
        }
      },
      meanAbsoluteError: {
        en: {
          name: "Mean Absolute Error (MAE)",
          short: "Measures the average of absolute differences between predicted and actual values.",
          when: "Use for regression when you want to be robust to outliers. Unlike MSE, it doesn't square errors, so big mistakes aren't punished as harshly.",
          intuition: "Back to the dart analogy: MAE just measures how far off each dart is, plain and simple. Miss by 2? Penalty of 2. Miss by 10? Penalty of 10. No squaring, no extra punishment for big misses. This makes it more forgiving of occasional wild throws.",
          formula: "\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n}|y_i - \\hat{y}_i|",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.abs(x),
            xRange: [-3, 3],
            title: "MAE vs MSE: Linear vs Quadratic penalty",
            xLabel: "Prediction Error (y - ŷ)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Mittlerer Absoluter Fehler (MAE)",
          short: "Misst den Durchschnitt der absoluten Differenzen zwischen vorhergesagten und tatsächlichen Werten.",
          when: "Verwende es für Regression, wenn du robust gegenüber Ausreißern sein möchtest. Anders als MSE quadriert es Fehler nicht, sodass große Fehler nicht so hart bestraft werden.",
          intuition: "Zurück zur Dart-Analogie: MAE misst einfach, wie weit jeder Dart daneben liegt, schlicht und einfach. Daneben um 2? Strafe von 2. Daneben um 10? Strafe von 10. Kein Quadrieren, keine extra Bestrafung für große Fehler. Das macht es nachsichtiger bei gelegentlichen wilden Würfen.",
          formula: "\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n}|y_i - \\hat{y}_i|",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.abs(x),
            xRange: [-3, 3],
            title: "MAE vs MSE: Lineare vs Quadratische Strafe",
            xLabel: "Vorhersagefehler (y - ŷ)",
            yLabel: "Verlust"
          }
        }
      },
      meanAbsolutePercentageError: {
        en: {
          name: "Mean Absolute Percentage Error (MAPE)",
          short: "Measures the average percentage difference between predicted and actual values.",
          when: "Use when you care about relative errors rather than absolute ones. Good when your target values vary widely in scale (e.g., predicting sales for both small and large stores).",
          intuition: "Imagine predicting how many candies are in jars. If a jar has 100 candies and you guess 110, that's 10% off. If a jar has 10 candies and you guess 11, that's also 10% off. MAPE treats both equally! It cares about the PERCENTAGE you're wrong, not the raw number.",
          formula: "\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right|",
          plotType: "mape_demo",
          plotConfig: {
            title: "MAPE: Relative error matters",
            xLabel: "Actual Value",
            yLabel: "Loss for same absolute error"
          }
        },
        de: {
          name: "Mittlerer Absoluter Prozentualer Fehler (MAPE)",
          short: "Misst die durchschnittliche prozentuale Differenz zwischen vorhergesagten und tatsächlichen Werten.",
          when: "Verwende es, wenn dir relative Fehler wichtiger sind als absolute. Gut, wenn deine Zielwerte stark in der Größenordnung variieren (z.B. Verkäufe für kleine und große Geschäfte vorhersagen).",
          intuition: "Stell dir vor, du sagst vorher, wie viele Bonbons in Gläsern sind. Wenn ein Glas 100 Bonbons hat und du 110 rätst, sind das 10% daneben. Wenn ein Glas 10 Bonbons hat und du 11 rätst, sind das auch 10% daneben. MAPE behandelt beide gleich! Es kümmert sich um den PROZENTSATZ, um den du falsch liegst, nicht die rohe Zahl.",
          formula: "\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right|",
          plotType: "mape_demo",
          plotConfig: {
            title: "MAPE: Relativer Fehler zählt",
            xLabel: "Tatsächlicher Wert",
            yLabel: "Verlust für gleichen absoluten Fehler"
          }
        }
      },
      meanSquaredLogarithmicError: {
        en: {
          name: "Mean Squared Logarithmic Error (MSLE)",
          short: "Measures the squared difference between the log of predicted and actual values.",
          when: "Use when you care about relative differences and your targets span several orders of magnitude. Also good when you don't want to penalize over-predictions as much as under-predictions.",
          intuition: "Imagine predicting population sizes. A city of 1 million vs your prediction of 1.1 million (10% off) should be treated similarly to a town of 1,000 vs your prediction of 1,100 (also 10% off). MSLE does this by taking the log first, which 'compresses' big numbers.",
          formula: "\\text{MSLE} = \\frac{1}{n}\\sum_{i=1}^{n}(\\log(1+y_i) - \\log(1+\\hat{y}_i))^2",
          plotType: "msle_demo",
          plotConfig: {
            title: "MSLE: Log-space comparison",
            xLabel: "Predicted Value",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Mittlerer Quadratischer Logarithmischer Fehler (MSLE)",
          short: "Misst die quadrierte Differenz zwischen dem Logarithmus der vorhergesagten und tatsächlichen Werte.",
          when: "Verwende es, wenn dir relative Unterschiede wichtig sind und deine Zielwerte mehrere Größenordnungen umfassen. Auch gut, wenn du Über-Vorhersagen nicht so stark bestrafen möchtest wie Unter-Vorhersagen.",
          intuition: "Stell dir vor, du sagst Bevölkerungsgrößen vorher. Eine Stadt mit 1 Million vs. deine Vorhersage von 1,1 Millionen (10% daneben) sollte ähnlich behandelt werden wie eine Stadt mit 1.000 vs. deine Vorhersage von 1.100 (auch 10% daneben). MSLE macht das, indem es zuerst den Logarithmus nimmt, der große Zahlen 'komprimiert'.",
          formula: "\\text{MSLE} = \\frac{1}{n}\\sum_{i=1}^{n}(\\log(1+y_i) - \\log(1+\\hat{y}_i))^2",
          plotType: "msle_demo",
          plotConfig: {
            title: "MSLE: Log-Raum Vergleich",
            xLabel: "Vorhergesagter Wert",
            yLabel: "Verlust"
          }
        }
      },
      poisson: {
        en: {
          name: "Poisson Loss",
          short: "Measures the loss for count data following a Poisson distribution.",
          when: "Use when predicting counts or rates (e.g., number of customers per hour, number of defects in manufacturing). Your predictions should be positive.",
          intuition: "Imagine counting how many birds visit a feeder each hour. The Poisson loss is designed for this kind of 'counting' data. It knows that predicting 0 when the answer is 5 is worse than predicting 4 when the answer is 5, and it handles this asymmetry naturally.",
          formula: "\\text{Poisson} = \\frac{1}{n}\\sum_{i=1}^{n}(\\hat{y}_i - y_i \\cdot \\log(\\hat{y}_i))",
          plotType: "poisson_demo",
          plotConfig: {
            title: "Poisson Loss: For count data",
            xLabel: "Predicted count",
            yLabel: "Loss (true count = 5)"
          }
        },
        de: {
          name: "Poisson-Verlust",
          short: "Misst den Verlust für Zähldaten, die einer Poisson-Verteilung folgen.",
          when: "Verwende es, wenn du Zählungen oder Raten vorhersagst (z.B. Anzahl Kunden pro Stunde, Anzahl Defekte in der Fertigung). Deine Vorhersagen sollten positiv sein.",
          intuition: "Stell dir vor, du zählst, wie viele Vögel pro Stunde einen Futterplatz besuchen. Der Poisson-Verlust ist für diese Art von 'Zähl'-Daten konzipiert. Er weiß, dass 0 vorherzusagen, wenn die Antwort 5 ist, schlimmer ist als 4 vorherzusagen, wenn die Antwort 5 ist, und er behandelt diese Asymmetrie natürlich.",
          formula: "\\text{Poisson} = \\frac{1}{n}\\sum_{i=1}^{n}(\\hat{y}_i - y_i \\cdot \\log(\\hat{y}_i))",
          plotType: "poisson_demo",
          plotConfig: {
            title: "Poisson-Verlust: Für Zähldaten",
            xLabel: "Vorhergesagte Anzahl",
            yLabel: "Verlust (wahre Anzahl = 5)"
          }
        }
      },
      sparseCategoricalCrossentropy: {
        en: {
          name: "Sparse Categorical Cross-Entropy",
          short: "Same as categorical cross-entropy, but labels are integers instead of one-hot vectors.",
          when: "Use for multi-class classification when your labels are integers (0, 1, 2, ...) instead of one-hot encoded. Mathematically identical to categoricalCrossentropy, just a different label format!",
          intuition: "Exactly the same as categorical cross-entropy in how it works! The only difference is convenience: instead of saying the label is [0, 0, 1, 0, 0] (one-hot), you just say it's class 2. Same math, less memory for labels.",
          formula: "\\text{SparseCCE} = -\\log(\\hat{y}_{\\text{true\\_class}})",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Sparse Cat. Cross-Entropy: Same as CCE, different label format",
            xLabel: "Confidence on correct class",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Sparse Kategorische Kreuzentropie",
          short: "Gleich wie kategorische Kreuzentropie, aber Labels sind Ganzzahlen statt One-Hot-Vektoren.",
          when: "Verwende es für Mehrklassen-Klassifikation, wenn deine Labels Ganzzahlen sind (0, 1, 2, ...) statt One-Hot-kodiert. Mathematisch identisch zu categoricalCrossentropy, nur ein anderes Label-Format!",
          intuition: "Funktioniert genau gleich wie kategorische Kreuzentropie! Der einzige Unterschied ist Bequemlichkeit: statt zu sagen, das Label ist [0, 0, 1, 0, 0] (One-Hot), sagst du einfach, es ist Klasse 2. Gleiche Mathematik, weniger Speicher für Labels.",
          formula: "\\text{SparseCCE} = -\\log(\\hat{y}_{\\text{true\\_class}})",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Sparse Kat. Kreuzentropie: Gleich wie CCE, anderes Label-Format",
            xLabel: "Vertrauen in die richtige Klasse",
            yLabel: "Verlust"
          }
        }
      },
      squaredHinge: {
        en: {
          name: "Squared Hinge Loss",
          short: "Like hinge loss but squared, making it smoother and more sensitive to margin violations.",
          when: "Use when you want SVM-style classification but with a smoother, differentiable loss. Penalizes margin violations more aggressively than regular hinge.",
          intuition: "Same as hinge loss, but the penalty is squared. So if you're inside the margin by a little, small penalty. But if you're way inside the margin (very wrong), the penalty grows much faster than regular hinge. It's like hinge loss on steroids!",
          formula: "\\text{SquaredHinge} = \\max(0, 1 - y \\cdot \\hat{y})^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.pow(Math.max(0, 1 - x), 2),
            xRange: [-2, 3],
            title: "Squared Hinge vs Hinge: Stronger penalty",
            xLabel: "y · ŷ (agreement)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Quadrierter Hinge-Verlust",
          short: "Wie Hinge-Verlust, aber quadriert, was ihn glatter und empfindlicher gegenüber Margin-Verletzungen macht.",
          when: "Verwende es, wenn du SVM-artige Klassifikation möchtest, aber mit einem glatteren, differenzierbaren Verlust. Bestraft Margin-Verletzungen aggressiver als normaler Hinge.",
          intuition: "Gleich wie Hinge-Verlust, aber die Strafe ist quadriert. Wenn du ein bisschen innerhalb des Margins bist, kleine Strafe. Aber wenn du weit innerhalb des Margins bist (sehr falsch), wächst die Strafe viel schneller als bei normalem Hinge. Es ist wie Hinge-Verlust auf Steroiden!",
          formula: "\\text{SquaredHinge} = \\max(0, 1 - y \\cdot \\hat{y})^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.pow(Math.max(0, 1 - x), 2),
            xRange: [-2, 3],
            title: "Quadrierter Hinge vs Hinge: Stärkere Strafe",
            xLabel: "y · ŷ (Übereinstimmung)",
            yLabel: "Verlust"
          }
        }
      },
      kullbackLeiblerDivergence: {
        en: {
          name: "Kullback-Leibler Divergence (KL Divergence)",
          short: "Measures how one probability distribution differs from a reference distribution.",
          when: "Use when comparing probability distributions (e.g., in VAEs, knowledge distillation, or when your target is a soft probability distribution rather than hard labels).",
          intuition: "Imagine two weather forecasters. One says: 'Tomorrow: 70% sun, 20% clouds, 10% rain.' The other says: '50% sun, 30% clouds, 20% rain.' KL Divergence measures how 'surprised' you'd be if you believed forecaster 1 but reality followed forecaster 2's distribution.",
          formula: "\\text{KL}(P \\| Q) = \\sum_{i} P(i) \\log\\frac{P(i)}{Q(i)}",
          plotType: "kl_demo",
          plotConfig: {
            title: "KL Divergence: Distribution comparison",
            xLabel: "Distribution shape",
            yLabel: "Probability"
          }
        },
        de: {
          name: "Kullback-Leibler-Divergenz (KL-Divergenz)",
          short: "Misst, wie sich eine Wahrscheinlichkeitsverteilung von einer Referenzverteilung unterscheidet.",
          when: "Verwende es beim Vergleichen von Wahrscheinlichkeitsverteilungen (z.B. in VAEs, Wissensdestillation, oder wenn dein Ziel eine weiche Wahrscheinlichkeitsverteilung statt harter Labels ist).",
          intuition: "Stell dir zwei Wettervorhersager vor. Einer sagt: 'Morgen: 70% Sonne, 20% Wolken, 10% Regen.' Der andere sagt: '50% Sonne, 30% Wolken, 20% Regen.' KL-Divergenz misst, wie 'überrascht' du wärst, wenn du Vorhersager 1 glaubst, aber die Realität der Verteilung von Vorhersager 2 folgt.",
          formula: "\\text{KL}(P \\| Q) = \\sum_{i} P(i) \\log\\frac{P(i)}{Q(i)}",
          plotType: "kl_demo",
          plotConfig: {
            title: "KL-Divergenz: Verteilungsvergleich",
            xLabel: "Verteilungsform",
            yLabel: "Wahrscheinlichkeit"
          }
        }
      },
      logcosh: {
        en: {
          name: "Log-Cosh Loss",
          short: "Logarithm of the hyperbolic cosine of the error. Smooth approximation of MAE.",
          when: "Use for regression when you want something between MSE and MAE. It's smooth like MSE for small errors but linear like MAE for large errors. Best of both worlds!",
          intuition: "Imagine a hybrid between MSE and MAE. For small mistakes, it behaves like MSE (smooth, easy to optimize). For big mistakes, it behaves like MAE (doesn't explode). It's like a car with smooth acceleration at low speeds but a speed limiter at high speeds.",
          formula: "\\text{LogCosh} = \\frac{1}{n}\\sum_{i=1}^{n}\\log(\\cosh(y_i - \\hat{y}_i))",
          plotType: "logcosh_curve",
          plotConfig: {
            fn: (x) => Math.log(Math.cosh(x)),
            xRange: [-4, 4],
            title: "Log-Cosh: Best of MSE and MAE",
            xLabel: "Prediction Error (y - ŷ)",
            yLabel: "Loss"
          }
        },
        de: {
          name: "Log-Cosh Verlust",
          short: "Logarithmus des hyperbolischen Kosinus des Fehlers. Glatte Annäherung an MAE.",
          when: "Verwende es für Regression, wenn du etwas zwischen MSE und MAE möchtest. Es ist glatt wie MSE für kleine Fehler, aber linear wie MAE für große Fehler. Das Beste aus beiden Welten!",
          intuition: "Stell dir eine Mischung aus MSE und MAE vor. Für kleine Fehler verhält es sich wie MSE (glatt, leicht zu optimieren). Für große Fehler verhält es sich wie MAE (explodiert nicht). Es ist wie ein Auto mit sanfter Beschleunigung bei niedrigen Geschwindigkeiten, aber einem Geschwindigkeitsbegrenzer bei hohen Geschwindigkeiten.",
          formula: "\\text{LogCosh} = \\frac{1}{n}\\sum_{i=1}^{n}\\log(\\cosh(y_i - \\hat{y}_i))",
          plotType: "logcosh_curve",
          plotConfig: {
            fn: (x) => Math.log(Math.cosh(x)),
            xRange: [-4, 4],
            title: "Log-Cosh: Das Beste aus MSE und MAE",
            xLabel: "Vorhersagefehler (y - ŷ)",
            yLabel: "Verlust"
          }
        }
      }
    },
    metrics: {
      binaryAccuracy: {
        en: {
          name: "Binary Accuracy",
          short: "Percentage of correct predictions for binary classification (threshold at 0.5).",
          when: "Use when you have two classes and want a simple 'how often am I right?' measure.",
          intuition: "Simple as it gets: if your prediction is > 0.5, you predicted 'yes'. If it's ≤ 0.5, you predicted 'no'. Binary accuracy just counts what percentage you got right. Like grading a true/false test!",
          formula: "\\text{Accuracy} = \\frac{\\text{Correct Predictions}}{\\text{Total Predictions}}",
          plotType: "accuracy_demo",
          plotConfig: {
            title: "Binary Accuracy: Threshold at 0.5",
            xLabel: "Predicted Probability",
            yLabel: "Classification"
          }
        },
        de: {
          name: "Binäre Genauigkeit",
          short: "Prozentsatz korrekter Vorhersagen für binäre Klassifikation (Schwellenwert bei 0,5).",
          when: "Verwende es, wenn du zwei Klassen hast und ein einfaches 'wie oft liege ich richtig?' Maß möchtest.",
          intuition: "So einfach wie möglich: wenn deine Vorhersage > 0,5 ist, hast du 'ja' vorhergesagt. Wenn sie ≤ 0,5 ist, hast du 'nein' vorhergesagt. Binäre Genauigkeit zählt einfach, welchen Prozentsatz du richtig hattest. Wie die Bewertung eines Wahr/Falsch-Tests!",
          formula: "\\text{Genauigkeit} = \\frac{\\text{Korrekte Vorhersagen}}{\\text{Gesamte Vorhersagen}}",
          plotType: "accuracy_demo",
          plotConfig: {
            title: "Binäre Genauigkeit: Schwellenwert bei 0,5",
            xLabel: "Vorhergesagte Wahrscheinlichkeit",
            yLabel: "Klassifikation"
          }
        }
      },
      categoricalAccuracy: {
        en: {
          name: "Categorical Accuracy",
          short: "Percentage of samples where the predicted class matches the true class.",
          when: "Use for multi-class classification to see how often the model picks the right category.",
          intuition: "Like a multiple-choice test grade. The model outputs probabilities for each class, and we check if the class with the highest probability is the correct one. Got it right? +1. Got it wrong? +0. Average them all up!",
          formula: "\\text{CatAcc} = \\frac{1}{n}\\sum_{i=1}^{n}\\mathbb{1}[\\arg\\max(\\hat{y}_i) = \\arg\\max(y_i)]",
          plotType: "cat_accuracy_demo",
          plotConfig: {
            title: "Categorical Accuracy: Pick the highest",
            xLabel: "Sample",
            yLabel: "Prediction"
          }
        },
        de: {
          name: "Kategorische Genauigkeit",
          short: "Prozentsatz der Proben, bei denen die vorhergesagte Klasse mit der wahren Klasse übereinstimmt.",
          when: "Verwende es für Mehrklassen-Klassifikation, um zu sehen, wie oft das Modell die richtige Kategorie wählt.",
          intuition: "Wie die Note eines Multiple-Choice-Tests. Das Modell gibt Wahrscheinlichkeiten für jede Klasse aus, und wir prüfen, ob die Klasse mit der höchsten Wahrscheinlichkeit die richtige ist. Richtig? +1. Falsch? +0. Alles ausmitteln!",
          formula: "\\text{KatGen} = \\frac{1}{n}\\sum_{i=1}^{n}\\mathbb{1}[\\arg\\max(\\hat{y}_i) = \\arg\\max(y_i)]",
          plotType: "cat_accuracy_demo",
          plotConfig: {
            title: "Kategorische Genauigkeit: Wähle die höchste",
            xLabel: "Probe",
            yLabel: "Vorhersage"
          }
        }
      },
      precision: {
        en: {
          name: "Precision",
          short: "Of all positive predictions, how many were actually positive?",
          when: "Use when false positives are costly (e.g., spam filter - you don't want to mark real emails as spam).",
          intuition: "Imagine a metal detector at the beach. Precision asks: 'Of all the times it beeped, how many times was there actually treasure?' If it beeps 10 times but only 3 times there's actual metal, precision is 30%. High precision = few false alarms!",
          formula: "\\text{Precision} = \\frac{\\text{True Positives}}{\\text{True Positives} + \\text{False Positives}}",
          plotType: "precision_recall_demo",
          plotConfig: {
            title: "Precision: Avoiding false alarms",
            xLabel: "Predictions",
            yLabel: "Count"
          }
        },
        de: {
          name: "Präzision",
          short: "Von allen positiven Vorhersagen, wie viele waren tatsächlich positiv?",
          when: "Verwende es, wenn falsch-positive Ergebnisse teuer sind (z.B. Spam-Filter - du willst echte E-Mails nicht als Spam markieren).",
          intuition: "Stell dir einen Metalldetektor am Strand vor. Präzision fragt: 'Von allen Malen, die er gepiept hat, wie oft war tatsächlich ein Schatz da?' Wenn er 10 Mal piept, aber nur 3 Mal tatsächlich Metall da ist, ist die Präzision 30%. Hohe Präzision = wenige Fehlalarme!",
          formula: "\\text{Präzision} = \\frac{\\text{Wahr Positive}}{\\text{Wahr Positive} + \\text{Falsch Positive}}",
          plotType: "precision_recall_demo",
          plotConfig: {
            title: "Präzision: Fehlalarme vermeiden",
            xLabel: "Vorhersagen",
            yLabel: "Anzahl"
          }
        }
      },
      categoricalCrossentropy: {
        en: {
          name: "Categorical Cross-Entropy (as metric)",
          short: "Same as the loss function, but tracked as a metric for monitoring.",
          when: "Use to monitor the actual cross-entropy value during training alongside accuracy.",
          intuition: "This is the same as the categorical cross-entropy loss, just displayed as a metric so you can watch it go down during training. Lower = better confidence on correct classes.",
          formula: "\\text{CCE} = -\\sum_{i=1}^{C} y_i \\log(\\hat{y}_i)",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Categorical Cross-Entropy as Metric",
            xLabel: "Confidence on correct class",
            yLabel: "Metric Value"
          }
        },
        de: {
          name: "Kategorische Kreuzentropie (als Metrik)",
          short: "Gleich wie die Verlustfunktion, aber als Metrik zur Überwachung verfolgt.",
          when: "Verwende es, um den tatsächlichen Kreuzentropie-Wert während des Trainings neben der Genauigkeit zu überwachen.",
          intuition: "Das ist dasselbe wie der kategorische Kreuzentropie-Verlust, nur als Metrik angezeigt, damit du beobachten kannst, wie er während des Trainings sinkt. Niedriger = besseres Vertrauen in die richtigen Klassen.",
          formula: "\\text{CCE} = -\\sum_{i=1}^{C} y_i \\log(\\hat{y}_i)",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Kategorische Kreuzentropie als Metrik",
            xLabel: "Vertrauen in die richtige Klasse",
            yLabel: "Metrikwert"
          }
        }
      },
      sparseCategoricalCrossentropy: {
        en: {
          name: "Sparse Categorical Cross-Entropy (as metric)",
          short: "Same as sparse categorical cross-entropy loss, tracked as a metric.",
          when: "Use to monitor cross-entropy when your labels are integers instead of one-hot vectors.",
          intuition: "Same as categorical cross-entropy metric, just accepts integer labels. Watch this number go down during training!",
          formula: "\\text{SparseCCE} = -\\log(\\hat{y}_{\\text{true\\_class}})",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Sparse Categorical Cross-Entropy as Metric",
            xLabel: "Confidence on correct class",
            yLabel: "Metric Value"
          }
        },
        de: {
          name: "Sparse Kategorische Kreuzentropie (als Metrik)",
          short: "Gleich wie Sparse Kategorische Kreuzentropie-Verlust, als Metrik verfolgt.",
          when: "Verwende es, um die Kreuzentropie zu überwachen, wenn deine Labels Ganzzahlen statt One-Hot-Vektoren sind.",
          intuition: "Gleich wie kategorische Kreuzentropie-Metrik, akzeptiert nur Ganzzahl-Labels. Beobachte, wie diese Zahl während des Trainings sinkt!",
          formula: "\\text{SparseCCE} = -\\log(\\hat{y}_{\\text{true\\_class}})",
          plotType: "categorical_demo",
          plotConfig: {
            title: "Sparse Kategorische Kreuzentropie als Metrik",
            xLabel: "Vertrauen in die richtige Klasse",
            yLabel: "Metrikwert"
          }
        }
      },
      meanSquaredError: {
        en: {
          name: "Mean Squared Error (as metric)",
          short: "Average squared difference between predictions and actual values, tracked as metric.",
          when: "Use to monitor regression performance during training.",
          intuition: "Same as MSE loss - watch the average squared error go down as your model learns!",
          formula: "\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => x * x,
            xRange: [-3, 3],
            title: "MSE as Metric",
            xLabel: "Prediction Error",
            yLabel: "Metric Value"
          }
        },
        de: {
          name: "Mittlerer Quadratischer Fehler (als Metrik)",
          short: "Durchschnittliche quadrierte Differenz zwischen Vorhersagen und tatsächlichen Werten, als Metrik verfolgt.",
          when: "Verwende es, um die Regressionsleistung während des Trainings zu überwachen.",
          intuition: "Gleich wie MSE-Verlust - beobachte, wie der durchschnittliche quadrierte Fehler sinkt, während dein Modell lernt!",
          formula: "\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => x * x,
            xRange: [-3, 3],
            title: "MSE als Metrik",
            xLabel: "Vorhersagefehler",
            yLabel: "Metrikwert"
          }
        }
      },
      meanAbsoluteError: {
        en: {
          name: "Mean Absolute Error (as metric)",
          short: "Average absolute difference between predictions and actual values.",
          when: "Use to monitor regression in interpretable units (same units as your target).",
          intuition: "If your MAE is 5 and you're predicting house prices in thousands, your predictions are off by $5,000 on average. Easy to understand!",
          formula: "\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n}|y_i - \\hat{y}_i|",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.abs(x),
            xRange: [-3, 3],
            title: "MAE as Metric",
            xLabel: "Prediction Error",
            yLabel: "Metric Value"
          }
        },
        de: {
          name: "Mittlerer Absoluter Fehler (als Metrik)",
          short: "Durchschnittliche absolute Differenz zwischen Vorhersagen und tatsächlichen Werten.",
          when: "Verwende es, um Regression in interpretierbaren Einheiten zu überwachen (gleiche Einheiten wie dein Ziel).",
          intuition: "Wenn dein MAE 5 ist und du Hauspreise in Tausendern vorhersagst, liegen deine Vorhersagen im Durchschnitt um 5.000€ daneben. Leicht zu verstehen!",
          formula: "\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n}|y_i - \\hat{y}_i|",
          plotType: "loss_curve",
          plotConfig: {
            fn: (x) => Math.abs(x),
            xRange: [-3, 3],
            title: "MAE als Metrik",
            xLabel: "Vorhersagefehler",
            yLabel: "Metrikwert"
          }
        }
      },
      meanAbsolutePercentageError: {
        en: {
          name: "Mean Absolute Percentage Error (as metric)",
          short: "Average percentage error - scale-independent measure.",
          when: "Use when you want to report error as a percentage, making it easy to communicate to non-technical stakeholders.",
          intuition: "Instead of saying 'we're off by 5 units', you can say 'we're off by 3%'. Much easier for everyone to understand!",
          formula: "\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right|",
          plotType: "mape_demo",
          plotConfig: {
            title: "MAPE as Metric: Percentage error",
            xLabel: "Actual Value",
            yLabel: "% Error for fixed absolute error"
          }
        },
        de: {
          name: "Mittlerer Absoluter Prozentualer Fehler (als Metrik)",
          short: "Durchschnittlicher prozentualer Fehler - skalenunabhängiges Maß.",
          when: "Verwende es, wenn du den Fehler als Prozentsatz angeben möchtest, was die Kommunikation mit nicht-technischen Stakeholdern erleichtert.",
          intuition: "Statt zu sagen 'wir liegen um 5 Einheiten daneben', kannst du sagen 'wir liegen um 3% daneben'. Viel einfacher für alle zu verstehen!",
          formula: "\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n}\\left|\\frac{y_i - \\hat{y}_i}{y_i}\\right|",
          plotType: "mape_demo",
          plotConfig: {
            title: "MAPE als Metrik: Prozentualer Fehler",
            xLabel: "Tatsächlicher Wert",
            yLabel: "% Fehler für festen absoluten Fehler"
          }
        }
      },
      cosine: {
        en: {
          name: "Cosine Similarity",
          short: "Measures the cosine of the angle between predicted and actual vectors.",
          when: "Use when you care about the direction/pattern of predictions rather than their magnitude. Common in embeddings and NLP.",
          intuition: "Imagine two arrows pointing from the center of a circle. Cosine similarity measures if they point in the same direction, regardless of how long they are. Two arrows pointing the same way = 1 (perfect). Opposite directions = -1 (worst). Perpendicular = 0 (unrelated).",
          formula: "\\text{CosSim} = \\frac{\\mathbf{y} \\cdot \\hat{\\mathbf{y}}}{\\|\\mathbf{y}\\| \\cdot \\|\\hat{\\mathbf{y}}\\|}",
          plotType: "cosine_demo",
          plotConfig: {
            title: "Cosine Similarity: Direction matters",
            xLabel: "Angle between vectors (degrees)",
            yLabel: "Cosine Similarity"
          }
        },
        de: {
          name: "Kosinus-Ähnlichkeit",
          short: "Misst den Kosinus des Winkels zwischen vorhergesagten und tatsächlichen Vektoren.",
          when: "Verwende es, wenn dir die Richtung/das Muster der Vorhersagen wichtiger ist als ihre Größe. Häufig bei Embeddings und NLP.",
          intuition: "Stell dir zwei Pfeile vor, die vom Mittelpunkt eines Kreises zeigen. Kosinus-Ähnlichkeit misst, ob sie in die gleiche Richtung zeigen, unabhängig davon, wie lang sie sind. Zwei Pfeile in die gleiche Richtung = 1 (perfekt). Entgegengesetzte Richtungen = -1 (schlimmste). Senkrecht = 0 (unverwandt).",
          formula: "\\text{KosSim} = \\frac{\\mathbf{y} \\cdot \\hat{\\mathbf{y}}}{\\|\\mathbf{y}\\| \\cdot \\|\\hat{\\mathbf{y}}\\|}",
          plotType: "cosine_demo",
          plotConfig: {
            title: "Kosinus-Ähnlichkeit: Richtung zählt",
            xLabel: "Winkel zwischen Vektoren (Grad)",
            yLabel: "Kosinus-Ähnlichkeit"
          }
        }
      }
    }
  };

  // ============================================================
  // STYLES
  // ============================================================
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .loss-metric-help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-left: 6px;
      vertical-align: middle;
      opacity: 0.7;
      transition: opacity 0.2s, transform 0.2s;
    }
    .loss-metric-help-icon:hover {
      opacity: 1;
      transform: scale(1.15);
    }
    .loss-metric-help-icon img {
      display: block;
    }
    .lm-explainer-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: lm-fade-in 0.2s ease;
    }
    @keyframes lm-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .lm-explainer-popup {
      background: #1a1a2e;
      color: #e0e0e0;
      border-radius: 16px;
      padding: 0;
      max-width: 800px;
      width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      position: relative;
      animation: lm-slide-up 0.3s ease;
    }
    @keyframes lm-slide-up {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .lm-explainer-popup::-webkit-scrollbar {
      width: 8px;
    }
    .lm-explainer-popup::-webkit-scrollbar-track {
      background: #16213e;
      border-radius: 8px;
    }
    .lm-explainer-popup::-webkit-scrollbar-thumb {
      background: #0f3460;
      border-radius: 8px;
    }
    .lm-popup-header {
      position: sticky;
      top: 0;
      background: linear-gradient(135deg, #0f3460, #16213e);
      padding: 20px 24px;
      border-radius: 16px 16px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
      border-bottom: 1px solid #1a3a5c;
    }
    .lm-popup-header h2 {
      margin: 0;
      font-size: 1.3em;
      color: #fff;
      font-weight: 600;
    }
    .lm-popup-close {
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .lm-popup-close:hover {
      background: rgba(255,80,80,0.3);
    }
    .lm-popup-body {
      padding: 24px;
    }
    .lm-section {
      margin-bottom: 20px;
    }
    .lm-section-title {
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64b5f6;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .lm-section-content {
      font-size: 1em;
      line-height: 1.6;
      color: #ccc;
    }
    .lm-formula-box {
      background: #16213e;
      border: 1px solid #1a3a5c;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      margin: 12px 0;
      overflow-x: auto;
    }
    .lm-intuition-box {
      background: linear-gradient(135deg, #1a3350, #162040);
      border-left: 4px solid #ffd54f;
      border-radius: 0 10px 10px 0;
      padding: 16px;
      margin: 12px 0;
    }
    .lm-intuition-box .lm-bulb {
      font-size: 1.3em;
      margin-right: 8px;
    }
    .lm-when-box {
      background: linear-gradient(135deg, #1a3520, #162a20);
      border-left: 4px solid #66bb6a;
      border-radius: 0 10px 10px 0;
      padding: 16px;
      margin: 12px 0;
    }
    .lm-plot-container {
      margin: 16px 0;
      border-radius: 10px;
      overflow: hidden;
      background: #0d1b2a;
      border: 1px solid #1a3a5c;
    }
    .lm-comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 0.9em;
    }
    .lm-comparison-table th {
      background: #0f3460;
      color: #fff;
      padding: 10px;
      text-align: left;
    }
    .lm-comparison-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #1a3a5c;
    }
    .lm-comparison-table tr:hover td {
      background: rgba(100,181,246,0.05);
    }
    .lm-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
      margin-right: 4px;
    }
    .lm-tag-regression { background: #1b5e20; color: #a5d6a7; }
    .lm-tag-classification { background: #1a237e; color: #9fa8da; }
    .lm-tag-binary { background: #4a148c; color: #ce93d8; }
    .lm-tag-multiclass { background: #e65100; color: #ffcc80; }
  `;
  document.head.appendChild(styleEl);

  // ============================================================
  // HELPER: Get current language
  // ============================================================
  function getLang() {
    return (typeof lang !== 'undefined' && lang === 'de') ? 'de' : 'en';
  }

  // ============================================================
  // HELPER: Render formula with Temml
  // ============================================================
  function renderFormula(latex) {
    try {
      return temml.renderToString(latex, { displayMode: true });
    } catch (e) {
      return `<code>${latex}</code>`;
    }
  }

  // ============================================================
  // PLOT GENERATORS
  // ============================================================
  function generatePlot(plotType, plotConfig, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const plotLayout = {
      paper_bgcolor: '#0d1b2a',
      plot_bgcolor: '#0d1b2a',
      font: { color: '#ccc', size: 12 },
      margin: { t: 40, b: 50, l: 55, r: 20 },
      xaxis: { 
        title: plotConfig.xLabel, 
        gridcolor: '#1a3a5c', 
        zerolinecolor: '#2a4a6c',
        color: '#aaa'
      },
      yaxis: { 
        title: plotConfig.yLabel, 
        gridcolor: '#1a3a5c', 
        zerolinecolor: '#2a4a6c',
        color: '#aaa'
      },
      title: { text: plotConfig.title, font: { size: 14, color: '#64b5f6' } },
      showlegend: true,
      legend: { font: { color: '#ccc' }, bgcolor: 'rgba(0,0,0,0)' }
    };

    const plotCfg = { responsive: true, displayModeBar: false };

    switch (plotType) {
      case 'loss_curve': {
        const xVals = [];
        const yVals = [];
        const [xMin, xMax] = plotConfig.xRange;
        for (let x = xMin; x <= xMax; x += 0.05) {
          xVals.push(x);
          yVals.push(plotConfig.fn(x));
        }
        const traces = [{
          x: xVals, y: yVals,
          type: 'scatter', mode: 'lines',
          name: plotConfig.title.split(':')[0],
          line: { color: '#64b5f6', width: 3 }
        }];
        // Add comparison traces for specific losses
        if (plotConfig.title.includes('MAE') && plotConfig.title.includes('MSE')) {
          const yMSE = xVals.map(x => x * x);
          traces.push({
            x: xVals, y: yMSE,
            type: 'scatter', mode: 'lines',
            name: 'MSE',
            line: { color: '#ef5350', width: 2, dash: 'dash' }
          });
          traces[0].name = 'MAE';
        }
        if (plotConfig.title.includes('Squared Hinge') || plotConfig.title.includes('Quadrierter Hinge')) {
          const yHinge = xVals.map(x => Math.max(0, 1 - x));
          traces.push({
            x: xVals, y: yHinge,
            type: 'scatter', mode: 'lines',
            name: 'Hinge',
            line: { color: '#ffd54f', width: 2, dash: 'dash' }
          });
          
          traces[0].name = 'Squared Hinge';
        }
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'logcosh_curve': {
        const xVals = [];
        const yLogCosh = [];
        const yMSE = [];
        const yMAE = [];
        const [xMin, xMax] = plotConfig.xRange;
        for (let x = xMin; x <= xMax; x += 0.05) {
          xVals.push(x);
          yLogCosh.push(Math.log(Math.cosh(x)));
          yMSE.push(x * x);
          yMAE.push(Math.abs(x));
        }
        const traces = [
          {
            x: xVals, y: yLogCosh,
            type: 'scatter', mode: 'lines',
            name: 'Log-Cosh',
            line: { color: '#64b5f6', width: 3 }
          },
          {
            x: xVals, y: yMSE,
            type: 'scatter', mode: 'lines',
            name: 'MSE',
            line: { color: '#ef5350', width: 2, dash: 'dash' }
          },
          {
            x: xVals, y: yMAE,
            type: 'scatter', mode: 'lines',
            name: 'MAE',
            line: { color: '#66bb6a', width: 2, dash: 'dot' }
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'bce_curve': {
        const xVals = [];
        const yWhenTrue = [];
        const yWhenFalse = [];
        for (let x = 0.01; x <= 0.99; x += 0.01) {
          xVals.push(x);
          yWhenTrue.push(-Math.log(x));
          yWhenFalse.push(-Math.log(1 - x));
        }
        const traces = [
          {
            x: xVals, y: yWhenTrue,
            type: 'scatter', mode: 'lines',
            name: getLang() === 'de' ? 'Wahres Label = 1' : 'True Label = 1',
            line: { color: '#64b5f6', width: 3 }
          },
          {
            x: xVals, y: yWhenFalse,
            type: 'scatter', mode: 'lines',
            name: getLang() === 'de' ? 'Wahres Label = 0' : 'True Label = 0',
            line: { color: '#ef5350', width: 3 }
          }
        ];
        // Add annotation
        plotLayout.annotations = [
          {
            x: 0.1, y: -Math.log(0.1),
            text: getLang() === 'de' ? 'Hohe Strafe!\n(sagt 10% aber ist 1)' : 'High penalty!\n(says 10% but is 1)',
            showarrow: true, arrowhead: 2,
            font: { color: '#ffd54f', size: 11 },
            arrowcolor: '#ffd54f'
          },
          {
            x: 0.9, y: -Math.log(0.9),
            text: getLang() === 'de' ? 'Niedrige Strafe\n(sagt 90% und ist 1)' : 'Low penalty\n(says 90% and is 1)',
            showarrow: true, arrowhead: 2,
            font: { color: '#66bb6a', size: 11 },
            arrowcolor: '#66bb6a'
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'categorical_demo': {
        const xVals = [];
        const yVals = [];
        for (let x = 0.01; x <= 0.99; x += 0.01) {
          xVals.push(x);
          yVals.push(-Math.log(x));
        }
        const traces = [{
          x: xVals, y: yVals,
          type: 'scatter', mode: 'lines',
          name: getLang() === 'de' ? 'Verlust vs Vertrauen' : 'Loss vs Confidence',
          line: { color: '#64b5f6', width: 3 },
          fill: 'tozeroy',
          fillcolor: 'rgba(100,181,246,0.1)'
        }];
        // Add key points
        plotLayout.shapes = [
          {
            type: 'line', x0: 0.5, x1: 0.5, y0: 0, y1: -Math.log(0.5),
            line: { color: '#ffd54f', width: 1, dash: 'dot' }
          }
        ];
        plotLayout.annotations = [
          {
            x: 0.05, y: -Math.log(0.05),
            text: getLang() === 'de' ? '5% Vertrauen\n→ Riesiger Verlust!' : '5% confidence\n→ Huge loss!',
            showarrow: true, arrowhead: 2,
            font: { color: '#ef5350', size: 11 },
            arrowcolor: '#ef5350'
          },
          {
            x: 0.95, y: -Math.log(0.95),
            text: getLang() === 'de' ? '95% Vertrauen\n→ Winziger Verlust' : '95% confidence\n→ Tiny loss',
            showarrow: true, arrowhead: 2,
            font: { color: '#66bb6a', size: 11 },
            arrowcolor: '#66bb6a'
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'hinge_curve': {
        const xVals = [];
        const yVals = [];
        for (let x = -2; x <= 3; x += 0.05) {
          xVals.push(x);
          yVals.push(Math.max(0, 1 - x));
        }
        const traces = [{
          x: xVals, y: yVals,
          type: 'scatter', mode: 'lines',
          name: getLang() === 'de' ? 'Hinge Verlust' : 'Hinge Loss',
          line: { color: '#64b5f6', width: 3 }
        }];
        plotLayout.shapes = [
          {
            type: 'rect', x0: 1, x1: 3, y0: 0, y1: 0.1,
            fillcolor: 'rgba(102,187,106,0.2)',
            line: { width: 0 }
          },
          {
            type: 'rect', x0: -2, x1: 1, y0: 0, y1: 3,
            fillcolor: 'rgba(239,83,80,0.05)',
            line: { width: 0 }
          }
        ];
        plotLayout.annotations = [
          {
            x: 2, y: 0.3,
            text: getLang() === 'de' ? '✓ Sicher richtig\n(kein Verlust)' : '✓ Confidently correct\n(no loss)',
            showarrow: false,
            font: { color: '#66bb6a', size: 11 }
          },
          {
            x: -0.5, y: 2,
            text: getLang() === 'de' ? '✗ Falsch\n(linearer Verlust)' : '✗ Wrong\n(linear loss)',
            showarrow: false,
            font: { color: '#ef5350', size: 11 }
          },
          {
            x: 0.5, y: 1,
            text: getLang() === 'de' ? '⚠ Richtig aber\nnicht sicher genug' : '⚠ Correct but\nnot confident enough',
            showarrow: false,
            font: { color: '#ffd54f', size: 10 }
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'mape_demo': {
        const actuals = [1, 2, 5, 10, 20, 50, 100];
        const absError = 1; // fixed absolute error of 1
        const percentErrors = actuals.map(a => (absError / a) * 100);
        const traces = [{
          x: actuals, y: percentErrors,
          type: 'bar',
          name: getLang() === 'de' ? 'Prozentualer Fehler (abs. Fehler=1)' : 'Percentage Error (abs. error=1)',
          marker: { 
            color: percentErrors.map(v => v > 50 ? '#ef5350' : v > 20 ? '#ffd54f' : '#66bb6a')
          }
        }];
        plotLayout.annotations = [
          {
            x: 1, y: 100,
            text: getLang() === 'de' ? 'Gleicher absoluter Fehler,\naber 100% relativ!' : 'Same absolute error,\nbut 100% relative!',
            showarrow: true, arrowhead: 2,
            font: { color: '#ef5350', size: 11 },
            arrowcolor: '#ef5350'
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'msle_demo': {
        const xVals = [];
        const yMSLE = [];
        const yMSE = [];
        const trueVal = 10;
        for (let x = 0.5; x <= 30; x += 0.3) {
          xVals.push(x);
          yMSLE.push(Math.pow(Math.log(1 + trueVal) - Math.log(1 + x), 2));
          yMSE.push(Math.pow(trueVal - x, 2) / 100); // scaled down for comparison
        }
        const traces = [
          {
            x: xVals, y: yMSLE,
            type: 'scatter', mode: 'lines',
            name: 'MSLE',
            line: { color: '#64b5f6', width: 3 }
          },
          {
            x: xVals, y: yMSE,
            type: 'scatter', mode: 'lines',
            name: 'MSE (÷100)',
            line: { color: '#ef5350', width: 2, dash: 'dash' }
          }
        ];
        plotLayout.shapes = [{
          type: 'line', x0: trueVal, x1: trueVal, y0: 0, y1: 3,
          line: { color: '#66bb6a', width: 2, dash: 'dot' }
        }];
        plotLayout.annotations = [{
          x: trueVal, y: 0.2,
          text: getLang() === 'de' ? 'Wahrer Wert = 10' : 'True value = 10',
          showarrow: false,
          font: { color: '#66bb6a', size: 11 }
        }];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'poisson_demo': {
        const xVals = [];
        const yVals = [];
        const trueCount = 5;
        for (let x = 0.1; x <= 15; x += 0.1) {
          xVals.push(x);
          yVals.push(x - trueCount * Math.log(x));
        }
        const traces = [{
          x: xVals, y: yVals,
          type: 'scatter', mode: 'lines',
          name: getLang() === 'de' ? 'Poisson-Verlust (wahr=5)' : 'Poisson Loss (true=5)',
          line: { color: '#64b5f6', width: 3 }
        }];
        // Mark minimum
        const minX = trueCount;
        const minY = minX - trueCount * Math.log(minX);
        plotLayout.annotations = [{
          x: minX, y: minY,
          text: getLang() === 'de' ? 'Minimum bei\nVorhersage = Wahrheit' : 'Minimum at\nprediction = truth',
          showarrow: true, arrowhead: 2,
          font: { color: '#66bb6a', size: 11 },
          arrowcolor: '#66bb6a'
        }];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'kl_demo': {
        // Show two distributions and their KL divergence
        const x = [];
        const p = [];
        const q1 = [];
        const q2 = [];
        for (let i = -4; i <= 4; i += 0.1) {
          x.push(i);
          // P: standard normal
          p.push(Math.exp(-i * i / 2) / Math.sqrt(2 * Math.PI));
          // Q1: slightly shifted
          q1.push(Math.exp(-(i - 0.5) * (i - 0.5) / 2) / Math.sqrt(2 * Math.PI));
          // Q2: very different
          q2.push(Math.exp(-(i - 2) * (i - 2) / (2 * 0.5)) / Math.sqrt(2 * Math.PI * 0.5));
        }
        const traces = [
          {
            x: x, y: p,
            type: 'scatter', mode: 'lines',
            name: getLang() === 'de' ? 'P (Referenz)' : 'P (Reference)',
            line: { color: '#64b5f6', width: 3 }
          },
          {
            x: x, y: q1,
            type: 'scatter', mode: 'lines',
            name: getLang() === 'de' ? 'Q₁ (ähnlich, KL klein)' : 'Q₁ (similar, KL small)',
            line: { color: '#66bb6a', width: 2, dash: 'dash' }
          },
          {
            x: x, y: q2,
            type: 'scatter', mode: 'lines',
            name: getLang() === 'de' ? 'Q₂ (verschieden, KL groß)' : 'Q₂ (different, KL large)',
            line: { color: '#ef5350', width: 2, dash: 'dot' }
          }
        ];
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'accuracy_demo': {
        // Show threshold visualization
        const predictions = [0.1, 0.3, 0.45, 0.55, 0.7, 0.85, 0.92, 0.2, 0.6, 0.8];
        const trueLabels = [0, 0, 0, 1, 1, 1, 1, 0, 1, 1];
        const colors = predictions.map((p, i) => {
          const predicted = p > 0.5 ? 1 : 0;
          return predicted === trueLabels[i] ? '#66bb6a' : '#ef5350';
        });
        const traces = [{
          x: predictions.map((_, i) => i + 1),
          y: predictions,
          type: 'bar',
          marker: { color: colors },
          name: getLang() === 'de' ? 'Vorhersagen' : 'Predictions',
          text: predictions.map((p, i) => 
            `${getLang() === 'de' ? 'Vorh' : 'Pred'}: ${p.toFixed(2)}, ${getLang() === 'de' ? 'Wahr' : 'True'}: ${trueLabels[i]}`
          ),
          hoverinfo: 'text'
        }];
        plotLayout.shapes = [{
          type: 'line', x0: 0, x1: 11, y0: 0.5, y1: 0.5,
          line: { color: '#ffd54f', width: 2, dash: 'dash' }
        }];
        plotLayout.annotations = [{
          x: 5.5, y: 0.53,
          text: getLang() === 'de' ? 'Schwellenwert = 0.5' : 'Threshold = 0.5',
          showarrow: false,
          font: { color: '#ffd54f', size: 12 }
        }];
        const correct = predictions.filter((p, i) => (p > 0.5 ? 1 : 0) === trueLabels[i]).length;
        plotLayout.title.text = `${plotConfig.title} (${correct}/${predictions.length} = ${(correct/predictions.length*100).toFixed(0)}%)`;
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'cat_accuracy_demo': {
        // Show multi-class predictions
        const classes = ['Cat', 'Dog', 'Bird', 'Fish'];
        const classesDe = ['Katze', 'Hund', 'Vogel', 'Fisch'];
        const predictions = [
          [0.7, 0.1, 0.1, 0.1],  // correct (cat)
          [0.2, 0.5, 0.2, 0.1],  // correct (dog)
          [0.3, 0.3, 0.2, 0.2],  // wrong (should be bird)
          [0.1, 0.1, 0.1, 0.7],  // correct (fish)
        ];
        const trueClasses = [0, 1, 2, 3];
        const isDE = getLang() === 'de';
        const labels = isDE ? classesDe : classes;

        const traces = labels.map((cls, classIdx) => ({
          x: predictions.map((_, sampleIdx) => `${isDE ? 'Probe' : 'Sample'} ${sampleIdx + 1}\n(${isDE ? 'Wahr' : 'True'}: ${labels[trueClasses[sampleIdx]]})`),
          y: predictions.map(p => p[classIdx]),
          type: 'bar',
          name: cls,
          marker: { opacity: 0.8 }
        }));

        plotLayout.barmode = 'group';
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'precision_recall_demo': {
        // Visual confusion matrix style
        const isDE = getLang() === 'de';
        const categories = [
          isDE ? 'Wahr Positiv (TP)' : 'True Positive (TP)',
          isDE ? 'Falsch Positiv (FP)' : 'False Positive (FP)',
          isDE ? 'Wahr Negativ (TN)' : 'True Negative (TN)',
          isDE ? 'Falsch Negativ (FN)' : 'False Negative (FN)'
        ];
        const values = [40, 10, 45, 5];
        const colors = ['#66bb6a', '#ef5350', '#90a4ae', '#ffd54f'];
        
        const traces = [{
          x: categories,
          y: values,
          type: 'bar',
          marker: { color: colors },
          text: values.map(v => v.toString()),
          textposition: 'auto'
        }];

        const precision = values[0] / (values[0] + values[1]);
        plotLayout.title.text = `${isDE ? 'Präzision' : 'Precision'} = TP/(TP+FP) = ${values[0]}/(${values[0]}+${values[1]}) = ${(precision*100).toFixed(0)}%`;
        plotLayout.showlegend = false;

        // Highlight the precision components
        plotLayout.shapes = [
          {
            type: 'rect',
            x0: -0.5, x1: 1.5, y0: 0, y1: Math.max(...values) + 5,
            fillcolor: 'rgba(100,181,246,0.05)',
            line: { color: '#64b5f6', width: 2, dash: 'dash' }
          }
        ];
        plotLayout.annotations = [{
          x: 0.5, y: Math.max(...values) + 3,
          text: isDE ? '← Präzision nutzt diese beiden' : '← Precision uses these two',
          showarrow: false,
          font: { color: '#64b5f6', size: 11 }
        }];

        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      case 'cosine_demo': {
        const angles = [];
        const cosValues = [];
        for (let a = 0; a <= 360; a += 2) {
          angles.push(a);
          cosValues.push(Math.cos(a * Math.PI / 180));
        }
        const traces = [{
          x: angles, y: cosValues,
          type: 'scatter', mode: 'lines',
          name: getLang() === 'de' ? 'Kosinus-Ähnlichkeit' : 'Cosine Similarity',
          line: { color: '#64b5f6', width: 3 }
        }];
        plotLayout.shapes = [
          { type: 'line', x0: 0, x1: 360, y0: 0, y1: 0, line: { color: '#555', width: 1, dash: 'dot' } }
        ];
        plotLayout.annotations = [
          {
            x: 0, y: 1.05,
            text: getLang() === 'de' ? '→ Gleiche Richtung' : '→ Same direction',
            showarrow: false, font: { color: '#66bb6a', size: 11 }
          },
          {
            x: 90, y: 0.1,
            text: getLang() === 'de' ? '↑ Senkrecht' : '↑ Perpendicular',
            showarrow: false, font: { color: '#ffd54f', size: 11 }
          },
          {
            x: 180, y: -0.9,
            text: getLang() === 'de' ? '← Entgegengesetzt' : '← Opposite',
            showarrow: false, font: { color: '#ef5350', size: 11 }
          }
        ];

        // Add a small canvas-based vector visualization via an additional div
        Plotly.newPlot(containerId, traces, plotLayout, plotCfg);
        break;
      }

      default:
        container.innerHTML = `<p style="padding:20px;color:#aaa;">Plot type "${plotType}" not implemented.</p>`;
    }
  }

  // ============================================================
  // POPUP BUILDER
  // ============================================================
  let currentOverlay = null;
  let langWatchInterval = null;

  function closePopup() {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
    }
    if (langWatchInterval) {
      clearInterval(langWatchInterval);
      langWatchInterval = null;
    }
  }

  function buildPopupContent(type, key) {
    const db = type === 'loss' ? content.losses : content.metrics;
    const data = db[key];
    if (!data) return `<p>No data found for "${key}"</p>`;

    const l = getLang();
    const d = data[l] || data['en'];

    const isDE = l === 'de';

    let html = `
      <div class="lm-popup-body">
        <div class="lm-section">
          <div class="lm-section-title">${isDE ? 'ZUSAMMENFASSUNG' : 'SUMMARY'}</div>
          <div class="lm-section-content">${d.short}</div>
        </div>

        <div class="lm-when-box">
          <div class="lm-section-title" style="color:#66bb6a;margin-bottom:4px;">
            🎯 ${isDE ? 'WANN VERWENDEN' : 'WHEN TO USE'}
          </div>
          <div class="lm-section-content">${d.when}</div>
        </div>

        <div class="lm-intuition-box">
          <div class="lm-section-title" style="color:#ffd54f;margin-bottom:4px;">
            <span class="lm-bulb">💡</span>${isDE ? 'INTUITION (EINFACH ERKLÄRT)' : 'INTUITION (SIMPLY EXPLAINED)'}
          </div>
          <div class="lm-section-content">${d.intuition}</div>
        </div>

        <div class="lm-section">
          <div class="lm-section-title">📐 ${isDE ? 'FORMEL' : 'FORMULA'}</div>
          <div class="lm-formula-box">
            ${renderFormula(d.formula)}
          </div>
        </div>

        <div class="lm-section">
          <div class="lm-section-title">📊 ${isDE ? 'VISUALISIERUNG' : 'VISUALIZATION'}</div>
          <div class="lm-plot-container">
            <div id="lm-plot-area" style="width:100%;height:300px;"></div>
          </div>
        </div>

        ${buildComparisonSection(type, key)}

        <div class="lm-section">
          <div class="lm-section-title">🏷️ ${isDE ? 'KATEGORIE' : 'CATEGORY'}</div>
          <div class="lm-section-content">
            ${getTagsHTML(type, key)}
          </div>
        </div>
      </div>
    `;

    return html;
  }

  function getTagsHTML(type, key) {
    const regressionKeys = ['meanSquaredError', 'meanAbsoluteError', 'meanAbsolutePercentageError', 'meanSquaredLogarithmicError', 'poisson', 'logcosh'];
    const binaryKeys = ['binaryCrossentropy', 'hinge', 'squaredHinge'];
    const multiclassKeys = ['categoricalCrossentropy', 'sparseCategoricalCrossentropy', 'categoricalHinge'];
    const distributionKeys = ['kullbackLeiblerDivergence'];

    const isDE = getLang() === 'de';
    let tags = '';

    if (regressionKeys.includes(key)) {
      tags += `<span class="lm-tag lm-tag-regression">${isDE ? 'Regression' : 'Regression'}</span>`;
    }
    if (binaryKeys.includes(key)) {
      tags += `<span class="lm-tag lm-tag-binary">${isDE ? 'Binäre Klassifikation' : 'Binary Classification'}</span>`;
    }
    if (multiclassKeys.includes(key)) {
      tags += `<span class="lm-tag lm-tag-multiclass">${isDE ? 'Mehrklassen' : 'Multi-class'}</span>`;
    }
    if (distributionKeys.includes(key)) {
      tags += `<span class="lm-tag lm-tag-classification">${isDE ? 'Verteilungen' : 'Distributions'}</span>`;
    }

    // Metric-specific tags
    if (type === 'metric') {
      if (['binaryAccuracy', 'precision'].includes(key)) {
        tags += `<span class="lm-tag lm-tag-binary">${isDE ? 'Binäre Klassifikation' : 'Binary Classification'}</span>`;
      }
      if (['categoricalAccuracy'].includes(key)) {
        tags += `<span class="lm-tag lm-tag-multiclass">${isDE ? 'Mehrklassen' : 'Multi-class'}</span>`;
      }
      if (['cosine'].includes(key)) {
        tags += `<span class="lm-tag lm-tag-classification">${isDE ? 'Embeddings / NLP' : 'Embeddings / NLP'}</span>`;
      }
      if (['meanSquaredError', 'meanAbsoluteError', 'meanAbsolutePercentageError'].includes(key)) {
        tags += `<span class="lm-tag lm-tag-regression">${isDE ? 'Regression' : 'Regression'}</span>`;
      }
    }

    return tags || `<span class="lm-tag" style="background:#333;color:#aaa;">${isDE ? 'Allgemein' : 'General'}</span>`;
  }

  function buildComparisonSection(type, key) {
    const isDE = getLang() === 'de';
    
    // Only show comparison for losses
    if (type !== 'loss') return '';

    const comparisons = {
      meanSquaredError: ['meanAbsoluteError', 'logcosh', 'meanSquaredLogarithmicError'],
      meanAbsoluteError: ['meanSquaredError', 'logcosh'],
      binaryCrossentropy: ['hinge', 'squaredHinge'],
      categoricalCrossentropy: ['sparseCategoricalCrossentropy', 'categoricalHinge'],
      hinge: ['squaredHinge', 'binaryCrossentropy'],
      squaredHinge: ['hinge', 'binaryCrossentropy'],
      logcosh: ['meanSquaredError', 'meanAbsoluteError'],
      meanSquaredLogarithmicError: ['meanSquaredError', 'meanAbsolutePercentageError'],
      meanAbsolutePercentageError: ['meanAbsoluteError', 'meanSquaredLogarithmicError'],
      poisson: ['meanSquaredError', 'meanAbsoluteError'],
      sparseCategoricalCrossentropy: ['categoricalCrossentropy'],
      categoricalHinge: ['categoricalCrossentropy', 'hinge'],
      kullbackLeiblerDivergence: ['categoricalCrossentropy']
    };

    const related = comparisons[key];
    if (!related || related.length === 0) return '';

    let rows = '';
    related.forEach(relKey => {
      const relData = content.losses[relKey];
      if (!relData) return;
      const rd = relData[getLang()] || relData['en'];
      rows += `<tr>
        <td>
<strong>${rd.name}</strong></td>
        <td>${rd.short}</td>
      </tr>`;
    });

    return `
      <div class="lm-section">
        <div class="lm-section-title">🔄 ${isDE ? 'VERGLEICH MIT ÄHNLICHEN' : 'COMPARISON WITH SIMILAR'}</div>
        <table class="lm-comparison-table">
          <thead>
            <tr>
              <th>${isDE ? 'Name' : 'Name'}</th>
              <th>${isDE ? 'Beschreibung' : 'Description'}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function openPopup(type, key) {
    closePopup();

    const db = type === 'loss' ? content.losses : content.metrics;
    const data = db[key];
    if (!data) return;

    const l = getLang();
    const d = data[l] || data['en'];

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'lm-explainer-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'lm-explainer-popup';
    popup.innerHTML = `
      <div class="lm-popup-header">
        <h2>${d.name}</h2>
        <button class="lm-popup-close" title="Close">×</button>
      </div>
      <div id="lm-popup-content-area">
        ${buildPopupContent(type, key)}
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    currentOverlay = overlay;

    // Close button
    popup.querySelector('.lm-popup-close').addEventListener('click', closePopup);

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.removeEventListener('keydown', escHandler);
    document.addEventListener('keydown', escHandler);

    // Render plot after DOM is ready
    setTimeout(() => {
      const plotData = d.plotConfig || {};
      generatePlot(d.plotType, plotData, 'lm-plot-area');
    }, 100);

    // Watch for language changes
    let lastLang = getLang();
    langWatchInterval = setInterval(() => {
      const currentLang = getLang();
      if (currentLang !== lastLang) {
        lastLang = currentLang;
        rebuildPopup(type, key);
      }
    }, 300);
  }

  function rebuildPopup(type, key) {
    if (!currentOverlay) return;

    const db = type === 'loss' ? content.losses : content.metrics;
    const data = db[key];
    if (!data) return;

    const l = getLang();
    const d = data[l] || data['en'];

    const header = currentOverlay.querySelector('.lm-popup-header h2');
    if (header) header.textContent = d.name;

    const contentArea = currentOverlay.querySelector('#lm-popup-content-area');
    if (contentArea) {
      contentArea.innerHTML = buildPopupContent(type, key);
      // Re-render plot
      setTimeout(() => {
        const plotData = d.plotConfig || {};
        generatePlot(d.plotType, plotData, 'lm-plot-area');
      }, 100);
    }
  }

  // ============================================================
  // ICON INJECTION
  // ============================================================
  function createHelpIcon(element, type, getKeyFn) {
    const height = element.offsetHeight || 24;
    const icon = document.createElement('span');
    icon.className = 'loss-metric-help-icon';
    icon.title = getLang() === 'de' ? 'Klicke für Erklärung' : 'Click for explanation';
    icon.innerHTML = `<img src="${HELP_ICON_PATH}" alt="?" style="height:${Math.max(16, Math.min(height, 28))}px;width:auto;">`;
    
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = getKeyFn();
      openPopup(type, key);
    });

    return icon;
  }

  function injectHelpIcons() {
    // Find the loss select
    const lossSelect = document.getElementById('loss');
    if (lossSelect && !lossSelect.dataset.helpInjected) {
      const icon = createHelpIcon(lossSelect, 'loss', () => lossSelect.value);
      lossSelect.parentElement.appendChild(icon);
      lossSelect.dataset.helpInjected = 'true';
    }

    // Find the metric select
    const metricSelect = document.getElementById('metric');
    if (metricSelect && !metricSelect.dataset.helpInjected) {
      const icon = createHelpIcon(metricSelect, 'metric', () => metricSelect.value);
      metricSelect.parentElement.appendChild(icon);
      metricSelect.dataset.helpInjected = 'true';
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectHelpIcons);
    } else {
      injectHelpIcons();
    }
  }

  init();

})();
