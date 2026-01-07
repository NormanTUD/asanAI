<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ### 🧮 3D Vector Calculator
    In this lab, words live in a 3D space with these axes:
    1. **Status** (Peasant vs. Royal)
    2. **Gender** (Male vs. Female)
    3. **Species** (Human vs. Animal)
    
    Try typing: `King - Man + Woman` or `Puppy - Dog + Cat`.
</div>

<div class="grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; margin-top: 20px;">
    <div class="layers-vertical" style="display: flex; flex-direction: column; gap: 15px;">
        <h4>Input Equation</h4>
        <input type="text" id="vec-input" class="bw-cell" style="width: 100%; font-size: 1.1rem; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px;" placeholder="King - Man + Woman">
        
        <button class="btn" style="background:#3b82f6; color:white; padding: 12px; border:none; border-radius: 6px; cursor:pointer; font-weight: bold;" onclick="calcVector()">
            Calculate Result
        </button>

        <div id="result-display" style="display:none; padding: 20px; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; text-align: center;">
            <span style="display:block; font-size: 0.9rem; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Closest Match:</span>
            <strong id="result-word" style="font-size: 2rem; color: #1e40af;">-</strong>
        </div>
        
        <div id="vec-console" class="status-console" style="height: 100px; overflow-y: auto; background: #f8fafc; padding: 10px; font-family: monospace; font-size: 0.85rem; border: 1px solid #e2e8f0;">
            Available: Man, Woman, King, Queen, Boy, Girl, Dog, Cat, Puppy, Kitten, Apple
        </div>
        
        <p style="font-size: 0.8rem; color: #64748b; font-style: italic;">
            *ELI5: The AI finds the point in 3D space that is closest to your mathematical result.*
        </p>
    </div>
    
    <div id="vec-3d-plot" class="plot-container" style="height: 500px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;"></div>
</div>
