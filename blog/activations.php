<div class="md">
    ### Die Lupe: Was macht die Funktion mit $x$?
    In einem neuronalen Netz ist die Aktivierungsfunktion der letzte Schritt eines Neurons. Sie nimmt eine Zahl (den Input) und "verformt" ihn nach einer festen Regel.
    
    * **Keine versteckten Schichten:** Wir schauen uns hier nur $y = f(x)$ an.
    * **Identität ($f(x)=x$):** Das ist der Zustand ohne Aktivierung – eine gerade Linie.
</div>

<div class="grid-layout" style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label><b>Wähle die Funktion $f$:</b></label>
            <select id="pure-act-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%;">
                <option value="identity">Identität (Linear: x)</option>
                <option value="sigmoid">Sigmoid (Wahrscheinlichkeit)</option>
                <option value="relu">ReLU (Gleichrichter)</option>
                <option value="tanh">Tanh (Skalierung)</option>
                <option value="step">Step (Alles oder Nichts)</option>
            </select>
        </div>
        <div id="pure-math-box" style="padding: 15px; background: white; border-radius: 8px; border: 1px solid #dcfce7; font-family: 'Courier New', monospace;">
            </div>
    </div>

    <div id="plot-pure-activation" style="height: 400px; background: white; border-radius: 8px;"></div>
    
    <div style="margin-top: 15px;">
        <label><b>Test-Input ($x$ live bewegen):</b></label>
        <input type="range" id="pure-x-input" min="-5" max="5" step="0.1" value="0" style="width: 100%;">
        <div id="pure-result-display" style="text-align: center; font-size: 1.2em; font-weight: bold; margin-top: 10px; color: #166534;">
            f(0.00) = 0.00
        </div>
    </div>
</div>
