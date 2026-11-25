# EOY Ladezeiten

- Methode: Chromium headless, 1440x1000, `Network.setCacheDisabled(true)`, PHP local server.
- Messpunkt: `ready` = Dokument geladen, Demo gemountet, alle sichtbaren Bilder fertig, alle `data-tex`-Formeln gerendert. TF.js wird bei den Modell-Folien zusätzlich abgewartet.
- 122 Seiten: 61 Substeps in DE und EN. Median aus drei Läufen nach der Optimierung.
- Vorher: Median **889.8 ms**, **3762.0 KB** pro Seite.
- Nachher: Median **1078.3 ms**, **2331.0 KB** pro Seite.
- Die Wanduhrzeiten sind auf diesem Host stark belastet (Load Average >6 durch andere Prozesse) und nicht als sauberer Vorher/Nachher-Vergleich zu lesen. Die übertragene Datenmenge ist der belastbare Wert.
- Optimierung: `tf.min.js` (ca. 1.4 MB) wird nicht mehr auf jeder Seite geladen. Nur die Modell-Folien 13 und 16 laden TF per `model.js` nach; alle anderen Seiten sparen die Datei.

| Sprache | Schritt | Substep | Titel | Median ms | Bytes KB |
|---|---:|---:|---|---:|---:|
| DE | 1 | 0 | Wie funktionieren Sprachmodelle? | 1556.6 | 2308 |
| DE | 2 | 0 | Daten | 842.4 | 2308 |
| DE | 2 | 1 | Die Architektur von LLMs | 827.2 | 2308 |
| DE | 3 | 0 | Gauß, Ceres und die Daten | 714.7 | 2988 |
| DE | 3 | 1 | Gauß, Ceres und die Daten | 865.1 | 2966 |
| DE | 3 | 2 | Gauß, Ceres und die Daten | 755.7 | 2966 |
| DE | 3 | 3 | Gauß, Ceres und die Daten | 741.6 | 2966 |
| DE | 3 | 4 | Gauß, Ceres und die Daten | 724.0 | 2308 |
| DE | 4 | 0 | Text wird zu IDs | 719.1 | 2331 |
| DE | 5 | 0 | BPE: Bytes/Zeichen → Paare → Merges | 686.9 | 2308 |
| DE | 6 | 0 | Bedeutung wird eine Zahl | 793.0 | 2353 |
| DE | 6 | 1 | Wochentage auf einer Linie | 707.2 | 2308 |
| DE | 6 | 2 | Bedeutung bekommt eine zweite Achse | 858.4 | 2330 |
| DE | 6 | 3 | Drei Dimensionen | 864.5 | 2353 |
| DE | 6 | 4 | Tausende Dimensionen | 877.4 | 2331 |
| DE | 7 | 0 | Von Beziehungen zur Übersetzung | 948.9 | 2331 |
| DE | 8 | 0 | Jeder Platz bekommt einen Fingerabdruck | 843.2 | 2308 |
| DE | 9 | 0 | Attention bewegt Punkte anhand des Kontextes | 942.7 | 2331 |
| DE | 10 | 0 | Wie Attention rechnet | 925.4 | 2331 |
| DE | 10 | 1 | Attention als vollverbundener Graph (ohne Causal Mask) | 905.6 | 2331 |
| DE | 10 | 2 | Attention als Mischung der Value-Vektoren | 871.5 | 2331 |
| DE | 10 | 3 | Head 2: Wo ist es? | 1087.9 | 2331 |
| DE | 10 | 4 | Head 2 als Graph | 990.9 | 2331 |
| DE | 10 | 5 | Head 2 als Value-Mischung | 1180.1 | 2331 |
| DE | 11 | 0 | Attention hilft, Rauschen zu ignorieren | 1032.1 | 2331 |
| DE | 11 | 1 | Attention hilft, Rauschen zu ignorieren | 1194.0 | 2331 |
| DE | 12 | 0 | A B … A → B | 854.9 | 2331 |
| DE | 12 | 1 | Attention-Gewichte: Wo liest A? | 767.1 | 2331 |
| DE | 12 | 2 | Wie wird kopiert? | 839.9 | 2331 |
| DE | 12 | 3 | Zwei Schichten, ein Trick | 943.2 | 2331 |
| DE | 12 | 4 | Vier Köpfe, vier Regeln | 818.7 | 2331 |
| DE | 12 | 5 | Der Phase Change | 823.0 | 2331 |
| DE | 13 | 0 | Ein Neuron als Gerade | 1085.7 | 3766 |
| DE | 14 | 0 | Wie findet man gute Punkte? | 938.1 | 2334 |
| DE | 15 | 0 | Aktivierungen machen den Knick | 925.2 | 2331 |
| DE | 16 | 0 | Tiefe Netze biegen die Kurve | 1071.2 | 3766 |
| DE | 17 | 0 | Der Raum biegt sich | 985.4 | 2331 |
| DE | 18 | 0 | Die Rolle von neuronalen Netzen im Transformer | 831.8 | 2331 |
| DE | 19 | 0 | Das gemeinsame Notizbuch wird zum Stream | 872.0 | 2350 |
| DE | 20 | 0 | Ähnliche Worte finden | 1167.2 | 2331 |
| DE | 20 | 1 | Länge vs. Richtung | 1247.7 | 2331 |
| DE | 20 | 2 | Vom Vektor zur Verteilung | 1340.8 | 2331 |
| DE | 21 | 0 | Der Loss: Was das Modell optimiert | 1435.2 | 2331 |
| DE | 22 | 0 | Ein Wort nach dem anderen | 1613.1 | 2331 |
| DE | 23 | 0 | Die Karte der Wörter | 975.4 | 2331 |
| DE | 24 | 0 | Das Weltmodell eines LLM | 887.8 | 2308 |
| DE | 24 | 1 | Wie ein LLM sein Weltmodell aufbaut | 845.7 | 2331 |
| DE | 24 | 2 | Schach und die reale Welt | 1027.5 | 2331 |
| DE | 25 | 0 | Wo liegt Paris? | 1431.2 | 3042 |
| DE | 25 | 1 | Wann starb Turing? | 1527.3 | 3042 |
| DE | 26 | 0 | Ein Agent ist dasselbe Modell mit Werkzeugen | 1014.8 | 2331 |
| DE | 27 | 0 | Arten von Halluzinationen | 1191.7 | 2331 |
| DE | 27 | 1 | So werden Halluzinationen seltener | 1329.6 | 2331 |
| DE | 28 | 0 | Geschichte in zehn Schritten | 1484.9 | 2415 |
| DE | 29 | 0 | Das Chinesische Zimmer | 1468.7 | 2308 |
| DE | 30 | 0 | Die Gefahren sind nicht eine Sache | 1603.9 | 2331 |
| DE | 30 | 1 | Grenzen: Was LLMs nicht zuverlässig können | 2199.9 | 2331 |
| DE | 30 | 2 | KI verteilt Macht neu | 1383.9 | 2331 |
| DE | 31 | 0 | Hat eine KI Bewusstsein? | 995.9 | 2308 |
| DE | 31 | 1 | Bewusstsein: die offene Frage | 1325.5 | 2308 |
| DE | 31 | 2 | Was du mitnimmst | 1251.8 | 2350 |
| EN | 1 | 0 | How do language models work? | 1045.4 | 2308 |
| EN | 2 | 0 | Data | 972.4 | 2308 |
| EN | 2 | 1 | The architecture of LLMs | 1554.6 | 2308 |
| EN | 3 | 0 | Gauss, Ceres, and the data | 1001.0 | 2988 |
| EN | 3 | 1 | Gauss, Ceres, and the data | 1150.2 | 2966 |
| EN | 3 | 2 | Gauss, Ceres, and the data | 1049.8 | 2966 |
| EN | 3 | 3 | Gauss, Ceres, and the data | 1134.7 | 2966 |
| EN | 3 | 4 | Gauss, Ceres, and the data | 1099.7 | 2308 |
| EN | 4 | 0 | Text becomes IDs | 1438.5 | 2331 |
| EN | 5 | 0 | BPE: bytes/characters → pairs → merges | 1273.7 | 2308 |
| EN | 6 | 0 | Meaning becomes a number | 1263.4 | 2353 |
| EN | 6 | 1 | Weekdays on a line | 1011.2 | 2308 |
| EN | 6 | 2 | Meaning gets a second axis | 1043.3 | 2330 |
| EN | 6 | 3 | Three dimensions, one shadow | 1086.8 | 2353 |
| EN | 6 | 4 | Thousands of dimensions | 1521.3 | 2331 |
| EN | 7 | 0 | From relations to translation | 1201.5 | 2331 |
| EN | 8 | 0 | Every slot gets a fingerprint | 1291.4 | 2308 |
| EN | 9 | 0 | Attention moves points based on context | 911.2 | 2331 |
| EN | 10 | 0 | How attention computes | 977.4 | 2331 |
| EN | 10 | 1 | Attention as a fully connected graph (without causal mask) | 1069.3 | 2331 |
| EN | 10 | 2 | Attention as a mixture of value vectors | 1101.0 | 2331 |
| EN | 10 | 3 | Head 2: where is it? | 1099.1 | 2331 |
| EN | 10 | 4 | Head 2 as a graph | 1027.0 | 2331 |
| EN | 10 | 5 | Head 2 as a value mixture | 1223.9 | 2331 |
| EN | 11 | 0 | Attention helps ignore noise | 1278.7 | 2331 |
| EN | 11 | 1 | Attention helps ignore noise | 1119.8 | 2331 |
| EN | 12 | 0 | A B … A → B | 1136.7 | 2331 |
| EN | 12 | 1 | Attention weights: where does A read? | 1085.4 | 2331 |
| EN | 12 | 2 | How is copying done? | 1233.5 | 2331 |
| EN | 12 | 3 | Two layers, one trick | 1350.1 | 2331 |
| EN | 12 | 4 | Four heads, four rules | 1270.5 | 2331 |
| EN | 12 | 5 | The phase change | 1181.5 | 2331 |
| EN | 13 | 0 | A neuron as a line | 1319.9 | 3766 |
| EN | 14 | 0 | How do you find good points? | 1095.4 | 2334 |
| EN | 15 | 0 | Activations create the bend | 1117.8 | 2331 |
| EN | 16 | 0 | Deep networks bend the curve | 1549.5 | 3766 |
| EN | 17 | 0 | Space bends | 1188.3 | 2331 |
| EN | 18 | 0 | The role of neural networks in the transformer | 1050.2 | 2331 |
| EN | 19 | 0 | The shared notebook becomes the stream | 1191.5 | 2350 |
| EN | 20 | 0 | Finding similar words | 1175.5 | 2331 |
| EN | 20 | 1 | Length vs. direction | 1229.1 | 2331 |
| EN | 20 | 2 | From vector to distribution | 1305.8 | 2331 |
| EN | 21 | 0 | The loss: what the model optimises | 1127.3 | 2331 |
| EN | 22 | 0 | One word after another | 1458.7 | 2331 |
| EN | 23 | 0 | The map of words | 1338.9 | 2331 |
| EN | 24 | 0 | An LLM's world model | 860.9 | 2308 |
| EN | 24 | 1 | How an LLM builds its world model | 1025.0 | 2331 |
| EN | 24 | 2 | Chess and the real world | 853.5 | 2331 |
| EN | 25 | 0 | Where is Paris? | 1377.1 | 3042 |
| EN | 25 | 1 | When did Turing die? | 1337.8 | 3042 |
| EN | 26 | 0 | An agent is the same model with tools | 662.9 | 2331 |
| EN | 27 | 0 | Types of hallucination | 889.2 | 2331 |
| EN | 27 | 1 | How to make hallucinations rarer | 796.3 | 2331 |
| EN | 28 | 0 | History in ten steps | 963.4 | 2415 |
| EN | 29 | 0 | The Chinese room | 807.9 | 2308 |
| EN | 30 | 0 | The dangers are not one thing | 1031.1 | 2331 |
| EN | 30 | 1 | Limits: what LLMs cannot do reliably | 1091.6 | 2331 |
| EN | 30 | 2 | AI redistributes power | 1377.9 | 2331 |
| EN | 31 | 0 | Does an AI have consciousness? | 1132.4 | 2308 |
| EN | 31 | 1 | Consciousness: the open question | 1110.8 | 2308 |
| EN | 31 | 2 | What you take with you | 1021.0 | 2350 |
