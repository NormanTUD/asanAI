# model2vec-js

[Model2Vec](https://github.com/MinishLab/model2vec) static embeddings in JavaScript, with FAQ search and spelling
correction built on them. It runs in browsers and Node with no dependencies, and comes with a model:
potion-base-8M packed to 4.2 MB.

A static embedding model keeps one vector per token, and a text's vector is the average of its tokens' vectors.
There is no neural network to run, so embedding a sentence takes about 10 µs on a CPU, and the whole thing fits
in a web page. Matching is by meaning: "stop sending me newsletters" finds "How do I unsubscribe from your
emails?", and "the mug came smashed" finds "My item arrived damaged or broken".

```ts
import { FaqSearch } from 'model2vec-js';

const faq = await FaqSearch.create([
  { id: 'returns', q: 'How do I return an item?', a: 'Start a return under Orders in your account…' },
  { id: 'damaged', q: 'My item arrived damaged or broken.', a: 'Send us a photo of the damage…' },
  // …
]);

const r = faq.ask('the mug came smahsed');
r.corrected;          // "the mug came smashed"
r.answer?.entry.id;   // "damaged" (null when nothing is close enough)
r.matches;            // the best 3, with scores, whether or not they count as an answer
```

## Install

```sh
npm install model2vec-js
```

- **Node 18+:** `import { FaqSearch } from 'model2vec-js'`. The bundled model and word list load from the package.
- **Bundlers (Vite, webpack 5, esbuild, Rollup):** the same import. The model is found with
  `new URL('../models/…', import.meta.url)`, which bundlers copy as an asset. Or pass `model:` your own URL.
- **Straight from a CDN, no build step:**

  ```html
  <script type="module">
    import { FaqSearch } from 'https://cdn.jsdelivr.net/npm/model2vec-js@0.1.0/dist/index.js';
    const faq = await FaqSearch.create(await (await fetch('/faq.json')).json());
  </script>
  ```

  The model and word list then load from the CDN too (4.6 MB; 3.7 MB gzipped).

Your FAQ never leaves the page: everything runs locally, with no server and no API calls.

## FAQ search

```ts
const faq = await FaqSearch.create(entries, options?);
const result = faq.ask(question, { k: 3, filter: (entry) => entry.audience !== 'admin' });
```

An entry needs `q` (the question) and `a` (the answer); any other fields are kept, so `result.answer.entry` is your
own object.

| Field | |
|---|---|
| `q`, `a` | The question and answer. The answer is returned as it is, in whatever format you display. |
| `section` | A heading, matched along with the question. It helps when questions are alike ("What does this screen show?"). |
| `alt` | Other ways people ask the question, e.g. `["do you take amex"]`. The closest phrasing counts. This is the way to fix a question that finds the wrong entry. |

| Option | Default | |
|---|---|---|
| `model` | bundled potion-base-8M | A `StaticModel`, or a URL, path or bytes of a packed model. |
| `words` | bundled list | The spelling corrector's extra known words (a URL, path, bytes or array); `false` turns correction off. |
| `mix` | `0.5` | How much the answer text counts against the question alone. |
| `threshold` | `'auto'` | The score the best match needs to count as an answer, or `'auto'` to set it from your FAQ (below). |

`ask` returns `{ question, corrected, answer, matches }`:
- `corrected` is the question as searched, or `null` if nothing was corrected. Show it ("Showing results for…").
- `answer` is the best match if it scored at least `faq.threshold`, else `null`.
- `matches` are the best `k`, best first, whatever their scores. Show them as "related" or, when there is no
  answer, as "closest topics".

`faq.add(...entries)` and `faq.remove(predicate)` change the FAQ in place. Indexing takes about 0.2 ms an entry
and `ask` under a millisecond (a few ms when correcting typos), so indexing on every page load is fine.

**How entries are scored.** Each entry is embedded twice: its section and question (and each `alt`), and the same
with the answer. Its score is half its closest question's cosine similarity to the question asked, plus half the
whole entry's. Questions alone miss answers that use the asker's words; answers alone drown the question.

**The threshold.** How high an unrelated question scores depends on the FAQ's wording, so by default the threshold
is set per FAQ. Forty built-in questions no FAQ should answer ("how do I bake sourdough bread", "who painted the
Mona Lisa") are scored against it, and the threshold is put 0.02 above the 90th percentile. On the two FAQs
measured below, every off-topic test question was turned away. Answerable ones turned away dropped from 17.8% to
14.8% on one FAQ and from 2.4% to 0.6% on the other, against a fixed 0.4.

## Spelling correction

A misspelt word breaks into word pieces that mean something else ("reprots" becomes `rep ##rot ##s`), so one typo
can send a short question to the wrong answer. Before embedding, `ask` replaces each unknown word with the closest
known one.

- **Known words:** your FAQ's words, the model's whole-word tokens, and 69,403 more from SCOWL, a curated
  spell-checker list, so real words like "reassign" or "debtors" are left alone.
- **Corrections:** one edit (a letter dropped, added, changed or swapped) for words of 4–5 letters, two for longer
  ones. Two-edit corrections only go to words in your FAQ. Ties go to the same first letter, then to words your
  FAQ uses most, then to the commoner word.
- **Left alone:** words under 4 letters, numbers, and anything already known.

It doesn't catch typos that make another real word ("form" for "from").

The `Speller` class is exported for use on its own:
`new Speller(model, { preferred: texts, known: words }).correct(text)`.

## Embeddings

```ts
import { StaticModel, similarity } from 'model2vec-js';

const model = await StaticModel.load();            // or StaticModel.load(urlOrPathOrBytes)
const a = model.embed('how do I cancel my order');  // Float32Array(256), unit length
const b = model.embed('stop my purchase before it ships');
similarity(a, b);                                   // cosine similarity, 1 = same meaning
model.embedMany(['refund', 'exchange']);           // several at once
model.tokenize('Café');                             // token ids
```

This matches the Python library. Token ids are identical to Hugging Face's tokenizer, and with a full-precision
model the vectors match `model2vec` to within 1e-6. The bundled 4-bit model's vectors are within cosine 0.988 of
full precision. The tests check the token ids and the bundled model's vectors against fixtures made with
`scripts/make-fixture.py`.

Any Model2Vec model with a lower-casing BERT tokenizer and no token weights can be packed (most `minishlab/potion-*`
models):

```sh
npx model2vec-js pack ./potion-base-4M ./potion-base-4M.bin --bits 8
```

## Command line

```sh
npx model2vec-js ask faq.json "how do I get a refund"
npx model2vec-js eval faq.json tests.json --typos 0,1,2    # accuracy, with and without the corrector
npx model2vec-js embed "some text"                         # the vector as JSON
npx model2vec-js pack <model folder> out.bin [--bits 4|8|32] [--group 64] [--dims N]
npx model2vec-js words out.txt <word list>...              # a word list for the corrector
```

`eval` takes test questions as `[{ "q": "...", "ids": ["entry id that answers it"] }]`, with `"ids": []` for
questions the FAQ shouldn't answer. Entries need an `id`.

## How well it works

On the example FAQ in `examples/` (a made-up shop, 45 entries, 135 casual test questions and 10 off-topic ones):

| Questions | Spelling correction | Right answer first | In top 3 |
|---|---|---|---|
| as written | either | 63.0% | 87.4% |
| 1 typo each | off / **on** | 48.1% / **62.2%** | 71.1% / **86.7%** |
| 2 typos each | off / **on** | 28.1% / **61.5%** | 49.6% / **83.0%** |

On a real product's help centre (298 entries, 167 test questions, not included):

| Questions | Spelling correction | Right answer first | In top 3 |
|---|---|---|---|
| as written | either | 81.4% | 92.2% |
| 2 typos each | off / **on** | 46.7% / **79.0%** | 64.7% / **89.8%** |

Typos are generated the same way each run (`misspell`): letters dropped, doubled, swapped, or replaced by or added
beside a neighbouring key. The test questions were written for these FAQs with the entries in view, so expect real
questions to do somewhat worse. The model packing, the scoring mix and the threshold rule were chosen on these same
two sets.

How the bundled model was chosen, on the help centre:

| Model | Size | First | Top 3 |
|---|---|---|---|
| potion-base-2M | 7.8 MB | 69.5% | 85.0% |
| potion-base-4M | 15.3 MB | 75.4% | 91.0% |
| potion-retrieval-32M | 129.7 MB | 76.0% | 89.2% |
| potion-base-8M | 30.5 MB | 82.0% | 92.8% |
| potion-base-8M, 128 dims at 8 bits | 4.1 MB | 75.4% | 90.4% |
| **potion-base-8M at 4 bits (bundled)** | **4.2 MB** | **81.4%** | **92.2%** |

**What it can't do:**
- It doesn't write answers: it finds yours.
- Averaging tokens loses word order, so "can I add a shopper" and "can a shopper add me" look alike.
- It only knows words its training text had. Brand names and jargon ("amex") need `alt` phrasings.
- English only.

## Development

```sh
npm install
npm test                       # builds, then runs the tests (Node 21+)
sh scripts/smoke.sh            # packs the package, installs it in an empty project and uses it from there
sh scripts/build-words.sh      # rebuilds models/words.txt from SCOWL
python scripts/make-fixture.py <potion-base-8M folder>   # rebuilds the reference fixture (needs model2vec)
```

CI (`.github/workflows/ci.yml`) builds every push and pull request on Node 18, 20, 22 and 24, runs the tests (22
and 24) and the install check (all four).

To release, bump the version and push the tag: `npm version patch && git push --follow-tags`. The release workflow
checks that the tag matches `package.json`, tests again, publishes to npm with provenance and creates a GitHub
release. It publishes with npm's trusted publishing, which needs setting up once on npmjs.com (the package's
Settings → Trusted publishing: GitHub Actions, repository `ShakirasHips/model2vec-js`, workflow `release.yml`,
environment `npm`). Until then, an `NPM_TOKEN` secret on the `npm` environment works instead.

## Credits and licence

The code is MIT-licensed (`LICENSE`). The bundled data keeps its own terms, described in `models/README.md`:

- **potion-base-8M** by [MinishLab](https://huggingface.co/minishlab/potion-base-8M), MIT, repacked at 4 bits.
- **The word list** is derived from [SCOWL](http://wordlist.aspell.net/), Copyright 2000-2018 by Kevin Atkinson, and
  the lists it builds on (including the UK Advanced Cryptics Dictionary, Copyright (c) J Ross Beresford 1993-1999,
  and Ispell's lists, Copyright 1993 Geoff Kuenning). Filtered and re-encoded. Its notices are in full in
  `models/SCOWL-COPYRIGHT.txt`.

This package reimplements Model2Vec's inference and BERT's tokenizer in TypeScript; it contains no code from either.
