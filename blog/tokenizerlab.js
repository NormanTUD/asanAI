/**
 * Synchronisiert alle Visualisierungen basierend auf dem Master-Input
 */
function syncAndTokenize(val) {
    const masterInput = document.getElementById('master-token-input');
    if (!masterInput) return;

    const text = (val !== undefined) ? val : masterInput.value;
    const methods = ['spaces', 'trigrams', 'bpe', 'wordpiece', 'chars'];

    methods.forEach(type => {
        renderTokens(type, text);
    });

    // Update live token count
    const counter = document.getElementById('live-token-count');
    if (counter) {
        const total = document.querySelectorAll('.viz-container .token-badge');
        // We update after render, so use a microtask
        requestAnimationFrame(() => {
            const allBadges = document.querySelectorAll('.viz-container .token-badge');
            counter.textContent = allBadges.length;
        });
    }
}

/**
 * Erstellt die Token-Badges für eine spezifische Methode
 */
function renderTokens(type, text) {
    const container = document.getElementById(`viz-${type}`);
    if (!container) return;

    let tokens = [];

    if (type === 'spaces') {
        tokens = text.split(/\s+/).filter(t => t.length > 0);
    }
    else if (type === 'trigrams') {
        const nInput = document.getElementById('ngram-size');
        const n = nInput ? parseInt(nInput.value) : 3;
        const cleanText = text.replace(/\s+/g, '_');
        for (let i = 0; i < cleanText.length; i += n) {
            tokens.push(cleanText.substring(i, i + n));
        }
    }
    else if (type === 'bpe') {
        const tokenizer = new BPETokenizer();
        tokenizer.train(text, 15);
        tokens = tokenizer.tokenize(text);
    }
    else if (type === 'chars') {
        tokens = text.split('');
    }
    else if (type === 'wordpiece') {
        const words = text.split(/\s+/).filter(t => t.length > 0);
        words.forEach(word => {
            tokens.push(...wordpieceTokenize(word));
        });
    }

    // Animate out old tokens, then render new ones
    const existing = container.querySelectorAll('.token-badge');
    if (existing.length > 0) {
        existing.forEach(el => el.classList.add('token-exit'));
    }

    // Small delay so exit animation can play, but keep it snappy
    const delay = existing.length > 0 ? 80 : 0;

    setTimeout(() => {
        container.innerHTML = '';

        if (tokens.length === 0) {
            container.innerHTML = `<div class="token-empty">Type something above to see tokens appear…</div>`;
            return;
        }

        tokens.forEach((t, i) => {
            const c = tokenColor(t);
            const displayToken = (t === ' ') ? '␣' : t;

            const badge = document.createElement('div');
            badge.className = 'token-badge token-enter';
            badge.style.cssText = `
                --token-bg: ${c.bg};
                --token-glow: ${c.glow};
                --token-border: ${c.border};
                animation-delay: ${i * 18}ms;
            `;

            badge.innerHTML = `
                <span class="token-text">${escapeHtml(displayToken)}</span>
            `;

            // Hover: show a tooltip with full info
            badge.setAttribute('title', `"${t}" → ID ${c.id}`);

            container.appendChild(badge);
        });

        // Update section token count
        const countEl = container.parentElement.querySelector('.section-token-count');
        if (countEl) {
            countEl.textContent = tokens.length + ' token' + (tokens.length !== 1 ? 's' : '');
        }
    }, delay);
}

/**
 * A small simulated WordPiece vocabulary.
 */
const wordpieceVocab = [
    "the", "king", "is", "a", "an", "brave", "act", "quick", "slow",
    "token", "deep", "learn", "model", "train", "data", "word",
    "un", "re", "pre", "dis",
    "##ing", "##ly", "##ed", "##er", "##est", "##tion", "##ation",
    "##ment", "##ness", "##ize", "##iza", "##able", "##ful",
    "##al", "##ous", "##ive", "##less", "##s", "##en", "##it", "##id",
    "##e", "##y", "##o", "##i", "##u",
    "a","b","c","d","e","f","g","h","i","j","k","l","m",
    "n","o","p","q","r","s","t","u","v","w","x","y","z"
];

/**
 * Tokenizes a single word using a greedy longest-match-first WordPiece algorithm.
 */
function wordpieceTokenize(word) {
    word = word.toLowerCase();
    if (wordpieceVocab.includes(word)) return [word];

    const tokens = [];
    let start = 0;
    let isFirst = true;

    while (start < word.length) {
        let end = word.length;
        let found = false;

        while (start < end) {
            let substr = word.substring(start, end);
            if (!isFirst) {
                substr = "##" + substr;
            }
            if (wordpieceVocab.includes(substr)) {
                tokens.push(substr);
                found = true;
                break;
            }
            end--;
        }

        if (!found) {
            const ch = word[start];
            tokens.push(isFirst ? ch : "##" + ch);
            start++;
        } else {
            start = end;
        }
        isFirst = false;
    }

    return tokens;
}

async function loadTokenizerModule() {
    updateLoadingStatus("Loading section about Tokenizer...");

    // Detect when the input bar becomes sticky
    const stickyEl = document.getElementById('sticky-input-wrapper');
    if (stickyEl) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                stickyEl.classList.toggle('is-stuck', !entry.isIntersecting);
            },
            { threshold: 1.0, rootMargin: '-1px 0px 0px 0px' }
        );
        const sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        sentinel.style.visibility = 'hidden';
        stickyEl.parentElement.insertBefore(sentinel, stickyEl);
        observer.observe(sentinel);
    }

    // Animate sections on scroll
    const sectionCards = document.querySelectorAll('.tokenizer-method-card');
    if (sectionCards.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        sectionCards.forEach(card => revealObserver.observe(card));
    }

    syncAndTokenize();
    return Promise.resolve();
}
