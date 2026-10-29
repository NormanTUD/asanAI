"use strict";

PATTERNS.push(
  {
    id: "facade",
    no: "07",
    name: "Facade",
    family: "structural",
    familyLabel: "Struktural",
    tagline: "Ein Knopf für fünf Systeme.",
    lede: "Fünf Subsysteme, eine Taste: Die Fassade bündelt häufige Aufrufe hinter einer einfachen Methode. Sie versteckt Komplexität, ohne die darunterliegenden Teile unerreichbar zu machen.",
    when: "Wenn ein Subsystem mächtig, aber für den Normalfall zu umständlich ist und du wiederkehrende Abläufe bündeln willst.",
    pitfall: "Die Fassade kann zur God Class werden, wenn sie jede Sonderlocke einsammelt. Sie soll den häufigen Weg vereinfachen, nicht jeden.",
    analogy: "Der Hauptschalter im Kino: Ein Griff, und Licht, Leinwand, Ton und Film starten in der richtigen Reihenfolge.",
    code: `class HomeTheaterFacade {
  constructor(lights, screen, projector, sound, stream) {
    this.lights = lights;
    this.screen = screen;
    this.projector = projector;
    this.sound = sound;
    this.stream = stream;
  }

  watchMovie(title) {
    this.lights.dim(20);
    this.screen.down();
    this.projector.on();
    this.sound.on();
    this.sound.volume(7);
    return this.stream.play(title);
  }
}

const cinema = new HomeTheaterFacade(
  lights, screen, projector, sound, stream
);

cinema.watchMovie("Dune");`,
    render: renderFacade
  },
  {
    id: "proxy",
    no: "08",
    name: "Proxy",
    family: "structural",
    familyLabel: "Struktural",
    tagline: "Derselbe Eingang, aber mit Türsteher.",
    lede: "Der Proxy sieht aus wie das Original, ist aber ein Türsteher. Er kontrolliert Zugriff, lädt teure Dinge erst bei Bedarf oder merkt sich Ergebnisse.",
    when: "Für Zugriffskontrolle, Lazy Loading, Caching oder Logging, ohne die eigentliche Klasse zu verändern.",
    pitfall: "Ein Proxy ist selten vollständig transparent: Latenz, Fehler und Cache-Verhalten ändern sich. Cache-Invalidierung bleibt die schwierigste Disziplin.",
    analogy: "Die Rezeption im Bürogebäude: Sie sieht aus wie der Eingang, entscheidet aber, wer durchkommt.",
    code: `class Vault {
  #docs = new Map([
    ["gehalt", "…"],
    ["strategie", "…"]
  ]);

  read(doc) {
    return this.#docs.get(doc);
  }
}

class VaultProxy {
  #vault = new Vault();
  #cache = new Map();

  read(doc, user) {
    if (user.role !== "admin") {
      throw new Error("403 – kein Zugriff");
    }
    if (this.#cache.has(doc)) {
      return { data: this.#cache.get(doc), cached: true };
    }
    const data = this.#vault.read(doc);
    this.#cache.set(doc, data);
    return { data, cached: false };
  }
}

const vault = new VaultProxy();
vault.read("gehalt", { role: "admin" });
vault.read("gehalt", { role: "admin" }); // cached`,
    render: renderProxy
  },
  {
    id: "observer",
    no: "09",
    name: "Observer",
    family: "behavioral",
    familyLabel: "Verhalten",
    tagline: "Einer spricht. Alle hören zu.",
    lede: "Ein Subjekt ändert sich, viele wollen es wissen. Der Observer hält eine Liste von Abonnenten und benachrichtigt sie bei jedem Ereignis, ohne zu wissen, was sie damit tun.",
    when: "Für Events, Live-Updates, UI-Synchronisation und alles, wo Sender und Empfänger lose gekoppelt bleiben sollen.",
    pitfall: "Vergessene Abmeldungen halten Objekte am Leben. Ein fehlerhafter Abonnent darf die anderen nicht blockieren. Bei vielen Events entstehen Update-Stürme.",
    analogy: "Der Newsletter: Du abonnierst einmal und bekommst jede Ausgabe – bis du kündigst.",
    code: `class NewsFeed {
  #subscribers = new Set();

  subscribe(handler) {
    this.#subscribers.add(handler);
    return () => this.#subscribers.delete(handler);
  }

  publish(news) {
    for (const handler of this.#subscribers) {
      handler(news);
    }
  }
}

const feed = new NewsFeed();

const unsubscribe = feed.subscribe((news) => {
  console.log("App:", news);
});

feed.publish("Neues Muster entdeckt");
unsubscribe();`,
    render: renderObserver
  },
  {
    id: "strategy",
    no: "10",
    name: "Strategy",
    family: "behavioral",
    familyLabel: "Verhalten",
    tagline: "Der Algorithmus ist austauschbar.",
    lede: "Der Algorithmus steckt nicht im Client, sondern in austauschbaren Strategie-Objekten. Der Kontext kennt nur die Schnittstelle und kann zur Laufzeit wechseln.",
    when: "Wenn mehrere Varianten eines Algorithmus existieren und die Wahl von Daten, Konfiguration oder Nutzerpräferenz abhängt.",
    pitfall: "Mit nur einer Strategie ist es zusätzliche Indirektion. Der Client muss die Trade-offs der Strategien kennen – die Wahl verschwindet nicht.",
    analogy: "Ein Navi mit Routenoptionen: schnell, kurz, landschaftlich. Die Fahrt bleibt gleich, die Strategie wechselt.",
    code: `class BubbleSort {
  sort(data) {
    const a = [...data];
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < a.length - 1 - i; j++) {
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
        }
      }
    }
    return a;
  }
}

class InsertionSort {
  sort(data) {
    const a = [...data];
    for (let i = 1; i < a.length; i++) {
      const value = a[i];
      let j = i - 1;
      while (j >= 0 && a[j] > value) {
        a[j + 1] = a[j];
        j--;
      }
      a[j + 1] = value;
    }
    return a;
  }
}

class Sorter {
  #strategy;

  constructor(strategy) {
    this.#strategy = strategy;
  }

  setStrategy(strategy) {
    this.#strategy = strategy;
  }

  run(data) {
    return this.#strategy.sort([...data]);
  }
}

const sorter = new Sorter(new BubbleSort());
sorter.setStrategy(new InsertionSort());
sorter.run([9, 2, 7, 4, 1]);`,
    render: renderStrategy
  },
  {
    id: "command",
    no: "11",
    name: "Command",
    family: "behavioral",
    familyLabel: "Verhalten",
    tagline: "Befehle als Objekte: ausführbar, speicherbar, rückgängig.",
    lede: "Ein Befehl wird zum Objekt mit execute und undo. Der Aufrufer muss nicht wissen, wer ihn ausführt – und kann Befehle speichern, in eine Warteschlange legen oder rückgängig machen.",
    when: "Für Undo/Redo, Makros, Queues, Transaktionen und entkoppelte UI-Aktionen.",
    pitfall: "Undo ist nur so gut wie der gespeicherte Zustand. Bei komplexen Änderungen brauchst du saubere Snapshots oder inverse Operationen.",
    analogy: "Ein Fernseher mit Fernbedienung: Jeder Knopf ist ein Befehl, der Fernseher führt ihn aus.",
    code: `class Robot {
  constructor() {
    this.x = 3;
    this.y = 2;
    this.dir = 0;
  }

  state() {
    return { x: this.x, y: this.y, dir: this.dir };
  }

  restore(state) {
    Object.assign(this, state);
  }

  forward() {
    const step = [[0, -1], [1, 0], [0, 1], [-1, 0]][this.dir];
    this.x += step[0];
    this.y += step[1];
  }

  turn(delta) {
    this.dir = (this.dir + delta + 4) % 4;
  }
}

class MoveCommand {
  constructor(robot) {
    this.robot = robot;
    this.before = null;
  }

  execute() {
    this.before = this.robot.state();
    this.robot.forward();
  }

  undo() {
    this.robot.restore(this.before);
  }
}

class Invoker {
  #history = [];
  #redo = [];

  run(command) {
    command.execute();
    this.#history.push(command);
    this.#redo.length = 0;
  }

  undo() {
    const command = this.#history.pop();
    if (command) {
      command.undo();
      this.#redo.push(command);
    }
  }
}`,
    render: renderCommand
  },
  {
    id: "state",
    no: "12",
    name: "State",
    family: "behavioral",
    familyLabel: "Verhalten",
    tagline: "Verhalten ändert sich mit dem Zustand.",
    lede: "Verhalten hängt vom Zustand ab. Statt mit verschachtelten ifs zu prüfen, delegiert das Objekt an ein Zustandsobjekt. Jeder Zustand weiß, was er erlaubt und wohin es weitergeht.",
    when: "Für Zustandsmaschinen, Workflows, UI-Modi und alles mit klaren, endlichen Übergängen.",
    pitfall: "Für zwei Flags ist das Muster Overkill. Bei vielen Zuständen wird die Übergangslogik schnell unübersichtlich – eine Tabelle oder ein Statechart hilft.",
    analogy: "Eine Ampel: Rot, Grün und Gelb verhalten sich unterschiedlich, aber der Übergang ist klar geregelt.",
    code: `class RedState {
  next(light) { light.setState(new GreenState()); }
  label() { return "ROT"; }
}

class GreenState {
  next(light) { light.setState(new YellowState()); }
  label() { return "GRÜN"; }
}

class YellowState {
  next(light) { light.setState(new RedState()); }
  label() { return "GELB"; }
}

class TrafficLight {
  #state = new RedState();

  setState(state) {
    this.#state = state;
  }

  next() {
    this.#state.next(this);
  }

  label() {
    return this.#state.label();
  }
}

const light = new TrafficLight();
light.next(); // GRÜN
light.next(); // GELB
light.next(); // ROT`,
    render: renderState
  }
);

const REGISTER = [
  { name: "Abstract Factory", family: "creational", text: "Familien verwandter Produkte, ohne konkrete Klassen zu nennen." },
  { name: "Bridge", family: "structural", text: "Abstraktion und Implementierung getrennt voneinander variieren." },
  { name: "Composite", family: "structural", text: "Bäume aus Teilen und Ganzen, einheitlich behandelt." },
  { name: "Flyweight", family: "structural", text: "Viele Objekte teilen gemeinsamen Zustand und sparen Speicher." },
  { name: "Chain of Responsibility", family: "behavioral", text: "Eine Anfrage wandert weiter, bis jemand zuständig ist." },
  { name: "Iterator", family: "behavioral", text: "Sequenzieller Zugriff, ohne die Sammlung offenzulegen." },
  { name: "Mediator", family: "behavioral", text: "Viele-zu-viele wird zu vielen-zu-einem." },
  { name: "Memento", family: "behavioral", text: "Zustand einfrieren und später wiederherstellen." },
  { name: "Template Method", family: "behavioral", text: "Skelett in der Basis, Details in den Schritten." },
  { name: "Visitor", family: "behavioral", text: "Operationen von der Struktur trennen, die sie besuchen." }
];

const QUIZ = [
  {
    q: "Genau eine Konfiguration, beim ersten Zugriff geladen, überall derselbe Zugriffspunkt. Welches Muster?",
    options: ["Singleton", "Prototype", "Strategy", "Observer"],
    answer: 0,
    explain: "Das Singleton kontrolliert die Instanziierung und liefert immer dieselbe Instanz."
  },
  {
    q: "Eine alte Drucker-API spricht eine andere Schnittstelle als dein Code. Du willst den Client nicht anfassen.",
    options: ["Builder", "Adapter", "Facade", "State"],
    answer: 1,
    explain: "Der Adapter übersetzt zwischen beiden Schnittstellen, ohne eine Seite zu ändern."
  },
  {
    q: "Ein Knopf soll Licht, Leinwand, Projektor, Ton und Streaming in der richtigen Reihenfolge starten.",
    options: ["Decorator", "Command", "Facade", "Proxy"],
    answer: 2,
    explain: "Die Fassade bündelt den wiederkehrenden Ablauf hinter einer einfachen Methode."
  },
  {
    q: "Leser:innen sollen sich für Updates anmelden und bei jedem neuen Artikel benachrichtigt werden.",
    options: ["Observer", "Factory Method", "Singleton", "Iterator"],
    answer: 0,
    explain: "Das Subjekt führt eine Abonnentenliste und benachrichtigt alle bei Änderungen."
  },
  {
    q: "Ein Objekt soll sich je nach Zustand anders verhalten – ohne ein wucherndes switch.",
    options: ["Prototype", "State", "Builder", "Adapter"],
    answer: 1,
    explain: "Jedes Zustandsobjekt kapselt sein Verhalten und den Übergang zum nächsten Zustand."
  },
  {
    q: "Aktionen sollen ausführbar, in einer History speicherbar und rückgängig machbar sein.",
    options: ["Strategy", "Proxy", "Command", "Facade"],
    answer: 2,
    explain: "Der Befehl wird zum Objekt mit execute und undo; der Invoker verwaltet die History."
  },
  {
    q: "Zur Laufzeit soll zwischen zwei Sortieralgorithmen gewechselt werden können.",
    options: ["Adapter", "Strategy", "Builder", "Observer"],
    answer: 1,
    explain: "Der Kontext delegiert an austauschbare Strategie-Objekte mit gemeinsamem Interface."
  },
  {
    q: "Ein Objekt mit vielen optionalen Zutaten soll lesbar und Schritt für Schritt entstehen.",
    options: ["Singleton", "Builder", "Decorator", "State"],
    answer: 1,
    explain: "Der Builder sammelt Optionen in verketteten Schritten und liefert erst am Ende das Ergebnis."
  }
];
