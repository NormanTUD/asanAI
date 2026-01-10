<?php include_once("functions.php"); ?>

<div class="header-full" style="background: #4338ca; color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
    <h3 style="margin:0;">⚖️ Normalization Lab: Batch vs. Layer</h3>
    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9rem;">Verstehe, wie KI-Modelle Daten "zentrieren", um schneller und stabiler zu lernen.</p>
</div>

<div style="display: grid; grid-template-columns: 320px 1fr; gap: 20px;">
    <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h4 style="margin-top:0;">Konfiguration</h4>
        
        <label style="display:block; margin-bottom:10px;"><b>Modus:</b></label>
        <select id="norm-mode" class="btn" style="width:100%; background:white; color:black; border:1px solid #ccc; margin-bottom:20px;" onchange="NormLab.update()">
            <option value="raw">Rohdaten (Keine Norm.)</option>
            <option value="batch">Batch Normalization</option>
            <option value="layer">Layer Normalization</option>
        </select>

        <div id="norm-explanation" style="font-size: 0.85rem; line-height: 1.5; color: #475569;">
            </div>

        <div style="margin-top:20px; padding:10px; background:#f1f5f9; border-radius:8px;">
            <small><b>Warum Normalisierung?</b><br>
            Ohne Normierung explodieren Gradienten oder verschwinden. Es sorgt dafür, dass alle Features die "gleiche Stimme" haben.</small>
        </div>
    </div>

    <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div id="plot-normalization" style="height: 400px;"></div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div id="math-norm-formula" class="math-tex" style="background:#f8fafc; padding:10px; border-radius:8px; font-size:0.8rem;">
                </div>
            <div id="stats-box" style="background:#f0f9ff; padding:10px; border-radius:8px; font-size:0.8rem; border:1px solid #bae6fd;">
                </div>
        </div>
    </div>
</div>
