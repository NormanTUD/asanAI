<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ### 🧮 Enhanced 3D Vector Lab
    Try these equations:
    * `King - Man + Woman` → **Queen**
    * `Power * 0.5` → **Prince** (Scaling status!)
    * `Man + Power` → **King**
</div>

<div class="grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; margin-top: 20px;">
    <div class="layers-vertical" style="display: flex; flex-direction: column; gap: 15px;">
        <h4>Input Equation</h4>
        <div style="display: flex; gap: 5px;">
            <input type="text" id="vec-input" class="bw-cell" style="flex-grow: 1; font-size: 1.1rem; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px;" placeholder="King - Man + Woman">
            <button class="btn" style="background:#3b82f6; color:white; padding: 12px 20px; border:none; border-radius: 6px; cursor:pointer; font-weight: bold;" onclick="calcVector()">Calculate</button>
        </div>

        <div id="result-display" style="display:none; padding: 20px; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; text-align: center;">
            <span style="display:block; font-size: 0.8rem; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">Closest Match:</span>
            <strong id="result-word" style="font-size: 2.2rem; color: #166534;">-</strong>
        </div>
        
        <div id="vec-console" class="status-console" style="height: 100px; overflow-y: auto; background: #f8fafc; padding: 10px; font-family: monospace; font-size: 0.85rem; border: 1px solid #e2e8f0; border-radius: 8px;">
            <span style="font-size: 0.75rem; font-weight: bold; color: #64748b; display: block; margin-bottom: 5px;">SYSTEM LOG:</span>
        </div>

        <div class="vocab-box" style="background: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <span style="font-size: 0.75rem; font-weight: bold; color: #64748b; display: block; margin-bottom: 5px;">AVAILABLE WORDS:</span>
            <div id="available-words-list" style="font-family: monospace; font-size: 0.8rem; color: #475569;"></div>
        </div>
    </div>
    
    <div id="vec-3d-plot" class="plot-container" style="min-height: 500px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
</div>

<script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
<script src="helper.js"></script>
<script src="embeddinglab.js"></script>
