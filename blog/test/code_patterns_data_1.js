"use strict";

const PATTERNS = [
  {
    id: "singleton",
    no: "01",
    name: "Singleton",
    family: "creational",
    familyLabel: "Kreational",
    tagline: "Genau ein Exemplar – überall derselbe Zugriff.",
    lede: "Manche Dinge soll es nur einmal geben: eine Datenbankverbindung, einen Logger, einen Konfigurationsspeicher. Das Singleton kapselt die Erzeugung und gibt bei jedem Aufruf dieselbe Instanz zurück, statt überall <em>new</em> zu rufen.",
    when: "Wenn genau eine Instanz fachlich notwendig ist, die Initialisierung teuer ist und der Zugriffspunkt kontrolliert bleiben soll.",
    pitfall: "Singleton ist oft ein hübsch verpacktes globales Variable. Es erschwert Tests, versteckt Abhängigkeiten und wird in nebenläufigen Systemen schnell zur Race-Condition-Falle. In modernem JavaScript sind ein ES-Modul mit einem Objekt oder Dependency Injection meist die besseren Werkzeuge.",
    analogy: "Der eine Schlüssel zum Serverraum: Wer ihn braucht, holt ihn sich am Empfang – und bekommt immer denselben.",
    code: `class Database {
  static #instance = null;
  #connection;

  constructor() {
    if (Database.#instance) {
      throw new Error("Nutze Database.getInstance()");
    }
    this.#connection = this.connect();
  }

  connect() {
    return { status: "verbunden" };
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }
}

const a = Database.getInstance();
const b = Database.getInstance();

console.log(a === b); // true`,
    render: renderSingleton
  },
  {
    id: "factory-method",
    no: "02",
    name: "Factory Method",
    family: "creational",
    familyLabel: "Kreational",
    tagline: "Die Erzeugung bleibt beim Erzeuger.",
    lede: "Der Client will einen Transport. Ob LKW, Schiff oder Flugzeug, entscheidet die Fabrik. Statt konkrete Klassen zu instanziieren, ruft der Code eine Methode auf, die das passende Produkt zurückgibt.",
    when: "Wenn die konkrete Klasse erst zur Laufzeit feststeht, Konfiguration die Variante bestimmt oder neue Produkte hinzukommen sollen, ohne den Client zu ändern.",
    pitfall: "Für ein einziges Produkt ohne Varianten ist die Fabrik Ballast. Und wer zu viele Factories anlegt, bekommt eine Hierarchie, die niemand mehr überblickt.",
    analogy: "Ein Reisebüro: Du sagst, wohin du willst. Welches Verkehrsmittel dich bringt, entscheidet das Büro.",
    code: `class Transport {
  deliver() {
    throw new Error("deliver() fehlt");
  }
}

class Truck extends Transport {
  deliver() { return "liefert über die Straße"; }
}

class Ship extends Transport {
  deliver() { return "liefert über das Meer"; }
}

class Logistics {
  createTransport() {
    throw new Error("createTransport() fehlt");
  }

  planDelivery() {
    const transport = this.createTransport();
    return transport.deliver();
  }
}

class RoadLogistics extends Logistics {
  createTransport() { return new Truck(); }
}

class SeaLogistics extends Logistics {
  createTransport() { return new Ship(); }
}

const route = new SeaLogistics();
route.planDelivery(); // "liefert über das Meer"`,
    render: renderFactory
  },
  {
    id: "builder",
    no: "03",
    name: "Builder",
    family: "creational",
    familyLabel: "Kreational",
    tagline: "Komplexe Objekte in ruhigen Schritten.",
    lede: "Ein Burger mit allem? Oder doch ohne Speck? Wenn ein Objekt viele optionale Teile hat, wird der Konstruktor schnell zur Wundertüte. Der Builder baut es Schritt für Schritt und liefert erst am Ende ein fertiges Ergebnis.",
    when: "Wenn Konstruktoren viele Parameter haben, Optionen kombiniert werden oder das Ergebnis unveränderlich sein soll.",
    pitfall: "Für ein Objekt mit zwei Feldern ist der Builder Overkill. Und wenn der Builder selbst Fachlogik versteckt, wird er zum halben Domänenmodell.",
    analogy: "Die Bestellkarte im Burger-Laden: Jede Zutat wird einzeln angekreuzt, am Ende steht ein vollständiger Burger.",
    code: `class BurgerBuilder {
  #layers = [];
  #price = 0;

  bun() {
    this.#layers.push("Bun");
    this.#price += 1.2;
    return this;
  }

  patty() {
    this.#layers.push("Patty");
    this.#price += 2.8;
    return this;
  }

  cheese() {
    this.#layers.push("Käse");
    this.#price += 0.8;
    return this;
  }

  build() {
    if (!this.#layers.includes("Patty")) {
      throw new Error("Ein Burger braucht ein Patty");
    }
    return {
      layers: [...this.#layers],
      price: this.#price
    };
  }
}

const burger = new BurgerBuilder()
  .bun()
  .patty()
  .cheese()
  .build();`,
    render: renderBuilder
  },
  {
    id: "prototype",
    no: "04",
    name: "Prototype",
    family: "creational",
    familyLabel: "Kreational",
    tagline: "Kopieren statt neu bauen.",
    lede: "Statt ein komplex konfiguriertes Objekt von Grund auf neu zu bauen, kopierst du es. Das Prototype-Muster klont ein bestehendes Exemplar. Wichtig ist dabei die Frage: flach oder tief?",
    when: "Wenn die Erzeugung teuer ist, viele ähnliche Objekte entstehen oder du Snapshots für Undo benötigst.",
    pitfall: "Flaches Kopieren teilt verschachtelte Objekte. Eine Änderung am Klon überrascht dann das Original. structuredClone hilft bei Daten, verliert aber Funktionen und Klassen.",
    analogy: "Ein Gipsabdruck: Die Form ist schon da, du musst nicht jedes Detail neu modellieren.",
    code: `class Shape {
  constructor(color, tags = []) {
    this.color = color;
    this.tags = tags;
  }

  clone() {
    return new Shape(this.color, [...this.tags]);
  }
}

const original = new Shape("amber", ["rund"]);
const copy = original.clone();

copy.color = "cyan";
copy.tags.push("klein");

console.log(original.color); // "amber"
console.log(original.tags);  // ["rund"]

const deep = structuredClone(original);`,
    render: renderPrototype
  },
  {
    id: "adapter",
    no: "05",
    name: "Adapter",
    family: "structural",
    familyLabel: "Struktural",
    tagline: "Passt nicht? Dann bau den Zwischenstecker.",
    lede: "Dein Code erwartet eine Schnittstelle, das alte System spricht eine andere. Der Adapter sitzt dazwischen, übersetzt Aufrufe und lässt beide Seiten unangetastet.",
    when: "Wenn du Legacy-Code, Fremdbibliotheken oder externe APIs integrieren musst, ohne deren Schnittstelle zu ändern.",
    pitfall: "Ein Adapter soll übersetzen, nicht Geschäftslogik verstecken. Viele Adapter übereinander sind ein Zeichen dafür, dass die Schnittstellen nicht zusammenpassen.",
    analogy: "Der Reiseadapter: Der Stecker bleibt, die Steckdose bleibt – nur das dazwischen ist neu.",
    code: `class UsSocket {
  plugIn(device) {
    return device.start() + " – sauber angeschlossen.";
  }
}

class EuDevice {
  constructor(name) {
    this.name = name;
    this.voltage = 230;
  }

  start() {
    return this.name + " startet mit " + this.voltage + " V";
  }
}

class EuToUsAdapter {
  constructor(device) {
    this.device = device;
  }

  start() {
    return this.device.start() + " (Adapter: 230 V → 120 V)";
  }
}

const socket = new UsSocket();
const lamp = new EuDevice("Lampe");

socket.plugIn(new EuToUsAdapter(lamp));`,
    render: renderAdapter
  },
  {
    id: "decorator",
    no: "06",
    name: "Decorator",
    family: "structural",
    familyLabel: "Struktural",
    tagline: "Verhalten umhüllen, nicht vererben.",
    lede: "Milch, Mocha, Sahne? Beim Decorator wird Verhalten nicht durch Vererbung, sondern durch Umhüllen hinzugefügt. Jeder Wrapper kennt das gleiche Interface und reicht den Aufruf weiter.",
    when: "Wenn du Funktionen zur Laufzeit kombinieren willst und Unterklassen für jede Kombination explodieren würden.",
    pitfall: "Viele kleine Wrapper machen Stacktraces und Debugging unübersichtlich. Die Reihenfolge der Dekoration kann das Ergebnis verändern.",
    analogy: "Zwiebelprinzip: Jede Schicht tut etwas und reicht den Rest nach innen weiter.",
    code: `class Espresso {
  cost() { return 2.0; }
  label() { return "Espresso"; }
}

class Milk {
  constructor(coffee) { this.coffee = coffee; }
  cost() { return this.coffee.cost() + 0.5; }
  label() { return this.coffee.label() + " + Milch"; }
}

class Mocha {
  constructor(coffee) { this.coffee = coffee; }
  cost() { return this.coffee.cost() + 0.7; }
  label() { return this.coffee.label() + " + Mocha"; }
}

const order = new Mocha(new Milk(new Espresso()));

console.log(order.label()); // "Espresso + Milch + Mocha"
console.log(order.cost());  // 3.2`,
    render: renderDecorator
  }
];
