<style>
    .token-chip { 
        display: inline-flex; flex-direction: column; padding: 10px; 
        border-radius: 8px; color: white; margin-right: 8px; 
        font-family: 'Courier New', monospace; min-width: 70px; text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .step-label { font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 10px; display: block; }
    .lab-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
</style>

<div class="md" style="background: #f1f5f9; padding: 30px; border-radius: 20px;">
    <h2 style="margin-top: 0;">🤖 Transformer Inside</h2>
    <p>Klicke auf eine Prediction, um den Satz fortzuführen. Beobachte, wie die <b>Attention</b> den Fokus verschiebt.</p>

    <div class="grid-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
        
        <div>
            <div class="lab-card">
                <span class="step-label">1. Input Tokens (Text zu Vektoren)</span>
                <div id="token-stream" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
            </div>

            <div class="lab-card">
                <span class="step-label">2. Self-Attention (Kontext-Bezüge)</span>
                <canvas id="attention-canvas" width="500" height="100" style="width: 100%; height: 100px;"></canvas>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; padding: 0 20px;">
                    <span>Vergangenheit</span>
                    <span>Aktuelles Token</span>
                </div>
            </div>
        </div>

        <div class="lab-card" style="border-left: 4px solid #3b82f6;">
            <span class="step-label">3. Next Token Logits</span>
            <div id="prob-container"></div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 0.8rem; color: #475569; line-height: 1.4;">
                <b>Warum?</b> Weil "König" im Kontext steht, feuern die Neuronen für "Krone" am stärksten. Ohne das Wort "König" wäre "Verantwortung" wahrscheinlicher.
            </p>
            <button class="btn" style="width: 100%; background: #f1f5f9; color: #475569;" onclick="currentSentence=['Der']; renderAll();">Reset</button>
        </div>

    </div>
</div>
