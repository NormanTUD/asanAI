function injectStyles() {
	if (document.getElementById("formal-ethics-framework-styles")) return;
	const style = document.createElement("style");
	style.id = "formal-ethics-framework-styles";
	style.textContent = `
:root {
  --fef-bg: #fefcf9;
  --fef-bg-surface: #ffffff;
  --fef-bg-secondary: #f8f6f2;
  --fef-bg-tertiary: #f0ede8;
  --fef-text: #1a1a1a;
  --fef-text-secondary: #4a4a4a;
  --fef-text-tertiary: #7a7a7a;
  --fef-text-bright: #000;
  --fef-accent: #2d5a27;
  --fef-accent-light: #4a8c3f;
  --fef-accent-glow: rgba(45,90,39,0.08);
  --fef-accent-warm: #8b6914;
  --fef-border: #e8e4df;
  --fef-border-light: #f0ece8;
  --fef-proof-ok: #2d7a3a;
  --fef-proof-partial: #b8860b;
  --fef-proof-error: #c0392b;
  --fef-code-bg: #f9f7f4;
  --fef-shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --fef-shadow-md: 0 4px 16px rgba(0,0,0,0.06);
  --fef-shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
  --fef-radius: 12px;
  --fef-radius-sm: 8px;
  --fef-radius-lg: 16px;
  --fef-font-serif: 'Cormorant Garamond', Georgia, serif;
  --fef-font-sans: 'Inter', -apple-system, sans-serif;
  --fef-font-mono: 'JetBrains Mono', monospace;
  --fef-transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  --fef-critique-bg: #fffdf5;
  --fef-critique-border: #e6a817;
  --fef-good-bg: #f0fdf4;
  --fef-good-border: #22c55e;
  --fef-bad-bg: #fef2f2;
  --fef-bad-border: #ef4444;
  --fef-depth-bg: #f5f0ff;
  --fef-depth-border: #8b5cf6;
}

[data-fef-theme="dark"] {
  --fef-bg: #0c0c10;
  --fef-bg-surface: #14141a;
  --fef-bg-secondary: #1a1a22;
  --fef-bg-tertiary: #222230;
  --fef-text: #d4d0cb;
  --fef-text-secondary: #9a9590;
  --fef-text-tertiary: #6a6560;
  --fef-text-bright: #f0ece8;
  --fef-accent: #6abf5e;
  --fef-accent-light: #8fd485;
  --fef-accent-glow: rgba(106,191,94,0.1);
  --fef-accent-warm: #d4a520;
  --fef-border: #2a2a32;
  --fef-border-light: #1e1e26;
  --fef-code-bg: #1a1a20;
  --fef-shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
  --fef-shadow-md: 0 4px 16px rgba(0,0,0,0.3);
  --fef-shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
  --fef-critique-bg: #1a1708;
  --fef-critique-border: #92400e;
  --fef-good-bg: #052e16;
  --fef-good-border: #166534;
  --fef-bad-bg: #1c0a0a;
  --fef-bad-border: #991b1b;
  --fef-depth-bg: #1a1528;
  --fef-depth-border: #6d28d9;
}

.fef-root * { margin: 0; padding: 0; box-sizing: border-box; }

.fef-root {
  font-family: var(--fef-font-sans);
  background: var(--fef-bg);
  color: var(--fef-text);
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background var(--fef-transition), color var(--fef-transition);
  font-size: 17px;
}

.fef-root .top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: var(--fef-bg-surface);
  border-bottom: 1px solid var(--fef-border);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--fef-shadow-sm);
}

.fef-root .top-bar-title {
  font-family: var(--fef-font-serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--fef-text-bright);
  display: flex;
  align-items: center;
  gap: 10px;
}

.fef-root .logo-mark {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--fef-accent-glow);
  border: 1.5px solid var(--fef-accent);
  color: var(--fef-accent);
  font-size: 0.8rem;
  transition: all 0.4s;
}

.fef-root .logo-mark.proven {
  background: var(--fef-accent);
  color: white;
  transform: scale(1.1);
}

.fef-root .top-bar-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.fef-root .top-btn {
  padding: 7px 13px;
  font-size: 0.72rem;
  border: 1px solid var(--fef-border);
  background: var(--fef-bg-surface);
  color: var(--fef-text-secondary);
  border-radius: 20px;
  cursor: pointer;
  font-family: var(--fef-font-sans);
  font-weight: 500;
  transition: all 0.2s;
  letter-spacing: 0.02em;
}

.fef-root .top-btn:hover {
  border-color: var(--fef-accent);
  color: var(--fef-accent);
  background: var(--fef-accent-glow);
}

.fef-root .top-btn.active {
  background: var(--fef-accent);
  color: white;
  border-color: var(--fef-accent);
}

.fef-root .theme-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  border: 1px solid var(--fef-border);
  background: var(--fef-bg-surface);
  color: var(--fef-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.fef-root .theme-btn:hover {
  border-color: var(--fef-accent);
  color: var(--fef-accent);
}

.fef-root .container {
  max-width: 780px;
  margin: 0 auto;
  padding: 100px 24px 160px;
}

.fef-root .section-block {
  margin-bottom: 48px;
  padding: 32px;
  background: var(--fef-bg-surface);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-lg);
  box-shadow: var(--fef-shadow-sm);
  transition: box-shadow 0.3s;
}

.fef-root .section-block:hover {
  box-shadow: var(--fef-shadow-md);
}

.fef-root .section-title {
  font-family: var(--fef-font-serif);
  font-size: 1.7rem;
  font-weight: 400;
  margin-bottom: 12px;
  color: var(--fef-text-bright);
  line-height: 1.3;
}

.fef-root .section-subtitle {
  font-size: 0.88rem;
  color: var(--fef-text-secondary);
  margin-bottom: 20px;
  line-height: 1.7;
}

.fef-root .hero-section {
  text-align: center;
  padding: 48px 32px;
  margin-bottom: 48px;
  background: linear-gradient(135deg, var(--fef-bg-secondary), var(--fef-bg-surface));
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-lg);
}

.fef-root .hero-section h1 {
  font-family: var(--fef-font-serif);
  font-size: 2.8rem;
  font-weight: 300;
  color: var(--fef-text-bright);
  margin-bottom: 16px;
  line-height: 1.2;
}

.fef-root .hero-section .hero-sub {
  font-size: 1.05rem;
  color: var(--fef-text-secondary);
  max-width: 520px;
  margin: 0 auto 24px;
  line-height: 1.7;
}

.fef-root .hero-section .hero-meta {
  font-size: 0.78rem;
  color: var(--fef-text-tertiary);
  font-family: var(--fef-font-mono);
}

.fef-root .quick-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 48px;
}

.fef-root .quick-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: var(--fef-bg-surface);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.fef-root .quick-card:hover {
  border-color: var(--fef-accent);
  background: var(--fef-accent-glow);
  transform: translateY(-1px);
  box-shadow: var(--fef-shadow-md);
}

.fef-root .quick-card .qc-num {
  font-family: var(--fef-font-mono);
  font-size: 0.7rem;
  color: var(--fef-text-tertiary);
  background: var(--fef-bg-secondary);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 28px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.fef-root .quick-card .qc-body h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--fef-text-bright);
  margin-bottom: 4px;
}

.fef-root .quick-card .qc-body p {
  font-size: 0.82rem;
  color: var(--fef-text-secondary);
  line-height: 1.5;
}

.fef-root .quick-card .qc-status {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--fef-proof-ok);
  flex-shrink: 0;
}

.fef-root .value-card {
  padding: 18px 22px;
  margin-bottom: 12px;
  border-radius: var(--fef-radius);
  border: 1px solid var(--fef-border);
  background: var(--fef-bg-surface);
  transition: all 0.2s;
}

.fef-root .value-card:hover { box-shadow: var(--fef-shadow-sm); }

.fef-root .value-card.good {
  border-left: 4px solid var(--fef-good-border);
  background: var(--fef-good-bg);
}

.fef-root .value-card.bad {
  border-left: 4px solid var(--fef-bad-border);
  background: var(--fef-bad-bg);
}

.fef-root .value-card h4 {
  font-size: 0.92rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--fef-text-bright);
}

.fef-root .value-card p {
  font-size: 0.84rem;
  color: var(--fef-text-secondary);
  margin-bottom: 4px;
  line-height: 1.65;
}

.fef-root .value-card .exemplar {
  margin-top: 10px;
  padding: 10px 14px;
  background: var(--fef-bg-secondary);
  border-radius: var(--fef-radius-sm);
  font-size: 0.8rem;
  color: var(--fef-text-secondary);
  line-height: 1.6;
}

.fef-root .value-card .exemplar strong { color: var(--fef-text-bright); }

.fef-root .depth-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--fef-depth-bg);
  border: 1px solid var(--fef-depth-border);
  border-radius: 20px;
  font-size: 0.75rem;
  color: var(--fef-depth-border);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: 12px;
  margin-bottom: 8px;
}

.fef-root .depth-toggle:hover {
  background: var(--fef-depth-border);
  color: white;
}

.fef-root .depth-content {
  display: none;
  margin-top: 12px;
  padding: 20px;
  background: var(--fef-bg-secondary);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius);
  animation: fefSlideDown 0.3s ease;
}

.fef-root .depth-content.visible { display: block; }

@keyframes fefSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fef-root .step-detail {
  display: none;
  margin-bottom: 48px;
  animation: fefFadeIn 0.4s ease;
}

.fef-root .step-detail.active { display: block; }

@keyframes fefFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.fef-root .step-detail-header { margin-bottom: 20px; }

.fef-root .step-detail-number {
  font-family: var(--fef-font-mono);
  font-size: 0.7rem;
  color: var(--fef-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.fef-root .step-detail-title {
  font-family: var(--fef-font-serif);
  font-size: 2.2rem;
  font-weight: 400;
  color: var(--fef-text-bright);
  line-height: 1.2;
  margin-bottom: 12px;
}

.fef-root .step-detail-sentence {
  font-size: 1.1rem;
  color: var(--fef-text);
  line-height: 1.7;
  margin-bottom: 20px;
}

.fef-root .everyday-box {
  padding: 20px 24px;
  background: var(--fef-good-bg);
  border: 1px solid var(--fef-good-border);
  border-radius: var(--fef-radius);
  margin-bottom: 20px;
}

.fef-root .everyday-box h4 {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--fef-proof-ok);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fef-root .everyday-box p, .fef-root .everyday-box ul {
  font-size: 0.86rem;
  color: var(--fef-text-secondary);
  line-height: 1.7;
}

.fef-root .everyday-box ul { margin-left: 18px; margin-top: 6px; }
.fef-root .everyday-box li { margin-bottom: 4px; }

.fef-root .critique-inline {
  padding: 18px 22px;
  background: var(--fef-critique-bg);
  border: 1px solid var(--fef-critique-border);
  border-radius: var(--fef-radius);
  margin-bottom: 20px;
}

.fef-root .critique-inline h4 {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--fef-critique-border);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fef-root .critique-inline p {
  font-size: 0.84rem;
  color: var(--fef-text-secondary);
  line-height: 1.7;
  margin-bottom: 8px;
}

.fef-root .critique-inline ul {
  font-size: 0.82rem;
  color: var(--fef-text-secondary);
  margin-left: 18px;
  margin-bottom: 10px;
}

.fef-root .critique-inline li { margin-bottom: 4px; line-height: 1.6; }

.fef-root .critique-inline .resolution {
  padding: 10px 14px;
  background: var(--fef-bg-surface);
  border-radius: var(--fef-radius-sm);
  font-size: 0.82rem;
  color: var(--fef-text);
  border-left: 3px solid var(--fef-accent);
  margin-top: 10px;
}

.fef-root .critique-inline .historical-test {
  padding: 10px 14px;
  background: var(--fef-bg-surface);
  border-radius: var(--fef-radius-sm);
  font-size: 0.8rem;
  color: var(--fef-text-secondary);
  margin-top: 8px;
  font-style: italic;
}

.fef-root .coq-block {
  padding: 20px 24px;
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: var(--fef-radius);
  font-family: var(--fef-font-mono);
  font-size: 0.75rem;
  line-height: 1.9;
  overflow-x: auto;
  margin: 12px 0;
  white-space: pre-wrap;
  border: 1px solid #313244;
}

.fef-root .coq-block .coq-keyword { color: #cba6f7; font-weight: 500; }
.fef-root .coq-block .coq-tactic { color: #89b4fa; }
.fef-root .coq-block .coq-comment { color: #6c7086; font-style: italic; }
.fef-root .coq-block .coq-type { color: #a6e3a1; }
.fef-root .coq-block .coq-prop { color: #f9e2af; }

.fef-root .graph-container {
  width: 100%;
  height: 400px;
  border-radius: var(--fef-radius);
  border: 1px solid var(--fef-border);
  background: var(--fef-bg-secondary);
  margin: 16px 0;
  overflow: hidden;
  position: relative;
}

.fef-root .graph-container svg { width: 100%; height: 100%; }

.fef-root .axiom-item {
  padding: 14px 18px;
  margin-bottom: 8px;
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-sm);
  background: var(--fef-bg-surface);
  cursor: pointer;
  transition: all 0.2s;
}

.fef-root .axiom-item:hover {
  border-color: var(--fef-accent);
  box-shadow: var(--fef-shadow-sm);
}

.fef-root .axiom-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fef-root .axiom-item-header .ax-marker {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--fef-accent);
  flex-shrink: 0;
}

.fef-root .axiom-item-header .ax-name {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--fef-text-bright);
}

.fef-root .axiom-item-header .ax-tag {
  margin-left: auto;
  font-family: var(--fef-font-mono);
  font-size: 0.65rem;
  color: var(--fef-text-tertiary);
  padding: 2px 8px;
  background: var(--fef-bg-secondary);
  border-radius: 10px;
}

.fef-root .axiom-item-human {
  font-size: 0.84rem;
  color: var(--fef-text-secondary);
  margin-top: 6px;
  padding-left: 18px;
}

.fef-root .axiom-item-details {
  display: none;
  margin-top: 12px;
  padding: 14px 18px;
  background: var(--fef-bg-secondary);
  border-radius: var(--fef-radius-sm);
}

.fef-root .axiom-item.expanded .axiom-item-details { display: block; }

.fef-root .verification-banner {
  background: var(--fef-bg-surface);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius);
  padding: 24px;
  margin-bottom: 40px;
  text-align: center;
  box-shadow: var(--fef-shadow-sm);
}

.fef-root .verification-banner h3 {
  font-family: var(--fef-font-serif);
  font-size: 1.15rem;
  margin-bottom: 12px;
  color: var(--fef-text-bright);
}

.fef-root .verification-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 500;
}

.fef-root .verification-progress {
  width: 100%;
  height: 3px;
  background: var(--fef-border);
  border-radius: 2px;
  margin-top: 16px;
  overflow: hidden;
}

.fef-root .verification-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--fef-accent), var(--fef-accent-light));
  border-radius: 2px;
  transition: width 0.4s ease;
  width: 0%;
}

.fef-root .verification-log {
  margin-top: 16px;
  text-align: left;
  font-family: var(--fef-font-mono);
  font-size: 0.7rem;
  color: var(--fef-text-tertiary);
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.9;
}

.fef-root .verification-log .log-entry {
  padding: 1px 0;
  opacity: 0;
  animation: fefLogFade 0.3s forwards;
}

.fef-root .log-ok { color: var(--fef-proof-ok); }
.fef-root .log-warn { color: var(--fef-proof-partial); }
.fef-root .log-err { color: var(--fef-proof-error); }

@keyframes fefLogFade { to { opacity: 1; } }

.fef-root .matrix-container { margin: 24px 0; overflow-x: auto; }

.fef-root .matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
  font-family: var(--fef-font-mono);
}

.fef-root .matrix-table th, .fef-root .matrix-table td {
  padding: 7px 9px;
  border: 1px solid var(--fef-border);
  text-align: center;
  transition: background 0.15s;
}

.fef-root .matrix-table th {
  background: var(--fef-bg-secondary);
  font-weight: 600;
  font-size: 0.68rem;
}

.fef-root .matrix-table td:hover { background: var(--fef-accent-glow); }

.fef-root .matrix-cell-ok { background: rgba(45,122,58,0.06); color: var(--fef-proof-ok); }
.fef-root .matrix-cell-partial { background: rgba(184,134,11,0.06); color: var(--fef-proof-partial); }
.fef-root .matrix-cell-identity { background: var(--fef-bg-secondary); color: var(--fef-text-tertiary); }

.fef-root .system-card {
  padding: 16px 20px;
  margin-bottom: 10px;
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-sm);
  background: var(--fef-bg-secondary);
}

.fef-root .system-card h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fef-text-bright);
  margin-bottom: 6px;
}

.fef-root .system-card p {
  font-size: 0.82rem;
  color: var(--fef-text-secondary);
  line-height: 1.6;
}

.fef-root .system-card .connection {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--fef-bg-surface);
  border-radius: 6px;
  font-size: 0.78rem;
  color: var(--fef-text-secondary);
  border-left: 3px solid var(--fef-accent);
}

.fef-root .show-all-mode .step-detail { display: block; margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid var(--fef-border); }
.fef-root .show-all-mode .step-detail:last-child { border-bottom: none; }

.fef-root .step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.fef-root .step-nav-btn {
  padding: 8px 16px;
  border: 1px solid var(--fef-border);
  background: var(--fef-bg-surface);
  color: var(--fef-text-secondary);
  border-radius: 20px;
  cursor: pointer;
  font-family: var(--fef-font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.fef-root .step-nav-btn:hover:not(:disabled) { border-color: var(--fef-accent); color: var(--fef-accent); }
.fef-root .step-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.fef-root .step-nav-indicator {
  font-family: var(--fef-font-mono);
  font-size: 0.72rem;
  color: var(--fef-text-tertiary);
}

.fef-root .console-panel {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #111118;
  color: #ddd;
  font-family: var(--fef-font-mono);
  font-size: 0.7rem;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  z-index: 999;
}

.fef-root .console-panel.open { max-height: 280px; border-top: 2px solid var(--fef-accent); }

.fef-root .console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #0a0a10;
  border-bottom: 1px solid #333;
}

.fef-root .console-body {
  padding: 10px 16px;
  overflow-y: auto;
  max-height: 240px;
  line-height: 1.8;
}

.fef-root .console-body .c-ok { color: #6abf5e; }
.fef-root .console-body .c-warn { color: #f0c040; }
.fef-root .console-body .c-err { color: #e74c3c; }
.fef-root .console-body .c-info { color: #5dade2; }

.fef-root .loading-dot {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--fef-accent);
  animation: fefPulse 1s infinite;
  margin: 0 2px;
}
.fef-root .loading-dot:nth-child(2) { animation-delay: 0.2s; }
.fef-root .loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes fefPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.fef-root .math-block {
  padding: 16px 20px;
  background: var(--fef-code-bg);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-sm);
  margin: 12px 0;
  overflow-x: auto;
  font-size: 0.95rem;
}

.fef-root .temml-block {
  padding: 18px 22px;
  background: var(--fef-code-bg);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-sm);
  margin: 14px 0;
  overflow-x: auto;
  text-align: center;
}

.fef-root .proof-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.68rem;
  font-family: var(--fef-font-mono);
  font-weight: 500;
}

.fef-root .proof-badge.verified { background: rgba(45,122,58,0.1); color: var(--fef-proof-ok); }
.fef-root .proof-badge.partial { background: rgba(184,134,11,0.1); color: var(--fef-proof-partial); }
.fef-root .proof-badge.axiom-badge { background: rgba(100,100,100,0.1); color: var(--fef-text-tertiary); }

.fef-root .tooltip-box {
  display: none;
  position: fixed;
  z-index: 2000;
  background: var(--fef-bg-surface);
  border: 1px solid var(--fef-border);
  border-radius: var(--fef-radius-sm);
  padding: 14px 18px;
  font-size: 0.8rem;
  max-width: 340px;
  box-shadow: var(--fef-shadow-lg);
  pointer-events: none;
}

.fef-root .tooltip-box.visible { display: block; }
.fef-root .tooltip-box h5 { font-size: 0.78rem; margin-bottom: 6px; color: var(--fef-text-bright); }
.fef-root .tooltip-box p { font-size: 0.76rem; color: var(--fef-text-secondary); line-height: 1.55; }

.fef-root .fade-in { animation: fefFadeInUp 0.5s ease forwards; opacity: 0; }
@keyframes fefFadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.fef-root .stagger-1 { animation-delay: 0.1s; }
.fef-root .stagger-2 { animation-delay: 0.2s; }
.fef-root .stagger-3 { animation-delay: 0.3s; }
.fef-root .stagger-4 { animation-delay: 0.4s; }
.fef-root .stagger-5 { animation-delay: 0.5s; }

@media (max-width: 700px) {
  .fef-root { font-size: 15px; }
  .fef-root .top-bar { padding: 10px 14px; }
  .fef-root .container { padding: 80px 16px 120px; }
  .fef-root .section-block { padding: 20px 16px; }
  .fef-root .hero-section { padding: 32px 16px; }
  .fef-root .hero-section h1 { font-size: 2rem; }
  .fef-root .step-detail-title { font-size: 1.6rem; }
  .fef-root .graph-container { height: 300px; }
  .fef-root .coq-block { font-size: 0.68rem; padding: 14px 16px; }
  .fef-root .matrix-table { font-size: 0.65rem; }
  .fef-root .matrix-table th, .fef-root .matrix-table td { padding: 5px 6px; }
}

@media (max-width: 480px) {
  .fef-root .top-bar-buttons { gap: 4px; }
  .fef-root .top-btn { padding: 5px 9px; font-size: 0.65rem; }
  .fef-root .quick-card { padding: 14px 16px; }
}

@media print {
  .fef-root .top-bar, .fef-root .console-panel, .fef-root .top-bar-buttons { display: none; }
  .fef-root .container { padding: 20px; max-width: 100%; }
  .fef-root .section-block { break-inside: avoid; box-shadow: none; border: 1px solid #ccc; }
}

.fef-root ::-webkit-scrollbar { width: 6px; height: 6px; }
.fef-root ::-webkit-scrollbar-track { background: var(--fef-bg-secondary); }
.fef-root ::-webkit-scrollbar-thumb { background: var(--fef-border); border-radius: 3px; }
.fef-root ::-webkit-scrollbar-thumb:hover { background: var(--fef-text-tertiary); }

.fef-root ::selection { background: var(--fef-accent-glow); color: var(--fef-text-bright); }

.fef-root :focus-visible { outline: 2px solid var(--fef-accent); outline-offset: 2px; border-radius: 4px; }
`;
	document.head.appendChild(style);
}
