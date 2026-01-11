<?php include_once("functions.php"); ?>

<div class="panel">
    <div class="md">
        <h2>Multi-Head Self-Attention Lab</h2>
        <p>In modernen LLMs wie ChatGPT arbeiten oft 12 bis 96 "Attention Heads" gleichzeitig. Jeder Head lernt, auf andere Aspekte der Sprache zu achten.</p>
    </div>

    <div class="grid-layout" style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <div class="controls-column">
            <div class="lab-card">
                <label>Satz für Multi-Head Analyse:</label>
                <input type="text" id="sa-input" class="bw-cell" 
                       value="Der Jäger sieht den Bär" 
                       oninput="MultiHeadLab.update()"
                       style="width: 100%; font-weight: bold; margin: 10px 0;">
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <div style="flex:1; border-left: 4px solid #3b82f6; padding-left: 10px;">
                        <small style="color:#3b82f6; font-weight:bold;">Head 1: Struktur</small><br>
                        <span style="font-size:0.75rem;">Fokussiert auf Subjekt-Objekt Beziehungen.</span>
                    </div>
                    <div style="flex:1; border-left: 4px solid #ef4444; padding-left: 10px;">
                        <small style="color:#ef4444; font-weight:bold;">Head 2: Semantik</small><br>
                        <span style="font-size:0.75rem;">Fokussiert auf die Bedeutung der Begriffe.</span>
                    </div>
                </div>
            </div>

            <div class="lab-card" style="margin-top: 20px;">
                <h4>Kombinierte Attention Matrix</h4>
                <div id="sa-matrix-container"></div>
            </div>
        </div>

        <div class="visual-column">
            <div id="sa-plot" style="height: 600px; background: #000; border-radius: 12px;"></div>
        </div>
    </div>
</div>
