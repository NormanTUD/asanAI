<style>
    .lab-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .token-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; min-width: 70px; cursor: pointer; transition: 0.2s; }
    .token-chip:hover { border-color: #3b82f6; background: #eff6ff; }
    .token-id { font-size: 10px; color: #94a3b8; font-family: monospace; text-align: center; }
    .token-word { font-weight: bold; font-size: 14px; text-align: center; }
    .prob-row { padding: 10px; border: 1px solid #f1f5f9; border-radius: 8px; cursor: pointer; margin-bottom: 6px; }
    .prob-row:hover { border-color: #3b82f6; background: #f8fafc; }
</style>

<div class="md">
    <h2>🧩 Die Anatomie eines Satzes</h2>
    <p>Hier siehst du, wie die KI Sprache in Geometrie verwandelt. Jedes Wort ist ein Punkt im Raum.</p>

    <div class="grid-layout" style="display: grid; grid-template-columns: 1fr 400px; gap: 20px;">
        
        <div class="layers-vertical">
            <div class="lab-card">
                <span style="font-size: 0.7rem; font-weight: bold; color: #64748b; text-transform: uppercase;">1. Self-Attention Map</span>
                <canvas id="attention-canvas" style="width: 100%; height: 120px;"></canvas>
                <div id="token-stream" style="display: flex; gap: 10px; justify-content: flex-start; margin-top: 10px;"></div>
            </div>

            <div class="lab-card">
                <span style="font-size: 0.7rem; font-weight: bold; color: #64748b; text-transform: uppercase;">2. Nächstes Token (Prediction)</span>
                <div id="prob-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;"></div>
            </div>
        </div>

        <div class="lab-card" style="height: 100%;">
            <span style="font-size: 0.7rem; font-weight: bold; color: #64748b; text-transform: uppercase;">3. 3D Embedding Space</span>
            <div id="embedding-plot" style="width: 100%; height: 300px;"></div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 10px; padding: 10px; background: #f8fafc; border-radius: 6px;">
                <strong>Aha-Effekt:</strong> Achte darauf, wie Punkte von "König" und "Krone" nah beieinander schweben. Das Modell "versteht" Bedeutung durch räumliche Nähe.
            </div>
            <button class="btn" onclick="currentSentence=['Der','König']; renderAll();" style="width: 100%; margin-top: 10px;">Reset auf "Der König"</button>
        </div>

    </div>
</div>
