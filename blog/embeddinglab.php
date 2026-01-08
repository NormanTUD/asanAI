<?php include_once("functions.php"); ?>
<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ### 🧮 Advanced 3D Vector Lab
    Berechne komplexe Pfade: `King - 0.5 * Power + Animal`. Die Pfeile im Plot zeigen dir jetzt genau an, welcher Rechenschritt (`+`, `-`, `*`) gerade ausgeführt wurde.
</div>

<div class="grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; margin-top: 20px;">
    <div class="layers-vertical" style="display: flex; flex-direction: column; gap: 15px;">
        <div id="result-display" style="display:none; padding: 25px; background: #f0fdf4; border: 3px solid #22c55e; border-radius: 12px; text-align: center; order: -1;">
            <span style="font-size: 0.85rem; color: #166534; font-weight: bold; text-transform: uppercase;">Closest Match:</span>
            <strong id="result-word" style="font-size: 2.8rem; color: #166534; display: block; line-height: 1;">-</strong>
        </div>

        <div style="display: flex; gap: 5px;">
            <input type="text" id="vec-input" class="bw-cell" style="flex-grow: 1; padding: 15px; border: 2px solid #3b82f6; border-radius: 8px; font-size: 1.1rem;" placeholder="z.B. King - 0.5 * Power + Animal">
            <button class="btn" style="background:#3b82f6; color:white; padding: 0 20px; border-radius: 8px; cursor:pointer; font-weight: bold;" onclick="calcVector()">Berechnen</button>
        </div>
        
        <div id="vec-console" class="status-console" style="height: 120px; overflow-y: auto; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 0.85rem;">
            <strong>History:</strong>
            <div id="history-content"></div>
        </div>

        <div class="vocab-box" style="background: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <span style="font-size: 0.75rem; font-weight: bold; color: #64748b; display: block; margin-bottom: 5px;">VERFÜGBAR:</span>
            <div id="available-words-list" style="font-family: monospace; font-size: 0.8rem; color: #475569; line-height: 1.4;"></div>
        </div>
    </div>
    
    <div id="vec-3d-plot" style="min-height: 550px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
</div>
