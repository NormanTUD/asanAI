<div class="md">
    ## 🧠 Das finale Labor: Datenformung & Optimierung

    In diesem interaktiven Crescendo kannst du alles selbst steuern. 
    1. **Links** definierst du die "Welt" (deine Datenpunkte im 3D-Raum).
    2. **Rechts oben** siehst du die Struktur, die die KI darin erkennt.
    3. **Rechts unten** siehst du das mathematische Gebirge, das durch deine Daten entsteht.

    <div class="grid-layout" style="grid-template-columns: 350px 1fr;">
        <div class="layers-vertical">
            <h3>🎛️ Data Factory</h3>
            <div id="master-data-input" style="max-height: 300px; overflow-y: auto;"></div>
            
            <hr>
            
            <h3>⚙️ Hyperparameter</h3>
            <label>Learning Rate: <span id="lr-val">0.1</span></label>
            <input type="range" min="0.01" max="0.5" step="0.01" value="0.1" 
                   oninput="masterState.lr = this.value; document.getElementById('lr-val').innerText = this.value">
            
            <button class="btn btn-train" onclick="startOptimizationAnimation()">🚀 Start Gradient Descent</button>
            <button class="btn btn-stop" onclick="masterState.isOptimizing = false">⏹️ Stop</button>
        </div>

        <div class="layers-vertical" style="background: white;">
            <div style="display: grid; grid-template-rows: 1fr 1fr; gap: 10px; height: 700px;">
                <div id="master-manifold-plot" class="plot-container" style="height: 100%;"></div>
                <div id="master-loss-landscape" class="plot-container" style="height: 100%;"></div>
            </div>
        </div>
    </div>

    ### Was passiert hier gerade?
    Wenn du einen Punkt in der Tabelle änderst, berechnet die Engine sofort die **Loss Landscape** neu. Jede Datenkonstellation erzeugt ein anderes "Gebirge". 
    Der gelbe Punkt beim Training zeigt dir den **Gradient Descent**: Er sucht den steilsten Weg nach unten zum globalen Minimum deiner spezifischen Daten.
</div>
