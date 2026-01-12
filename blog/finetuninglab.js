const TrainingLab = {
    scenarios: {
        paris: {
            // Stage 1: Authentic Wikipedia HTML Scrape
            base: `<p><b>Paris</b><sup id="cite_ref-5" class="reference"><a href="#cite_note-5"><span class="cite-bracket">[</span>a<span class="cite-bracket">]</span></a></sup> is the <a href="/wiki/Capital_city" title="Capital city">capital</a> and <a href="/wiki/List_of_communes_in_France_with_over_20,000_inhabitants" title="List of communes in France with over 20,000 inhabitants">largest city</a> of <a href="/wiki/France" title="France">France</a>, with an estimated city population of 2,048,472 in an area of 105.4&nbsp;km<sup>2</sup> (40.7&nbsp;sq&nbsp;mi), and a metropolitan population of 13,171,056 as of January&nbsp;2025<sup class="plainlinks noexcerpt noprint asof-tag update" style="display:none;"><a class="external text" href="https://en.wikipedia.org/w/index.php?title=Paris&amp;action=edit">[update]</a></sup>.<sup id="cite_ref-pop2025_3-1" class="reference"><a href="#cite_note-pop2025-3"><span class="cite-bracket">[</span>3<span class="cite-bracket">]</span></a></sup> Located on the river <a href="/wiki/Seine" title="Seine">Seine</a> in the centre of the <a href="/wiki/%C3%8Ele-de-France" title="Île-de-France">Île-de-France</a> region, it is the <a href="/wiki/List_of_metropolitan_areas_in_Europe" title="List of metropolitan areas in Europe">largest metropolitan area</a> and <a href="/wiki/List_of_cities_in_the_European_Union_by_population_within_city_limits" title="List of cities in the European Union by population within city limits">fourth-most populous city</a> in the <a href="/wiki/European_Union" title="European Union">European Union</a> (EU). Nicknamed the City of Light, partly because of its role in the <a href="/wiki/Age_of_Enlightenment" title="Age of Enlightenment">Age of Enlightenment</a>, Paris has been one of the world's major centres of <a href="/wiki/Finance" title="Finance">finance</a>, <a href="/wiki/Diplomacy" title="Diplomacy">diplomacy</a>, <a href="/wiki/Commerce" title="Commerce">commerce</a>, <a href="/wiki/Culture" title="Culture">culture</a>, <a href="/wiki/Fashion_capital" title="Fashion capital">fashion</a>, and <a href="/wiki/Gastronomy" title="Gastronomy">gastronomy</a> since the 17th century.</p>`,
            lang: 'markup',
            // Stage 2: Direct Instruction Answer
            fine: "**User:** What is the capital of France?\n\n**Assistant:** The capital of France is Paris."
        },
        sorting: {
            // Stage 1: Complex C++ implementation and scattered comments
            base: `// source: bits/algorithm_fwd.h\n// template <class _RandomAccessIter, class _Compare>\nvoid __quicksort(_RandomAccessIter __first, _RandomAccessIter __last, _Compare __comp) {\n    if (__last - __first > 1) {\n        _RandomAccessIter __pivot = _VSTD::__partition_with_pivot(__first, __last, __comp);\n        __quicksort(__first, __pivot, __comp);\n        __quicksort(__pivot, __last, __comp);\n    }\n}\n\n/* Note on Python: Users often look for the Timsort implementation used in CPython's list.sort(). Unlike this C++ quicksort, Timsort is a hybrid stable sorting algorithm. */\n# TODO: Implement merge_collapse logic for optimization.`,
            lang: 'clike',
            fine: "**User:** How do I sort a list in Python?\n\n**Assistant:** To sort a list in Python, you can use the built-in `sorted()` function (which returns a new list) or the `.sort()` method (which sorts in-place). Both use the Timsort algorithm.",
            code: "numbers = [42, 7, 12, 3]\n# Option 1: New list\nsorted_list = sorted(numbers)\n# Option 2: In-place\nnumbers.sort()"
        },
        reasoning: {
            // Stage 1: Messy forum debate with noise and incorrect assertions
            base: `[Forum: MathOverflow-Lite] [Thread: 44021]\nUser_A: "I don't get it. 0.999... is clearly smaller than 1. There's always a tiny bit missing at the end of the chain!"\nUser_B: "Actually, it's about limits. lim n->inf sum(9/10^n)."\nMod_99: "Locked. Use the FAQ. It's 1 because 1/3 = 0.333 and 3 * 0.333 = 0.999, but 3 * 1/3 = 1."\nUser_C: "That's a circular proof though? You're assuming 1/3 is exactly 0.333..."\n[ADVERTISEMENT: Buy 'Intro to Real Analysis' now for $49.99!]`,
            lang: 'markup',
            // Stage 2: Structured Logical Proof
            fine: "**User:** Prove that $0.999... = 1$.\n\n**Assistant:** We can prove this using an algebraic method:\n\n1. Let $x = 0.999...$\n2. Multiply by $10$: $10x = 9.999...$\n3. Subtract the first equation from the second:\n   $(10x - x) = (9.999... - 0.999...)$\n   $9x = 9$\n4. Divide by $9$: $x = 1$\n\nTherefore, $0.999... = 1$."
        }
    },

    init: function() {
        this.update();
    },

    update: function() {
        const val = document.getElementById('scenario-select').value;
        const data = this.scenarios[val];

        const baseEl = document.getElementById('base-output');
        const fineEl = document.getElementById('fine-output');

        // Render Stage 1 (Raw Data)
        baseEl.innerHTML = `<pre class="line-numbers"><code class="language-${data.lang}">${this.escapeHtml(data.base)}</code></pre>`;

        // Render Stage 2 (Curated Assistant Output)
        let fineContent = `<div class="assistant-frame">${data.fine.replace(/\n/g, '<br>')}`;
        if (data.code) {
            fineContent += `<pre><code class="language-python">${this.escapeHtml(data.code)}</code></pre>`;
        }
        fineContent += `</div>`;
        fineEl.innerHTML = fineContent;

        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(baseEl);
            Prism.highlightAllUnder(fineEl);
        }

        if (window.MathJax) {
            MathJax.config.tex.inlineMath = [['$', '$'], ['\\(', '\\)']];
            MathJax.typesetPromise([fineEl]).catch((err) => console.log('MathJax failed:', err));
        }
    },

    escapeHtml: function(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

document.addEventListener('DOMContentLoaded', () => TrainingLab.init());
