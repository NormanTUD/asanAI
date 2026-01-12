const TrainingLab = {
    scenarios: {
        paris: {
            // Stage 1: Showing raw Wikipedia markup, SEO meta tags, and broken snippets
            base: `[TITLE: Paris - Wikipedia]\n<meta name="description" content="Paris is the capital of France...">\n<h2><span class="mw-headline" id="History">History</span></h2>\n<p><b>Paris</b><sup class="reference"><a href="#cite_note-5">[5]</a></sup> is the <a href="/wiki/Capital_city">capital</a> and largest city of <a href="/wiki/France">France</a>. Since the 17th century, Paris has been one of the world's major centres of <a href="/wiki/Finance">finance</a>, diplomacy, commerce, fashion, gastronomy and science. [EDIT] [HISTORY]. Related: "What is the capital of France?" is a common search term.</p>`,
            lang: 'markup',
            // Stage 2: Showing the specific Human Prompt and the AI's clean answer
            fine: "**User:** What is the capital of France?\n\n**Assistant:** The capital of France is Paris."
        },
        sorting: {
            // Stage 1: GitHub-style file dump with mixed comments
            base: `/* sort.c - Copyright 2022 */\nvoid swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }\n\n# script.py - "Quick and dirty sort"\ndef quick_sort(arr):\n    return sorted(arr)\n\n# README.md: Usage: python script.py --input data.csv\n# TODO: Add error handling for empty lists.`,
            lang: 'clike',
            fine: "**User:** How do I sort a list in Python?\n\n**Assistant:** To sort a list in Python, the most efficient way is using the `sorted()` function or the `.sort()` method:",
            code: "numbers = [5, 2, 9, 1]\nsorted_numbers = sorted(numbers)\nprint(sorted_numbers)"
        },
        reasoning: {
            // Stage 1: Unstructured forum debate (The "Noise")
            base: `Forum_User123: is 0.999 repeating actually 1??\nMod_Dave: Use the search bar. This has been answered.\nMathWhiz: 1/3 = 0.333... so 3 * 0.333... = 0.999... but 3 * 1/3 = 1. QED.\nTroll88: 0.999 is less than 1 because there is a gap at the end. Change my mind.`,
            lang: 'markup',
            // Stage 2: Structured Logical Proof (The "Alignment") using $ format
            fine: "**User:** Can you prove that $0.999...$ is equal to $1$?\n\n**Assistant:** Yes. We can prove this using a simple algebraic substitution:\n\n1. Let $x = 0.999...$\n2. Multiply both sides by $10$: $10x = 9.999...$\n3. Subtract the original equation ($x$) from this new equation:\n   $10x - x = 9.999... - 0.999...$\n   $9x = 9$\n4. Solving for $x$:\n   $x = 1$\n\nThus, $0.999...$ and $1$ are mathematically identical."
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
        // We replace \n with <br> for the text, but skip it if we encounter code blocks
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
            // Configure MathJax to recognize single $ for inline
            MathJax.config.tex.inlineMath = [['$', '$'], ['\\(', '\\)']];
            MathJax.typesetPromise([fineEl]).catch((err) => console.log('MathJax failed:', err));
        }
    },

    escapeHtml: function(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

document.addEventListener('DOMContentLoaded', () => TrainingLab.init());
