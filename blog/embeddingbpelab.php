<?php include_once("functions.php"); ?>

<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ## 🧬 Semantische BPE-Vektoren
    In diesem Labor siehst du, wie **Sub-words** die Bedeutung im Raum gezielt verschieben. 
    Die Achsen sind hier fest definiert: 
    * **X-Achse:** Status (Gering → Royal)
    * **Y-Achse:** Gender (Männlich → Weiblich)
    * **Z-Achse:** Spezies (Mensch → Tier)
</div>

<div class="grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; margin-top: 20px;">
    <div class="layers-vertical" style="display: flex; flex-direction: column; gap: 15px;">
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 2px solid #ef4444;">
            <label style="font-weight: bold; display: block; margin-bottom: 8px;">Kombiniere Tokens (z.B. Lioness, Kingly, Goddess):</label>
            <input type="text" id="bpe-input" class="bw-cell" style="width: 100%; font-size: 1.1rem; padding: 10px;" 
                   value="Lioness" oninput="processBPEEmbedding()">
            
            <div id="bpe-tokens-display" style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;"></div>
        </div>

        <div id="result-display" style="padding: 20px; background: #fff1f2; border: 2px solid #fb7185; border-radius: 12px; text-align: center;">
            <span style="font-size: 0.75rem; color: #9f1239; font-weight: bold; text-transform: uppercase;">Resultierender Begriff:</span>
            <strong id="result-word" style="font-size: 2.2rem; color: #9f1239; display: block;">-</strong>
        </div>

        <div class="vocab-box" style="background: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <span style="font-size: 0.75rem; font-weight: bold; color: #64748b; display: block; margin-bottom: 5px;">BAUSTEINE IM SYSTEM:</span>
            <div id="token-vocab-list" style="font-family: monospace; font-size: 0.8rem; color: #475569; line-height: 1.4;"></div>
            <p style="font-size: 0.7rem; color: #94a3b8; margin-top:10px;">Versuche: "Lioness", "Princess", "Godly", "Kingly"</p>
        </div>
    </div>
    
    <div id="bpe-3d-plot" style="min-height: 550px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
</div>
