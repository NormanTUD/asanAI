arbeite diese punkte hier nacheinander ab. jeden einzelnen sorgfältig. am ende, nicht zwischendurch, einmal die tests.

folie "daten":

die texte rechts "vortraining", "großer datensatz", "Mehr oder weniger das ganze Internet..." usw. sind zu klein. mach die größer. die beiden blöcke außerdem vertikal zentriert. mach die "Sage mir was die Hauptstadt von Frankreich ist" und den Antwort block etwas hübscher und etwas weiter auseinander. 

"Ein Token muss kein ganzes Wort sein" sagst du ohne das richtig einzuführen. sage eher sowas wie "Tokens können Wörter sein, aber müssen es nicht. Es können auch Wortbestandteile oder Satzzeichen, Leerzeichen usw. sein".

"Jedes Token bekommt eine ID," statt ID nummer. erwähne, dass wenn dieses token erneut auftaucht im text, es zu seiner nummer wird. in der grafik darunter mit "Unzerbrechlich" entferne das "IDs" vor den IDs. 

zeige darunter ein zweites wort, unglaublich im deutschen (gleicher anfang, un, gleiche token id für das un). suche im englischen ein bsp raus wo die id gleich ist. zeige es auf die gleiche weise wie das unzerbrechlich aber eben darunter. sage, dass diese eindeutigen nummern IDs sind.

bei "Station 2 / 5 Embedding": entferne "| Richtung trägt Bedeutung | Tabelle wird gelernt". sage, dass das in tausenden Dimensionen passiert. "Ähnliche Kontexte landen in ähnlichen Richtungen" statt ähnliche Kontexte mach ähnliche Bedeutungen. Sage hier, dass Bedeutung sich aus dem Kontext ergibt, zitiere Firth. sage, dass sich die meisten auf der Oberfläche einer hochdimensionalen Kugel befinden.

bei "Positional embedding": "Die Demo zeigt die Positionskodierung als Punkt auf einer Kugel", erwähne nicht die Demo, sage, dass die Positionskodierung auf einer hochdimensionalen Kugeloberfläche passiert. erwähne dass der token "Hund" in der Mitte ist, mach ihn außerdem zu Katze, und mach, dass die tokens bis 100.000 bereits da sind und man den Slider nicht sieht und auch das "Drehen" unten kann weg. "Auf Kreisbahnen in verschiedenen Dimensionen werden verschiedene Wellen addiert. Jede Dimension hat eine andere Frequenz; zusammen ergibt das den Fingerabdruck der Position. Jeder grüne Punkt ist dasselbe Wort (Hund) an einer anderen Position." diese box darunter soll in den Text darüber. "gleiche Tokens, andere ReihenfolgePosition steckt im VektorKugel = alle Positionen" das kann weg.

"Transformer-Blöcke": "Attention mischt Information zwischen Wörtern. Das FFN formt jedes Token einzeln. Der Block läuft dutzende bis hunderte Male. Die beiden Mini-Demos zeigen die Rollen von Attention und FFN." due rwähnst hier FFN ohne es zu erklären. Sage, dass das Feed-Forward-Netzwerk (FFN) "denkt", in dem es die Tokens in dem hochdimensionalen Bedeutungsraum verschiebt, und dass das dutzende bis hunderte Male passiert. entferne "Die beiden Mini-Demos zeigen die Rollen von Attention und FFN.". entferne "Attention: wer liest wen?FFN: erkennen, trennen, neu ordnen". sage beim FFN noch dazu, dass es das macht, indem es die durch Attention gemischten Punkte in noch höherdimensionale Räume projiziert, dort einfacher trennen kann, und dann zurückprojiziert, um Bedeutungszusammenhänge kontextabhängig zu isolieren und auf einzelne Bedeutungen reagieren zu können. "Attention bewertet für jedes einzelne Token, wie wichtig alle anderen Tokens unter einem gewissen Aspekt sind, und verschiebt das Token so, dass es den Gesamtkontext unter diesen Gesichtspunkten beinhaltet" -> "unter diesem Gesichtspunkt". 

"Unembedding": "Der letzte Vektor h ist der Output-Vektor" das "h" sollte in $h$ stehen und gerendert werden inline. Außerdem formulier das neu, denn das kommt aus dem nichts. Sage, dass am Ende, nachdem zig male die Bedeutungen gemischt und sauberer getrennt worden sind, der Vektor des letzten Wortes die Gesamtbedeutung beinhaltet und man ihn benutzt, um das nächste Wort zu finden, indem man schaut, wie seine Winkel zu anderen Worten sind, denn er beinhaltet die Gesamtbedeutung des Kontextes.  Man vergleicht dann die Winkel zu allen anderen Worten von diesem letzten Token aus, und wählt eines derer mit dem geringsten Winkel. Winkel heißt hier: "Wie gut passt das Wort an dise Stelle?". Geringer Winkel heißt es passt gut. entferne "Richtung statt Längeein Token wird gezogen". entferne "der Winkel wird zum Logit, Softmax macht daraus eine Verteilung.".

wenn ich von der "Ausblick Die nächsten Tage Die nächsten Tage werden wir diese Bausteine genauer anschauen. Ein Schritt nach dem anderen."  folie zurückgehe lande ich auf der architekturfolie, aber wieder beim tokenizer statt bei "Unembedding".

die datenfolie:

entferne "Ziehe den Slider oder klicke weiter und sieh, wie mit besseren Teleskopen die Daten genauer werden. Reale Daten liegen genauso um eine Wahrheit herum. Texte zum Beispiel können komplett richtig, teilweise richtig oder komplett falsch sein.".

bei "Viele Sätze, eine Wahrheit": der grüne bereich sollte etwas größer sein und smoother, nicht so "gestrichelt" animiert. der rote bereich sollte alles sein was nicht grün ist in dem plot.

folie "Text wird zu IDs":

wenn ich von "BPE: Zeichen → Paare → Merges" zurückgehe ist wieder "Verständnis" markiert statt "Sprachmodell liest Text" (das letzte)

bei "BPE: Zeichen → Paare → Merges": das "e s" ist bereits markiert wenn man direkt auf die folie geht, statt "Start: Jedes Wort besteht aus Zeichen." sage dass alles nach einzelne zeichen getrennt ist. "Jeder Merge ersetzt ein häufiges Paar durch ein neues Symbol. Gezählt werden benachbarte Paare, gewichtet mit der Häufigkeit der Wörter. Die Trennungen werden aus den Trainingsdaten gelernt: möglichst viel Text mit möglichst wenigen Tokens. Das Wort bleibt aus seinen Symbolen zusammensetzbar; der Text ist verlustfrei rekonstruierbar. Genau das ist der Kompressionsgedanke." mach das kürzer. 


folie "Bedeutung wird eine Zahl":

"15 + 45 = 60 · Warm 15⏟Kalt+45⏟Erwärmung⏟Zahlen addieren=60⏟Warm" erwärmung macht da keinen sinn. mach nur sachen die dastehen, sowas wie kalt + lauwarm. erwärmung gibts da nicht, jedes wort in der rechnung muss im block sein, nehme nur die die im plot sind.

"Bedeutung bekommt eine zweite Achse": der 2d plot ist schief, der sollte von oben gerade im bild liegen. die ganzen linie sind direkt sichtbar, was den sehr unübersichtlich macht. am anfang soll da nur der plot sichtbar sein mit sienem grid und den worten und die ganzen linien usw. nur insofern dass das bsp das zeigt. entferne das "2d: freie wege" darunter.

"Drei Dimensionen, ein Schatten" benenne es um nach "Drei Dimensionen" ohne das schattenzeug. und da sind auch wieder zu viele linien. entferne auch hier dieses grüne "Jedes Wort ist eine Richtung vom Ursprung" darunter

folie "Attention bewegt Punkte anhand des Kontextes": 

entferne vom plot rechts oben das "x' = Sigma w mal v" und auch das "x′ x′ = Σ w · v" von unten

folie "Wie Attention rechnet".

lass mich mouseovern über jedes wort und da infos anzeigen aber lass mich auch worte anklicken im plot oben.mach die buttons "Bögen, graph, simplex" unter die head 1 und head 2 buttons, damit klar ist, dass das ne hierarchie ist. entferne "Wechsle die Heads: Head 1 zeigt auf „Tier“ (Subjekt), Head 2 auf „Straße“ (Ort)." von ganz unten. der simplex ist nicht so hoch wie graph und bögen daher springt der rest, das nervt, der simplex soll genauso hoch sein wie bögen und graph.

folie "Wie wird kopiert?":

die "A B" bei vorgänger merken/"Wie wird kopiert?", stlele finden und kopireen gehen ncah unten aus der box raus. sage klar, dass A und B platzhalter für beliebige worte sind. sage dass es viele verschiedene arten von attention heads gibt und wir hier nur ein paar durchgehen können.

"Zwei Heads, ein Algorithmus" ist mir völlig unklar was es macht und wie es geht. mach die neu. sowohl den text als auch das bild.

"Ein Successor-Head erhöht ein geordnetes Token (Montag → Dienstag) über eine gelernte Richtung" ja das ergibt sinn, aber zeige das vorher irgendwo noch, mach eine zwischenfolie zwischen 1d und 2d wo man sieht dass Montag, Dienstag, Mittwoch usw. auf einer Linie liegen, wie vorher die temperatur (belasse die aber auch da, eine zwischenfolie danach auf der folie wo auch die temperatur und die 2d und 3d sachen sind). entferne den teilsatz ", wie im IOI-Schaltkreis von GPT-2 small".

folie "Wie findet man gute Punkte?": man sieht die loss landscape aus der falschen richtung, drehe das bild so dass man auf die fläche schaut wo der ball runtergeht. das momentum schießt so weit über die loss landscape renderung hinaus dass es nach rechtsraus geht, mach die loss landscape so groß dass das momentum da nicht über den plot overshootet.

bei der folie mit relu, gelu, sigmoid und tanh soll er wenn ich weiter gehe die kurven smooth ineinander transformieren

bei der folie mit 32x32x32 ist der graph gestreckt und man sieht das an den fonts. mach den nativ in der richtigen größe, passe den an wenn man die fenstergröße usw ändert.

folie "Der Raum biegt sich":

wenn ich einfach weiter mache geht er zu "schüssel" und das passt nicht aber ich kann trotzdem weiter. er soll alle presets durchgehen.

beim plot bei "Die Rolle von neuronalen Netzen im Transformer": adde für jeden punkt mouseovers die passende tokens repräsentieren für den plot. entferne das "feine punktwolke, kanten = nachbarschaft" darunter.

folie "Das gemeinsame Notizbuch wird zum Stream": der startet mit leeren dimensinen. der sollte aber mit irgendwelchen vordefinierten dimensionen starten. sage klar, dass das für jedes token einen eigenne stream hat (stimmt doch oder? checke das)

folie "Ähnliche Worte finden": 

zeige rechts bei "kleinster winkel zuerst" prozentual wie gut espasst mit einer bar zusätzlich zu den winkeln, so dass man sieht dass der geringste winkel am besten passt, mit ner progress bar.

bei der skaleninvarianz folie: der B winkle geht aus dem screen heraus. der zeigt nicht die euklidische distanz darunter und dann wie viel die anders wird als der winkel. wenn ich weiter mache hat der die länge von B nicht geändert, der soll mit "weiter" oder pfeiltaste die länge von b variieren.

folie: "Das Weltmodell eines LLM":

lass den user die nächsten züge wählen, mach daraus ein spiel. schlage ihm durch ne visualisierung valide positionen vor, wo er klicken kann. benenne die achsen des spiels, so dass man A5 oder so sieht und klicken kann und der dann sieht wo man geklickt hat und da passende punkte hinmacht und den user so spielen lässt gegen den rechner.


