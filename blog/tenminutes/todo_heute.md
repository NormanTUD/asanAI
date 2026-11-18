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

lass den user die nächsten züge wählen, mach daraus ein spiel. schlage ihm durch ne visualisierung valide positionen vor, wo er klicken kann. benenne die achsen des spiels, so dass man A5 oder so sieht und klicken kann und der dann sieht wo man geklickt hat und da passende punkte hinmacht und den user so spielen lässt gegen den rechner. zeige die züge die daraus das LLM sieht, mach n kleines feuerwerk wenn der user gewinnt.

"Wie ein LLM sein Weltmodell aufbaut": "vom zug zum brett". jedes element in beiden plots da, sowohl oben bei l6 als auch bei dem 32x16 sollte hoverbar sein mit der maus damit ich genau sehen was das ist und warum und was es bedeutet. lese dazu nochmal das paper. das gleicheb ei "vom zug zum brett". es ist da nicht klar, was die linien bei leer, spieler 1 und spieler 2 bedeuten und wie die zum brett mit feld e4 führen. lese auch dazu nochmal das paper. das gleiche gilt für "vom zug zum brett". weil beim übergang zur nächsten folie "warum softmax" diese leiste oben mit dem x mal 512 springt verändert die feldposition von dem grid rechts wo e4 markiert ist die position. das soll nciht passieren. die soll von anfang an so sein in ihrer x y position dass es nicht springt später. unten steht sowas wie "oben: [W[E4, z] \cdot unten : x \cdot W[E4, z] oder "logit[E4, z] = \sigma_d W[E4, z,d] \cdot x[d]". das soll wirklich gerendert werden mit temml. beim übergang zur folie "wie wird daraus ein feld" springt das feld rechts wieder und es wird größer. argmax wird einfach genommen ohne erklärt zu werden woher das kommt. das "spieler 2" links unter dem kreis überlappt sich mit irgendeinem text den ich nicht lesen kann, der pfeil bei spieler 2 unter dem spieler 2 überlagert sich leicht mit dem "spieler 2". die nächste folie zeigt "drei zustände. dreizehn. dann die ganze welt", benenne das um zu "bei othello hat jedes feld 3 zustände (leer, spieler 1, spieler 2). bei schach sind es pro feld 13: ein ganzer unterraum. in modellen der realen welt sind es viel mehr und viel komplexere unterräume".

folie: "Wann starb Turing?":
"... Bei historischen Personen ist die Zielgröße das Todesjahr, nicht die Lebensspanne. Die Daten umfassen Personen, die zwischen 1000 v. Chr. und 2000 n. Chr. gestorben sind. Eine Person wird also durch einen Punkt repräsentiert; Turing zum Beispiel durch 1954, sein Todesjahr. Die Probe liest dieses eine Jahr aus der Aktivierung, nicht die Lebensdauer. ..." das zeigt er nur bis "zwischen 1000 v. Chr." an, danach kommt nix mehr auch wenn da mehr text da ist. der est geht in "fortsetzung". der soll NICHT kram nach fortsetzung machen automatisch. ICH entscheiden was in den boxen ist und was im haupttext indem ich es da eintrage.

folie "Ein Agent ist dasselbe Modell mit Werkzeugen":

zeige da als erstes dass er für ne rechnung, sagen wir die Hardy-Ramanujan-Zahl 1^3 + 12^3 = 1729) einen konsolentaschenrechner (bc) öffnet und den in einer virtuellen konsole nutzt, um das ergebnis zu holen und dann damit weiter rechnet, das soll auch im text passieren. dann erscheint ein browser fenster mit der example.com/shop webasite mit der kaffeemaschine. der browser soll erst auftauchen im fenster rehcts wenn "Ich brauche die Seite. Ich rufe den Browser auf." da steht, vorher ist der aktuell transparent abre soll eig gar nicht da sein. mach den shop etwas komplexer, der user fragt nicht mehr "Öffne example.com/shop und finde den Preis. Schreibe ihn in price.txt." sondern fragt nach dem preis der kaffeemaschine, und da sind mehrere elemente und der sucht sich den preis raus davon. der screenshot soll erst gemacht werden wenn der user explizit danach fragt, vorher soll der html code übergeben und angezeigt werden mit auslassungspunkten drum rum, in einer table die links kaffeemashcine zeigt und rechts den preis (gezeigt als td tr table code)

folie: "Arten von Halluzinationen"

der soll die ganze folie vertikal zentrieren

bei "Intrinsic Frage Quelle: „Das Treffen war 2019.“ Fasse die Quelle zusammen." soll er einen längeren ausschnitt oben zeigen mit auslassungspunkten und dann die falsche antwort geben die der quelle oben widerspricht. gleiches bei "Extrinsic" oben soll der quellentext angezeigt werden (wenn auch fiktiv), aus dem der das extrahieren soll, und er extrahiert es falsch. ads gilt auch für kontext ignoriert usw.

wenn ich von "So werden Halluzinationen seltener" zurückgehe komme ich wieder auf die "falsche fakten" statt auf "sampling" folie

wenn ich bei "So werden Halluzinationen seltener" weiter mache soll er die qulelen schrittweise hinzufügen. die höhe soll sich nicht ändern, zB das "Frage: Wie hoch ist der Eiffelturm mit Antenne? 2 S1 sagt: 330 m mit Antenne. 3 Schluss: Der Eiffelturm ist mit Antenne 330 m hoch. [S1]" hat andere höhe dann. fixe das.

entferne die folie "Suchen, lesen, einsetzen"

bei "Du bist das Chinesische Zimmer": mach 3 fragen die der user beantworten muss. wenn ich einfach weiter mache soll er die richtige frage auswählen und für mich da durch gehen. mach es dass die antworten nicht immer die mittlere sind sondern random sortiert. sage beim text links dass wenn der user zufällig chinesisch kann, dass er dann so tun soll als könne ers nicht for the sake of this game (übersetze das aber auch auf dt.)

bei "Die Gefahren sind nicht eine Sache" soll er die einzelnen punkte durchgehen wenn ich weiter mache, also von "missbrauch" auf "bias und fehler" auf "machtkonzentration" auf "kontrolle verlieren". gleiches bei "Was wirklich fehlt" und "Vier Konflikte".

"Bewusstsein: die offene Frage": 

stelle am anfang die frage, ob KI irgendeine form von qualia hat, gehe dann auf die verschiedenen perspektiven ein. bei global workspace sage dass man sowas ähnliches (den J-Space) gefunden hat, zitier das originalpape,r aber mach klar, dass das nicht heißt, dass da qualia ist, weil keiner weiß, was das überhaupt ist und wie es entsteht. sage, dass die heutige folie dafür da ist, verschiedene philosophische und wissenschaftliche theorien des bewusstseins zu erforschen, aber es keine klare antwort gibt.
