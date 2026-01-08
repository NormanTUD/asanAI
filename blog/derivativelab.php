<?php include_once("functions.php"); ?>
<div class="md">
    ### Warum braucht eine KI Ableitungen?
    In der KI ist das Ziel fast immer, einen **Fehler (Loss)** zu minimieren. 
    Stell dir vor, die Kurve unten ist dein Fehler. Du willst zum tiefsten Punkt.
    
    * **Die Ableitung ($f'(x)$)** ist dein Kompass: Sie sagt dir, in welche Richtung der Boden steiler wird.
    * **Gradient Descent:** Die KI berechnet die Ableitung an ihrer aktuellen Position und geht einen kleinen Schritt in die *entgegengesetzte* Richtung.
    * **Limes ($h \to 0$):** In der Programmierung können wir $h$ nicht "Null" setzen (Division durch Null!), aber wir wählen ein so kleines $h$, dass die Approximation für das Training ausreicht.
</div>

<div class="grid-layout" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 20px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <label><b>1. Funktion wählen:</b></label>
            <select id="deriv-func-select" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; margin-bottom: 15px;">
                <option value="x*x">f(x) = x² (Quadratisch)</option>
                <option value="Math.sin(x)">f(x) = sin(x) (Wellen)</option>
                <option value="Math.exp(x)/10">f(x) = e^x / 10 (Exponentiell)</option>
                <option value="Math.pow(x,3) - 3*x">f(x) = x³ - 3x (Polynom)</option>
            </select>

            <label><b>2. Position auf der Kurve (x):</b></label>
            <input type="range" id="deriv-x-slider" min="-4" max="4" step="0.1" value="1" style="width: 100%;">
            <span id="deriv-x-value">x = 1.0</span>
        </div>
        
        <div>
            <label><b>3. Schrittweite ($h$):</b></label>
            <input type="range" id="deriv-h-slider" min="0.0001" max="3" step="0.01" value="1.5" style="width: 100%;">
            <span id="deriv-h-value">h = 1.5</span>
            
            <label style="margin-top:10px; display:block;"><b>4. Zoom-Faktor:</b></label>
            <input type="range" id="deriv-zoom-slider" min="1" max="10" step="0.5" value="1" style="width: 100%;">
        </div>
    </div>

    <div style="display: flex; gap: 15px;">
        <div id="plot-derivative" style="flex: 2; height: 450px; background: white; border-radius: 8px;"></div>
        <div id="deriv-stats" style="flex: 1; padding: 15px; background: #1e293b; color: #f8fafc; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.9em;">
            <h4 style="color: #10b981; margin-top:0;">Live-Analyse</h4>
            <div id="deriv-math-details"></div>
        </div>
    </div>
</div>
