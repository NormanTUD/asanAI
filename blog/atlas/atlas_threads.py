#!/usr/bin/env python3
"""Atlas threads — curated influence / journey / signal lines between entities.

Reads the entity index (raw/out_part*.json -> entities.json) and resolves a
hand-curated list of named relationships into thread records with real entity
ids. Deterministic and self-validating: every referenced id must exist.

Usage:
  python3 atlas_threads.py --test    run fixture tests
  python3 atlas_threads.py --build   write threads.json next to this file
"""

import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, "raw", "entity_index.txt")


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s)
                   if not unicodedata.combining(c))


def norm(s):
    s = (s or "").lower().strip()
    s = re.sub(r"\s*\([^)]*\)\s*$", "", s)
    s = strip_accents(s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def load_index():
    if os.path.exists(INDEX):
        lines = [l.rstrip("\n") for l in open(INDEX, encoding="utf-8") if l.strip()]
    else:
        ents = json.load(open(os.path.join(HERE, "entities.json"), encoding="utf-8"))
        lines = ["%s | %s | %s | %s | %.2f,%.2f" % (
            e["id"], e["type"], e["name"], e.get("years", ""), e["lat"], e["lng"])
            for e in ents]
    by_name = {}
    by_id = {}
    for l in lines:
        p = [x.strip() for x in l.split("|")]
        eid, etype, ename = p[0], p[1], p[2]
        by_id[eid] = (etype, ename)
        by_name.setdefault(norm(ename), eid)
    return by_name, by_id


def resolve(by_name, name):
    n = norm(name)
    if n in by_name:
        return by_name[n]
    for k, v in by_name.items():
        nk = norm(k)
        if nk == n or (n and (n in nk or nk in n)):
            return v
    return None


# (kind, from_name, to_name, y1, y2, label)
INFLUENCE = [
    # antiquity -> math
    ("influence", "Thales of Miletus", "Pythagoras", -585, -500, "Greek geometry begins"),
    ("influence", "Pythagoras", "Euclid", -530, -300, "Number and proof"),
    ("influence", "Euclid", "Claudius Ptolemy", -300, -150, "The Elements carried forward"),
    ("influence", "Archimedes of Syracuse", "Galileo Galilei", -212, 1564, "Mathematics applied to nature"),
    ("influence", "Syracuse", "Archimedes of Syracuse", -289, -212, "Home of Archimedes"),
    ("influence", "Madhava of Sangamagrama", "Isaac Newton", 1400, 1665, "Kerala series foreshadow calculus"),
    ("influence", "Brahmagupta", "Bhaskara I", 628, 650, "Indian algebra and zero"),
    ("influence", "Aryabhata", "Bhaskara I", 499, 600, "Indian astronomy"),
    ("influence", "Kusumapura", "Aryabhata", 400, 500, "School of Nalanda"),
    ("influence", "India", "Baghdad", 700, 800, "Numerals and zero travel west"),
    ("influence", "al-Kindi", "al-Khwarizmi", 800, 830, "House of Wisdom circle"),
    ("influence", "al-Khwarizmi", "Continental Europe", 830, 1150, "Algebra and algorithms arrive"),
    ("influence", "House of Wisdom", "Continental Europe", 830, 1150, "Translation movement"),
    ("influence", "Ibn al-Haytham", "Johannes Kepler", 1011, 1600, "Optics across centuries"),
    ("influence", "China", "Baghdad", 100, 751, "Paper reaches the Islamic world"),
    ("influence", "Baghdad", "Continental Europe", 800, 1200, "Knowledge flows to Europe"),
    # early modern math
    ("influence", "Nicolaus Copernicus", "Johannes Kepler", 1543, 1600, "Heliocentrism to orbits"),
    ("influence", "Johannes Kepler", "Isaac Newton", 1609, 1687, "Laws of motion and gravity"),
    ("influence", "Isaac Newton", "Gottfried Wilhelm Leibniz", 1666, 1675, "Calculus in parallel"),
    ("influence", "Isaac Newton", "Leonhard Euler", 1687, 1727, "Analysis matures"),
    ("influence", "Gottfried Wilhelm Leibniz", "Leonhard Euler", 1684, 1727, "Notation and methods"),
    ("influence", "Leonhard Euler", "Joseph-Louis Lagrange", 1748, 1766, "The calculus of variations"),
    ("influence", "Joseph-Louis Lagrange", "Pierre-Simon Laplace", 1774, 1795, "Analysis and probability"),
    ("influence", "Pierre-Simon Laplace", "Augustin-Louis Cauchy", 1795, 1820, "Rigorous analysis"),
    ("influence", "Jean-Baptiste Joseph Fourier", "Augustin-Louis Cauchy", 1822, 1829, "Series and convergence"),
    ("influence", "Augustin-Louis Cauchy", "Bernhard Riemann", 1829, 1854, "Foundations of analysis"),
    ("influence", "Hermann Grassmann", "David Hilbert", 1844, 1900, "Abstract algebraic structure"),
    ("influence", "August Ferdinand M\u00f6bius", "Bernhard Riemann", 1827, 1854, "Topology is born"),
    ("influence", "Bernhard Riemann", "Egbert van Kampen", 1854, 1930, "Geometry to topology"),
    ("influence", "Enrico Betti", "Karel Cech", 1878, 1930, "Homology across generations"),
    ("influence", "Karel Cech", "Jean Leray", 1930, 1945, "Sheaf theory"),
    ("influence", "Jean Leray", "Jean-Pierre Serre", 1945, 1953, "Algebraic topology"),
    ("influence", "Samuel Eilenberg", "Saunders Mac Lane", 1945, 1960, "Category theory"),
    ("influence", "Saunders Mac Lane", "Steve Awodey", 1960, 2010, "Categories and logic"),
    ("influence", "Haskell Curry", "Steve Awodey", 1930, 2000, "Curry-Howard correspondence"),
    ("influence", "Gottlob Frege", "Alfred Tarski", 1879, 1936, "Logic and truth"),
    ("influence", "Alfred Tarski", "Alan Turing", 1936, 1936, "Logic to computability"),
    ("influence", "Bertrand Russell", "Alan Turing", 1910, 1936, "Foundations and machines"),
    ("influence", "George Boole", "Claude Shannon", 1854, 1938, "Boolean algebra to circuits"),
    ("influence", "Ada Lovelace", "Alan Turing", 1843, 1936, "The first algorithm"),
    ("influence", "Charles Babbage", "Ada Lovelace", 1833, 1843, "The difference engine"),
    ("influence", "Charles Babbage", "Howard Aiken", 1837, 1937, "Mechanics to the Mark I"),
    ("influence", "Wolfgang von Kempelen", "Charles Babbage", 1770, 1822, "The mechanical thinking machine"),
    ("influence", "Jacquard loom", "Charles Babbage", 1804, 1837, "Punch cards program the engine"),
    ("influence", "Johannes Gutenberg", "Continental Europe", 1440, 1500, "The printing press spreads ideas"),
    # computing
    ("influence", "Claude Shannon", "Alan Turing", 1938, 1936, "Information meets computation"),
    ("influence", "Alan Turing", "John von Neumann", 1936, 1945, "Computation to architecture"),
    ("influence", "Konrad Zuse", "John von Neumann", 1941, 1945, "Binary computing, independently"),
    ("influence", "Howard Aiken", "IBM 702 debut, 1953", 1944, 1953, "From Mark I to commercial machines"),
    ("influence", "John von Neumann", "ENIAC unveiled", 1945, 1946, "The stored-program idea"),
    ("influence", "Alan Turing", "Dartmouth Workshop, 1956", 1950, 1956, "The Imitation Game to AI"),
    # neural networks
    ("influence", "Camillo Golgi", "Santiago Ramon y Cajal", 1873, 1888, "The neuron doctrine"),
    ("influence", "Santiago Ramon y Cajal", "Walter Pitts", 1899, 1943, "Neuroscience to neurons"),
    ("influence", "Louis Lapicque", "Walter Pitts", 1907, 1943, "Excitable membranes"),
    ("influence", "Warren McCulloch", "Frank Rosenblatt", 1943, 1958, "The McCulloch-Pitts neuron"),
    ("influence", "Walter Pitts", "Frank Rosenblatt", 1943, 1958, "The formal neuron"),
    ("influence", "Frank Rosenblatt", "Marvin Minsky", 1958, 1962, "Perceptrons to their critics"),
    ("influence", "Frank Rosenblatt", "Perceptron Navy press conference, 1958", 1957, 1958, "The perceptron announced"),
    ("influence", "Marvin Minsky", "Dartmouth Workshop, 1956", 1950, 1956, "Co-organizer of AI"),
    ("influence", "John McCarthy", "Dartmouth Workshop, 1956", 1955, 1956, "Named the field"),
    ("influence", "Claude Shannon", "Marvin Minsky", 1948, 1956, "Information theory to AI"),
    ("influence", "Wilhelm Lenz", "Ernst Ising", 1920, 1925, "The Ising model"),
    ("influence", "Ernst Ising", "John J. Hopfield", 1925, 1982, "Statistical physics to memories"),
    ("influence", "John J. Hopfield", "Geoffrey Hinton", 1982, 1986, "Boltzmann machines"),
    ("influence", "Seppo Linnainmaa", "Paul Werbos", 1973, 1974, "Reverse-mode autodiff"),
    ("influence", "Paul Werbos", "David Rumelhart", 1974, 1986, "Backpropagation rediscovered"),
    ("influence", "David Rumelhart", "Geoffrey Hinton", 1986, 1986, "Backpropagation to deep learning"),
    ("influence", "Geoffrey Hinton", "Yoshua Bengio", 1986, 2006, "The deep learning trio"),
    ("influence", "Geoffrey Hinton", "Yann LeCun", 1986, 1998, "Convolutional networks"),
    ("influence", "Geoffrey Hinton", "Ilya Sutskever", 2009, 2012, "Deep learning at Google"),
    ("influence", "Kunihiko Fukushima", "Yann LeCun", 1980, 1998, "Neocognitron to LeNet"),
    ("influence", "David Hubel", "Kunihiko Fukushima", 1962, 1980, "Visual cortex to neocognitron"),
    ("influence", "Torsten Wiesel", "David Hubel", 1958, 1962, "Feature detectors in the cortex"),
    ("influence", "Alex Krizhevsky", "AlexNet ImageNet victory", 2012, 2012, "Deep vision wins"),
    ("influence", "Geoffrey Hinton", "AlexNet ImageNet victory", 2012, 2012, "The deep learning turning point"),
    ("influence", "Karen Simonyan", "Kaiming He", 2014, 2015, "VGG to ResNet"),
    ("influence", "Ashish Vaswani", "Alec Radford", 2017, 2018, "Attention to GPT"),
    ("influence", "Alec Radford", "ChatGPT launch", 2018, 2022, "GPT to ChatGPT"),
    ("influence", "Ilya Sutskever", "Ashish Vaswani", 2012, 2017, "The Transformer team"),
    ("influence", "Yoshua Bengio", "Ilya Sutskever", 2006, 2012, "Sequence models"),
    ("influence", "Tomas Mikolov", "Dzmitry Bahdanau", 2013, 2014, "word2vec to attention"),
    ("influence", "Dzmitry Bahdanau", "Kyunghyun Cho", 2014, 2014, "Attention and the GRU"),
    ("influence", "Kyunghyun Cho", "Ashish Vaswani", 2014, 2017, "Sequence modeling to Transformers"),
    ("influence", "Noam Shazeer", "Ashish Vaswani", 2015, 2017, "Building the Transformer"),
    ("influence", "Volodymyr Mnih", "Richard Sutton", 2013, 2015, "Deep reinforcement learning"),
    ("influence", "Richard Sutton", "Volodymyr Mnih", 1988, 2013, "RL theory to DQN"),
    ("influence", "Andrew Barto", "Richard Sutton", 1977, 1988, "Reinforcement learning"),
    ("influence", "Richard Bellman", "Andrew Barto", 1957, 1977, "Dynamic programming to RL"),
    ("influence", "George A. Miller", "Herbert A. Simon", 1952, 1956, "The cognitive revolution"),
    ("influence", "Allen Newell", "Herbert A. Simon", 1955, 1956, "The Logic Theorist"),
    ("influence", "George Cybenko", "David Rumelhart", 1989, 1986, "Universal approximation"),
    ("influence", "Vladimir Vapnik", "Bernhard Scholkopf", 1995, 1997, "Kernel methods"),
    # probability and statistics
    ("influence", "Chevalier de Mere", "Blaise Pascal", 1654, 1654, "The problem of points"),
    ("influence", "Gerolamo Cardano", "Blaise Pascal", 1564, 1654, "Games of chance"),
    ("influence", "Blaise Pascal", "Pierre de Fermat", 1654, 1654, "The birth of probability"),
    ("influence", "Thomas Bayes", "Pierre-Simon Laplace", 1763, 1774, "Bayesian reasoning"),
    ("influence", "Andrey Markov", "Richard Bellman", 1906, 1957, "Markov chains to MDPs"),
    ("influence", "Ludwig Boltzmann", "Andrey Markov", 1877, 1906, "Statistical mechanics"),
    ("influence", "James Clerk Maxwell", "Ludwig Boltzmann", 1860, 1877, "Kinetic theory"),
    ("influence", "Ronald Fisher", "Claude Shannon", 1918, 1948, "Inference to information"),
    ("influence", "Claude Shannon", "Solomon Kullback", 1948, 1951, "Entropy to divergence"),
    ("influence", "Ray Solomonoff", "Marcus Hutter", 1964, 2000, "Algorithmic induction"),
    ("influence", "I. J. Good", "Claude Shannon", 1946, 1948, "Bell Labs statistics"),
    # language
    ("influence", "Panini", "Noam Chomsky", -400, 1957, "Grammar across millennia"),
    ("influence", "Pingala", "Panini", -300, -400, "Meter to combinatorics"),
    ("influence", "Ferdinand de Saussure", "Noam Chomsky", 1916, 1957, "Structural linguistics"),
    ("influence", "Noam Chomsky", "George A. Miller", 1957, 1957, "The psychology of language"),
    ("influence", "John Zellig Harris", "Frederick Jelinek", 1954, 1973, "Distributional semantics to statistics"),
    ("influence", "J. R. Firth", "John Zellig Harris", 1957, 1954, "Corpus linguistics"),
    ("influence", "George Kingsley Zipf", "John Zellig Harris", 1949, 1954, "Zipf's law"),
    ("influence", "Frederick Jelinek", "Tomas Mikolov", 1973, 2013, "Statistical NLP to word2vec"),
    ("influence", "Rosetta Stone", "Jean-Francois Champollion", 1799, 1822, "The key to hieroglyphs"),
    ("influence", "Jean-Francois Champollion", "Decipherment of Egyptian hieroglyphs, 1822", 1814, 1822, "The decipherment"),
    # hardware (the untold history)
    ("influence", "Alessandro Volta", "Voltaic pile", 1800, 1800, "The first battery"),
    ("influence", "Voltaic pile", "Michael Faraday", 1800, 1831, "Electricity to electromagnetism"),
    ("influence", "Michael Faraday", "Faraday electromagnetic induction", 1831, 1831, "Induction discovered"),
    ("influence", "Michael Faraday", "Nikola Tesla", 1831, 1882, "Fields to alternating current"),
    ("influence", "Nikola Tesla", "Tesla alternating-current system", 1882, 1888, "The AC system"),
    ("influence", "Samuel Morse", "First transatlantic telegraph", 1844, 1858, "The telegraph"),
    ("influence", "Joseph Nicéphore Niepce", "First permanent photograph", 1826, 1826, "The first photograph"),
    ("influence", "John Bardeen", "Invention of the transistor", 1947, 1947, "The transistor"),
    ("influence", "Jack Kilby", "First integrated circuit", 1958, 1958, "The IC, Texas Instruments"),
    ("influence", "Robert Noyce", "First integrated circuit", 1958, 1959, "The IC, Fairchild"),
    ("influence", "Invention of the transistor", "First integrated circuit", 1947, 1958, "Transistor to IC"),
    ("influence", "Ed Roberts", "Altair 8800", 1974, 1975, "The first personal computer"),
    ("influence", "Bill Gates", "Altair 8800", 1975, 1975, "Altair BASIC"),
    ("influence", "Paul Allen", "Altair 8800", 1975, 1975, "Altair BASIC"),
    ("influence", "IBM PC release, 1981", "Bill Gates", 1981, 1981, "MS-DOS"),
    ("influence", "Dan Bricklin", "IBM PC release, 1981", 1979, 1981, "VisiCalc"),
    # web and scale
    ("influence", "CERN", "World Wide Web", 1989, 1991, "The web is proposed"),
    ("influence", "First ARPANET message", "World Wide Web", 1969, 1991, "Network to web"),
    ("influence", "World Wide Web", "ChatGPT launch", 1991, 2022, "The web becomes LLM training data"),
    # moon and space (untold history)
    ("influence", "William Chamberlain", "Thomas Etter", 1960, 1964, "Lunar image processing at JPL"),
    ("influence", "Thomas Etter", "JPL", 1960, 1964, "Enhancing Ranger 7 images"),
    ("influence", "NASA", "JPL", 1958, 1964, "The space program"),
    ("influence", "JPL", "Apollo 11 Moon landing", 1961, 1969, "Guidance and imagery"),
]

# (person_name, [stop names], y1, y2)
JOURNEYS = [
    ("Aryabhata", ["Kusumapura"], 476, 550),
    ("al-Khwarizmi", ["Baghdad"], 780, 850),
    ("Ibn al-Haytham", ["Cairo"], 965, 1040),
    ("Madhava of Sangamagrama", ["Kerala (Sangamagrama)"], 1350, 1425),
    ("Archimedes of Syracuse", ["Syracuse"], -289, -212),
    ("Galileo Galilei", ["Florence", "Rome"], 1564, 1642),
    ("René Descartes", ["France", "Amsterdam"], 1596, 1650),
    ("Isaac Newton", ["Cambridge", "London"], 1643, 1727),
    ("Gottfried Wilhelm Leibniz", ["Hanover", "Paris", "Berlin"], 1646, 1716),
    ("Leonhard Euler", ["Stockholm", "Berlin"], 1707, 1783),
    ("Joseph-Louis Lagrange", ["Como", "Paris", "Berlin"], 1736, 1813),
    ("Carl Friedrich Gauss", ["Gottingen"], 1777, 1855),
    ("Bernhard Riemann", ["Gottingen"], 1826, 1866),
    ("Ada Lovelace", ["London"], 1815, 1852),
    ("Charles Babbage", ["London"], 1791, 1871),
    ("Alan Turing", ["Manchester", "Cambridge", "Bletchley Park", "Manchester"], 1912, 1954),
    ("John von Neumann", ["Berlin", "Washington, D.C."], 1903, 1957),
    ("Konrad Zuse", ["Berlin"], 1910, 1945),
    ("Claude Shannon", ["New York", "Murray Hill"], 1916, 1956),
    ("Marvin Minsky", ["Princeton University", "MIT"], 1919, 1958),
    ("Frank Rosenblatt", ["Cornell University"], 1928, 1958),
    ("John McCarthy", ["UC Berkeley", "MIT"], 1927, 1958),
    ("Herbert A. Simon", ["Carnegie Mellon University"], 1916, 1957),
    ("Allen Newell", ["Carnegie Mellon University"], 1927, 1956),
    ("John J. Hopfield", ["Princeton University"], 1933, 1984),
    ("David Rumelhart", ["UC Berkeley"], 1942, 1986),
    ("Geoffrey Hinton", ["Edinburgh", "Toronto", "Mountain View", "Toronto"], 1947, 2017),
    ("Yoshua Bengio", ["Paris", "Montreal"], 1964, 2020),
    ("Yann LeCun", ["Paris", "Murray Hill", "New York"], 1960, 2013),
    ("Ilya Sutskever", ["Mountain View", "San Francisco"], 1986, 2020),
    ("Ashish Vaswani", ["Mountain View", "Paris"], 2015, 2024),
    ("Volodymyr Mnih", ["Toronto", "London"], 2010, 2016),
    ("Johannes Kepler", ["Prague"], 1571, 1630),
    ("Jean-Baptiste Joseph Fourier", ["Como", "Paris"], 1768, 1830),
]

# (from_name, to_name, y1, y2, label)
SIGNALS = [
    ("England", "Canada", 1858, 1858, "First transatlantic telegraph cable"),
    ("CERN", "World Wide Web", 1989, 1991, "The web is proposed at CERN"),
    ("BBN Technologies", "Project MAC", 1969, 1969, "First ARPANET message"),
    ("NASA", "JPL", 1964, 1964, "Ranger 7 lunar images to JPL"),
    ("JPL", "Apollo 11 Moon landing", 1969, 1969, "Apollo 11 telemetry"),
    ("China", "India", 100, 700, "Paper and numerals along the Silk Road"),
    ("Antikythera", "Athens", 1901, 1902, "The mechanism to the museum"),
    ("Antikythera Mechanism", "Athens", 1901, 1902, "Recovered and studied"),
    ("Kusumapura", "Baghdad", 600, 800, "Indian numerals travel west"),
    ("Mesopotamia", "Egypt", -3000, -2000, "Cuneiform and trade"),
    ("Sumer", "Mesopotamia", -3500, -2500, "The first writing"),
    ("Wadi el-Hol", "Egypt", -3250, -3250, "The earliest Egyptian writing"),
]


def build(by_name):
    out = []
    unresolved = []
    for kind, a, b, y1, y2, label in INFLUENCE:
        ia, ib = resolve(by_name, a), resolve(by_name, b)
        if not (ia and ib):
            unresolved.append((kind, a, b))
            continue
        out.append({"kind": kind, "from": ia, "to": ib,
                    "y1": y1, "y2": y2, "label": label})
    for a, b, y1, y2, label in SIGNALS:
        ia, ib = resolve(by_name, a), resolve(by_name, b)
        if not (ia and ib):
            unresolved.append(("signal", a, b))
            continue
        out.append({"kind": "signal", "from": ia, "to": ib,
                    "y1": y1, "y2": y2, "label": label})
    for person, path, y1, y2 in JOURNEYS:
        ip = resolve(by_name, person)
        ids = [resolve(by_name, s) for s in path]
        if not ip or any(x is None for x in ids):
            unresolved.append(("journey", person, "/".join(path)))
            continue
        out.append({"kind": "journey", "person": ip, "path": ids,
                    "y1": y1, "y2": y2})
    return out, unresolved


def run_tests():
    ok = True

    def check(label, cond):
        nonlocal ok
        print(("  ok  " if cond else " FAIL ") + label)
        if not cond:
            ok = False

    check("norm strips accents", norm("Rene Descartes") == norm("René Descartes"))
    check("norm strips parenthetical", norm("Ibn al-Haytham (Alhazen)") == norm("Ibn al-Haytham"))
    check("norm lowercases", norm("Ada Lovelace") == "ada lovelace")
    # fixture index (keys may or may not be pre-normalized; resolve must cope)
    by_name = {"ada lovelace": "p-ada", "alan turing": "p-turing",
               "london": "pl-london", "manchester": "pl-manchester",
               "rené descartes": "p-descartes",
               "thales of miletus": "p-thales", "pythagoras": "p-pyth"}
    check("resolve exact", resolve(by_name, "Ada Lovelace") == "p-ada")
    check("resolve accent-insensitive", resolve(by_name, "Rene Descartes") == "p-descartes")
    check("resolve missing", resolve(by_name, "Nobody") is None)

    # the first curated influence pair should resolve and build a well-formed record
    t, unres = build(by_name)
    first = t[0] if t else {}
    check("build first is Thales->Pythagoras",
          first.get("from") == "p-thales" and first.get("to") == "p-pyth")
    check("build record has all fields",
          all(k in first for k in ("kind", "from", "to", "y1", "y2", "label")))
    check("build drops unresolved", len(unres) > 0)  # most fixture names absent
    print()
    print("ALL TESTS PASSED" if ok else "TESTS FAILED")
    return 0 if ok else 1


def main(argv):
    if "--test" in argv:
        return run_tests()
    if "--build" not in argv:
        print(__doc__)
        return 2
    by_name, by_id = load_index()
    threads, unresolved = build(by_name)
    # validate all ids exist
    bad = []
    for t in threads:
        refs = [t.get("from"), t.get("to"), t.get("person")]
        refs += t.get("path", [])
        for r in refs:
            if r is not None and r not in by_id:
                bad.append((t, r))
    if bad:
        print("FATAL: unresolved ids:", bad[:10])
        return 1
    if unresolved:
        print("WARN unresolved names (%d):" % len(unresolved))
        for u in unresolved:
            print("   ", u)
    out = os.path.join(HERE, "threads.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(threads, f, ensure_ascii=False, indent=1)
        f.write("\n")
    kinds = {}
    for t in threads:
        kinds[t["kind"]] = kinds.get(t["kind"], 0) + 1
    print("wrote %s: %d threads %s (%d bytes)" %
          (out, len(threads), kinds, os.path.getsize(out)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
