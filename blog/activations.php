<div class="md">
    ### Deep-Dive: Die Entscheidungsträger
    Jede Aktivierungsfunktion hat eine "Persönlichkeit". Manche sind streng (Step), manche sind sanft (Sigmoid) und manche sind effiziente Filter (ReLU).
</div>

<div class="grid-layout" style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label><b>Wähle die Funktion:</b></label>
            <select id="pure-act-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%;">
                <option value="identity">Identity (Keine Aktivierung)</option>
                <option value="sigmoid">Sigmoid (S-Kurve)</option>
                <option value="relu">ReLU (Standard)</option>
                <option value="tanh">Tanh (Symmetrisch)</option>
                <option value="step">Step (Binär)</option>
            </select>
        </div>
        <div id="pure-math-box" style="padding: 15px; background: white; border-radius: 8px; border: 1px solid #dcfce7; font-family: 'Courier New', monospace; min-height: 50px; display: flex; align-items: center; justify-content: center;">
            </div>
    </div>

    <div id="plot-pure-activation" style="height: 350px; background: white; border-radius: 8px;"></div>
    
    <div id="act-analysis-box" style="margin-top: 20px; padding: 20px; background: #f8fafc; border-left: 5px solid #22c55e; border-radius: 4px;">
        <h4 id="act-title" style="margin-top:0; color: #166534;">Funktions-Name</h4>
        <div id="act-description" class="md" style="font-size: 0.95em; line-height: 1.5;">
            </div>
    </div>
</div>
