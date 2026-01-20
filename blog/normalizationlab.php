<?php include_once("functions.php"); ?>

<section style="font-family: 'Segoe UI', system-ui, sans-serif; width: 100%; padding: 20px; color: #1e293b; box-sizing: border-box;">

    <header style="margin-bottom: 30px;">
        <h1>⚖️ Layer Normalization Mechanics</h1>
        <p>Layer Normalization (LN) operates **horizontally** across the feature dimension for each individual sample. Use the table below to edit values and see the transformation in real-time.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">
            <strong>Standard Formula:</strong> 
            $x_\text{norm} = 2 \times \frac{x - \min}{\max - \min} - 1$
        </div>
    </header>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">1. Input (Raw Magnitudes)</h3>
            <div id="input-plot" style="height: 350px;"></div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;">2. Output (Layer Normalized)</h3>
            <div id="output-plot" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
        <aside>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <h4 style="margin-top:0;">⚙️ Data Matrix</h4>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">Click and type in the cells below to edit data:</p>
                <table id="input-table" style="width:100%; border-collapse: collapse; text-align: center; background: white; border: 1px solid #e2e8f0;"></table>
                <button onclick="NormLab.process()" style="width:100%; margin-top:15px; padding:12px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Refresh Calculations</button>
            </div>
        </aside>

        <article>
            <div id="math-display" style="background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 400px;">
                </div>
        </article>
    </div>
</section>
