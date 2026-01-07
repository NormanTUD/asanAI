<div class="md" style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <h3>🔄 Der Weg zum nächsten Wort</h3>
    <p>Gib einen Satzanfang ein und schau, wie die KI Schicht für Schicht das nächste Token berechnet.</p>
    
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <input type="text" id="gpt-input" value="Der König trägt eine" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e0;">
        <button class="btn" onclick="processPredictionStep()">Nächstes Wort generieren</button>
    </div>

    <div id="prediction-viz" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
        <div class="step-box" id="step-tokens">
            <small>1. Tokenisierung</small>
            <div class="viz-content" style="background:#f1f5f9; min-height:60px; padding:5px; border-radius:4px; font-family:monospace;"></div>
        </div>
        <div class="step-box" id="step-embeddings">
            <small>2. Embedding</small>
            <div class="viz-content" style="background:#f0fdf4; min-height:60px; padding:5px; border-radius:4px;"></div>
        </div>
        <div class="step-box" id="step-attention">
            <small>3. Self-Attention</small>
            <div class="viz-content" style="background:#eff6ff; min-height:60px; padding:5px; border-radius:4px;"></div>
        </div>
        <div class="step-box" id="step-output">
            <small>4. Prediction</small>
            <div class="viz-content" style="background:#fff7ed; min-height:60px; padding:5px; border-radius:4px; font-weight:bold; color:#c2410c;"></div>
        </div>
    </div>

    <div id="loop-console" style="margin-top:20px; font-family:monospace; font-size:0.9rem; color:#475569;">
        <strong>Satz bisher:</strong> <span id="full-sentence-display">Der König trägt eine</span>
    </div>
</div>
