<?php include_once("functions.php"); ?>

<section style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 1400px; margin: auto; padding: 20px; color: #1e293b;">
    <header style="margin-bottom: 30px; border-bottom: 3px solid #4338ca; padding-bottom: 10px;">
        <h1 style="margin:0; color: #4338ca;">⚖️ Deep Learning Normalization: Step-by-Step</h1>
        <p style="font-size: 1.1rem; color: #64748b;">Warum müssen wir Daten normalisieren? Um "explodierende Werte" zu bändigen und dem Modell zu helfen, schneller zu konvergieren.</p>
    </header>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">1. Input (Raw Data)</h3>
            <div id="input-plot" style="height: 350px;"></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">2. Output (Normalized)</h3>
            <div id="output-plot" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
        <aside>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <h4 style="margin-top:0;">⚙️ Steuerzentrale</h4>
                <p style="font-size: 0.9rem;">Wähle eine Methode, um die exakte Berechnung auf Papier nachzuvollziehen:</p>
                
                <button onclick="NormLab.process('batch')" style="width:100%; padding:12px; background:#4338ca; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:10px;">Batch Normalization</button>
                <button onclick="NormLab.process('layer')" style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Layer Normalization</button>
                
                <div style="margin-top:20px; font-size: 0.85rem; line-height: 1.4; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 15px;">
                    <strong>Input Matrix:</strong><br>
                    <table id="input-table" style="width:100%; margin-top:10px; border-collapse: collapse; text-align: center; background: white;"></table>
                </div>
            </div>
        </aside>

        <article id="math-display" style="background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 500px;">
            <div style="text-align: center; color: #94a3b8; margin-top: 100px;">
                <p style="font-size: 1.5rem;">← Wähle eine Methode</p>
                <p>Jeder Rechenschritt wird hier mit MathJax live generiert.</p>
            </div>
        </article>
    </div>
</section>
