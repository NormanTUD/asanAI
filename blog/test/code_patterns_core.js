"use strict";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVG_NS = "http://www.w3.org/2000/svg";

const FAMILY_LABEL = {
  creational: "Kreational",
  structural: "Struktural",
  behavioral: "Verhalten"
};

const FAMILY_COLOR = {
  dark: { creational: "#e8b45a", structural: "#5eead4", behavioral: "#c084fc" },
  light: { creational: "#a9660a", structural: "#0f8e7d", behavioral: "#8b4fd6" }
};

const ICON_ATTR = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  truck: '<svg viewBox="0 0 64 48" ' + ICON_ATTR + '><rect x="3" y="13" width="31" height="20" rx="3"/><path d="M34 20h13l9 9v4H34Z"/><circle cx="14" cy="37" r="4"/><circle cx="48" cy="37" r="4"/><path d="M3 33h7M20 33h20M54 33h7"/></svg>',
  ship: '<svg viewBox="0 0 64 48" ' + ICON_ATTR + '><path d="M6 30h52l-8 11H14Z"/><path d="M32 5v25"/><path d="M32 8l15 16H32Z"/><path d="M32 13 20 24h12Z"/><path d="M22 35v6M42 35v6"/></svg>',
  plane: '<svg viewBox="0 0 64 48" ' + ICON_ATTR + '><path d="M5 27 57 12 40 31l-10-2-7 9-2-11Z"/><path d="M14 36c4 2 9 2 13 0"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a6 6 0 0 0-3-11Z"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
  projector: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="13" height="9" rx="2"/><circle cx="16" cy="12.5" r="2.5"/><path d="M20 9l2-2M20 16l2 2"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="15" r="3.5"/><circle cx="12" cy="7" r="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5Z"/></svg>'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const formatEUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
}).format;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlight(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:class|const|let|var|new|static|return|if|else|for|of|in|while|throw|try|catch|function|this|extends|super|async|await|switch|case|break|default|export|import|from|typeof|instanceof|true|false|null|undefined|get|set|void|delete|yield)\b)|(#\w+)|(\b[A-Z][A-Za-z0-9_]*\b)/g;
  let out = "";
  let last = 0;
  let match;
  while ((match = re.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, match.index));
    if (match[1]) out += '<span class="tok-com">' + escapeHtml(match[1]) + "</span>";
    else if (match[2]) out += '<span class="tok-str">' + escapeHtml(match[2]) + "</span>";
    else if (match[3]) out += '<span class="tok-num">' + escapeHtml(match[3]) + "</span>";
    else if (match[4]) out += '<span class="tok-kw">' + escapeHtml(match[4]) + "</span>";
    else if (match[5]) out += '<span class="tok-priv">' + escapeHtml(match[5]) + "</span>";
    else if (match[6]) out += '<span class="tok-type">' + escapeHtml(match[6]) + "</span>";
    last = match.index + match[0].length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}

function labTools() {
  const cleanups = [];
  const timers = new Set();
  return {
    on(node, type, handler) {
      if (!node) return;
      node.addEventListener(type, handler);
      cleanups.push(() => node.removeEventListener(type, handler));
    },
    later(handler, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        handler();
      }, ms);
      timers.add(id);
      return id;
    },
    add(handler) {
      cleanups.push(handler);
    },
    dispose() {
      timers.forEach(clearTimeout);
      timers.clear();
      cleanups.forEach((handler) => handler());
    }
  };
}

function flashNode(node) {
  if (!node) return;
  node.classList.remove("is-flash", "flash");
  void node.offsetWidth;
  node.classList.add(node.classList.contains("heap-chip") ? "flash" : "is-flash");
}

function pulseLine(svg, x1, y1, x2, y2) {
  if (!svg || !svg.isConnected || REDUCED) return;
  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("r", "4");
  dot.setAttribute("class", "wire-pulse");
  svg.appendChild(dot);
  const start = performance.now();
  const duration = 540;
  function step(now) {
    if (!dot.isConnected) return;
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    dot.setAttribute("cx", String(x1 + (x2 - x1) * eased));
    dot.setAttribute("cy", String(y1 + (y2 - y1) * eased));
    dot.setAttribute("opacity", String(1 - progress * 0.65));
    if (progress < 1) requestAnimationFrame(step);
    else dot.remove();
  }
  requestAnimationFrame(step);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function familyColor(family) {
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  return FAMILY_COLOR[theme][family];
}

const COFFEE_BASE = {
  espresso: { label: "Espresso", price: 2.0, color: "#5a3423", cls: "Espresso" },
  house: { label: "House Blend", price: 2.5, color: "#6b3f2a", cls: "HouseBlend" },
  dark: { label: "Dark Roast", price: 3.0, color: "#3b2318", cls: "DarkRoast" }
};

const TOPPINGS = [
  { id: "milk", label: "Milch", price: 0.5, color: "#f0e2c8", cls: "Milk" },
  { id: "mocha", label: "Mocha", price: 0.7, color: "#8b5e3c", cls: "Mocha" },
  { id: "whip", label: "Sahne", price: 0.6, color: "#fff8ea", cls: "Whip" },
  { id: "soy", label: "Soja", price: 0.4, color: "#dfcfa5", cls: "Soy" },
  { id: "shot", label: "Extra Shot", price: 0.9, color: "#2d1a10", cls: "ExtraShot" },
  { id: "caramel", label: "Karamell", price: 0.5, color: "#c98b3a", cls: "Caramel" }
];

const INGREDIENTS = [
  { id: "sauce", name: "Sauce", price: 0.3, color: "#b45309", h: 9 },
  { id: "lettuce", name: "Salat", price: 0.4, color: "#4ade80", h: 11 },
  { id: "tomato", name: "Tomate", price: 0.5, color: "#f87171", h: 11 },
  { id: "patty", name: "Patty", price: 2.8, color: "#92400e", h: 21 },
  { id: "cheese", name: "Käse", price: 0.8, color: "#fbbf24", h: 9 },
  { id: "bacon", name: "Bacon", price: 1.2, color: "#ef4444", h: 9 }
];

const PRODUCTS = {
  truck: { factory: "RoadLogistics", name: "Truck", verb: "liefert über die Straße", icon: ICONS.truck },
  ship: { factory: "SeaLogistics", name: "Ship", verb: "liefert über das Meer", icon: ICONS.ship },
  plane: { factory: "AirLogistics", name: "Airplane", verb: "liefert durch die Luft", icon: ICONS.plane }
};

const PROTO_COLORS = [
  { name: "Amber", hex: "#e8b45a" },
  { name: "Teal", hex: "#5eead4" },
  { name: "Violet", hex: "#c084fc" },
  { name: "Rose", hex: "#fb7185" },
  { name: "Sky", hex: "#7dd3fc" }
];

const PROTO_TAGS = ["rund", "klein", "glänzend", "leicht", "matt", "groß"];

function bubbleFrames(input) {
  const values = [...input];
  const frames = [];
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;
  const push = (active) => {
    frames.push({ values: [...values], active: [...active], sorted: [...sorted], comparisons, swaps });
  };
  push([]);
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = 0; j < values.length - 1 - i; j++) {
      comparisons++;
      push([j, j + 1]);
      if (values[j] > values[j + 1]) {
        const temp = values[j];
        values[j] = values[j + 1];
        values[j + 1] = temp;
        swaps++;
        push([j, j + 1]);
      }
    }
    sorted.unshift(values.length - 1 - i);
    push([]);
  }
  sorted.unshift(0);
  push([]);
  return frames;
}

function insertionFrames(input) {
  const values = [...input];
  const frames = [];
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;
  const push = (active) => {
    frames.push({ values: [...values], active: [...active], sorted: [...sorted], comparisons, swaps });
  };
  push([]);
  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    let j = i - 1;
    push([i]);
    while (j >= 0) {
      comparisons++;
      push([j, j + 1]);
      if (values[j] > value) {
        values[j + 1] = values[j];
        swaps++;
        j--;
        push([j + 1]);
      } else {
        break;
      }
    }
    values[j + 1] = value;
    sorted.length = 0;
    for (let k = 0; k <= i; k++) sorted.push(k);
    push([j + 1]);
  }
  sorted.length = 0;
  for (let k = 0; k < values.length; k++) sorted.push(k);
  push([]);
  return frames;
}

function selectionFrames(input) {
  const values = [...input];
  const frames = [];
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;
  const push = (active) => {
    frames.push({ values: [...values], active: [...active], sorted: [...sorted], comparisons, swaps });
  };
  push([]);
  for (let i = 0; i < values.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < values.length; j++) {
      comparisons++;
      push([min, j]);
      if (values[j] < values[min]) min = j;
    }
    if (min !== i) {
      const temp = values[i];
      values[i] = values[min];
      values[min] = temp;
      swaps++;
      push([i, min]);
    }
    sorted.push(i);
    push([]);
  }
  sorted.push(values.length - 1);
  push([]);
  return frames;
}
