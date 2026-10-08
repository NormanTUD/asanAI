# Atlas Author Placement — Worker Brief

You are placing **authors from a bibliography** (3,403 unique names parsed from
/home/norman/websites/asanai/blog/literature.js) onto a world map for the course
"From Big Bang to ChatGPT". Your input is a JSON chunk:
/tmp/opencode/atlas/authors_chunk_N.json — an array of
{name, works, yearMin, yearMax, keys, titles}.

## Task
For EVERY name in your chunk, output one row:

[ "Name As Given", lat, lng, "City, Country", activeYear, conf ]

- lat/lng: decimal degrees (2 decimals). null if you cannot place them.
- "City, Country": the single most representative location — prefer their main
  research institution's city or, for historical figures, their birthplace /
  main working city.
- activeYear: the year they were most active in the work cited here (use
  yearMax if it exists, else a sensible year).
- conf:
  - 1 = you are confident from well-established knowledge (famous person,
    known home institution). This includes historical figures (Euler → St.
    Petersburg/Basel), classic AI/ML people (Bengio → Montreal, Hinton →
    Toronto), and current researchers whose affiliation is widely known.
  - 0 = you do not reliably know where this person is/works. In that case
    lat=null, lng=null, city="". Do NOT guess.

## Rules
1. Cover 100% of the names in the chunk — every name gets a row, conf 0 rows
   included.
2. Do not invent affiliations. If a name is ambiguous (common initials like
   "J. Smith") and you cannot confidently identify the person, use conf 0.
3. Multi-part names are already split per person. Names like
   "nLab contributors" or "Google" are organizations: place their HQ
   (nLab → no single HQ → conf 0; Google → Mountain View; OpenAI → San
   Francisco; DeepMind → London; Anthropic → San Francisco; Microsoft →
   Redmond) with conf 1.
4. Historical names: use the city of their main institution in the era of the
   cited work (e.g. Al-Khwarizmi → Baghdad, Ada Lovelace → London,
   Babbage → London, Leibniz → Hanover, Newton → Cambridge, Euler →
    St. Petersburg, Gauss → Göttingen, Riemann → Göttingen, Bolyai →
   Marosvásárhely, Lobachevsky → Kazan, Pascal → Paris, Fermat → Toulouse,
   Euler's students, etc.).
5. Ancient names: best-known home city (Euclid → Alexandria, Pythagoras →
   Croton/Samothrace pick Croton, Archimedes → Syracuse, Hypatia →
   Alexandria, al-Kindi → Baghdad, Alhazen → Cairo, Ibn Sina → Bukhara,
   Bhaskara → Ujjain, Aryabhata → Kusumapura/Pataliputra, al-Khwarizmi →
   Baghdad, Omar Khayyam → Isfahan, Fibonacci → Pisa, Napier → Perthshire,
   Kepler → Prague, Galileo → Florence, Newton → Cambridge, Descartes →
   Paris, Leibniz → Hanover, Bernoulli → Basel, Euler → St. Petersburg,
   Lagrange → Berlin, Laplace → Paris, Gauss → Göttingen, Riemann →
   Göttingen, Noether → Göttingen, Hilbert → Göttingen, Poincaré → Paris,
   Bolyai → Marosvásárhely, Lobachevsky → Kazan, Cauchy → Paris, Jacobi →
   Königsberg, Möbius → Leipzig, Riemann → Göttingen, Weierstrass → Berlin,
   Cantor → Halle, Frege → Jena, Russell → Cambridge, Gödel → Vienna,
   Turing → Manchester, von Neumann → Princeton, Shannon → New Jersey,
   Wiener → Cleveland/MIT use Cambridge MA, Shannon's mouse… etc.)
6. Output: write a STRICT JSON array (one row per line is fine, no trailing
   commas, no comments) to the exact output path given to you.

## Definition of done
- Every name in the input chunk has exactly one row in the output.
- Row shape exactly: [string, number|null, number|null, string, number, 0|1]
