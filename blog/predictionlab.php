<div class="md" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
    <h3 style="margin-top: 0;">🔗 Transformer Attention & Probabilities</h3>
    <p style="font-size: 0.9rem; color: #64748b;">Wie Wörter sich im Kontext gegenseitig beeinflussen.</p>

    <div style="position: relative; margin-bottom: 20px;">
        <canvas id="attention-canvas" style="width: 100%; height: 120px;"></canvas>
        <div id="token-stream" style="display: flex; gap: 10px; justify-content: flex-start;"></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div id="prob-container"></div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 0.85rem; border-left: 4px solid #3b82f6;">
            <strong>Embedding Check:</strong><br>
            Das Modell berechnet die Ähnlichkeit zwischen dem Vektor des aktuellen Wortes und der Vergangenheit.<br><br>
            <em>Experiment:</em> Wähle "KI" statt "König" und beobachte, wie sich die Vorhersagen für das nächste Wort komplett verschieben.
            
            <div style="margin-top: 15px;">
                <button class="btn" onclick="currentSentence=['Der','König']; renderAll();">Reset: König</button>
                <button class="btn" onclick="currentSentence=['Die','KI']; renderAll();">Reset: KI</button>
            </div>
        </div>
    </div>
</div>
