<?php include_once("functions.php"); ?>
<div class="md">
    ### Der Optimizer: Wie wir den Berg absteigen
    Die Ableitung gibt uns nur die Richtung. Der Optimizer entscheidet über die Strategie. 
    Stell dir vor, du rollst einen Ball einen Hügel hinunter:
    
    * **SGD (Stochastic Gradient Descent):** Ein einfacher Schritt nach dem anderen.
    * **Momentum:** Der Ball wird schneller, wenn es lange bergab geht (er behält Schwung).
    * **Adam:** Der "Tesla" unter den Optimizern. Er passt die Geschwindigkeit für jeden Parameter individuell an.
</div>

<div class="grid-layout" style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label><b>Optimizer Strategie:</b></label>
            <select id="opt-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; margin-bottom: 10px;">
                <option value="sgd">SGD (Standard)</option>
                <option value="momentum">Momentum (Schwung)</option>
                <option value="adam">Adam (Adaptiv)</option>
            </select>

            <label><b>Lernrate (Learning Rate):</b></label>
            <input type="range" id="opt-lr" min="0.01" max="0.5" step="0.01" value="0.1" style="width: 100%;">
            <span id="opt-lr-val">LR = 0.1</span>
        </div>
        
        <div>
            <label><b>Startposition (x):</b></label>
            <input type="range" id="opt-start-x" min="-4" max="4" step="0.1" value="-3.5" style="width: 100%;">
            
            <button id="btn-run-opt" class="btn btn-train" style="width: 100%; margin-top: 15px;" onclick="runOptimizerAnimation()">
                ▶ Simulation Starten
            </button>
        </div>
    </div>

    <div style="position: relative;">
        <div id="plot-optimizer" style="height: 400px; background: white; border-radius: 8px;"></div>
        <div id="opt-console" class="status-console" style="height: 100px; margin-top: 10px;"></div>
    </div>
</div>
