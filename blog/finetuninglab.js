const TrainingLab = {
    scenarios: {
        paris: {
            base: `<h2><span class="mw-headline" id="History">History</span></h2><p><b>Paris</b><sup class="reference"><a href="#cite_note-5">[5]</a></sup> is the <a href="/wiki/Capital_city">capital</a> and largest city of <a href="/wiki/France">France</a>. Since the 17th century, Paris has been one of the world's major centres of <a href="/wiki/Finance">finance</a>...</p>`,
            lang: 'markup',
            fine: "The capital of France is Paris."
        },
        sorting: {
            // Stage 1 shows both C and Python snippets it might find in a tutorial repo
            base: `// C Implementation\nvoid swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }\n\n# Python implementation found in same folder\nclass Sorter:\n    def __init__(self, data):\n        self.data = data\n    def execute(self):\n        return sorted(self.data)`,
            lang: 'clike',
            fine: "To sort a list in Python, the most efficient and standard way is using the `sorted()` function or the `.sort()` method:",
            code: "numbers = [5, 2, 9, 1]\n# This uses Timsort, an O(n log n) algorithm\nsorted_numbers = sorted(numbers)\nprint(sorted_numbers)"
        },
        reasoning: {
            // Stage 1: Messy forum debate with some math
            base: `User_A: 0.999... is just a limit, it never hits 1.\nUser_B: No, 1/3 = 0.333... right? Multiply by 3. 3/3 = 1, and 0.333... * 3 = 0.999... Therefore 0.999... = 1. Simple.\nUser_C: <html><script>console.log(0.99999999999999999 === 1)</script></html>`,
            lang: 'markup',
            // Stage 2: Using MathJax for the aligned assistant
            fine: "In mathematics, we can prove that $$0.999... = 1$$ using a simple algebraic substitution:\n\n1. Let $$x = 0.999...$$\n2. Multiply both sides by 10: $$10x = 9.999...$$\n3. Subtract the original equation ($$x$$) from this new equation:\n   $$10x - x = 9.999... - 0.999...$$\n   $$9x = 9$$\n4. Solving for $$x$$, we find:\n   $$x = 1$$\n\nThus, $$0.999...$$ and $$1$$ are just two different ways of representing the same real number."
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

        // 1. Highlight Code with Prism
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(baseEl);
            Prism.highlightAllUnder(fineEl);
        }

        // 2. Trigger MathJax for the equations
        if (window.MathJax) {
            MathJax.typesetPromise([fineEl]).catch((err) => console.log('MathJax failed:', err));
        }
    },

    escapeHtml: function(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

document.addEventListener('DOMContentLoaded', () => TrainingLab.init());
