<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ### 🧮 3D Vector Calculator
    In this lab, words live in a 3D space with these axes:
    1. **Status** (Peasant vs. Royal)
    2. **Gender** (Male vs. Female)
    3. **Species** (Human vs. Animal)
    
    Try typing: `King - Man + Woman` or `Puppy - Dog + Cat`.
</div>

<div class="grid-layout">
    <div class="layers-vertical">
        <h4>Input Equation</h4>
        <input type="text" id="vec-input" class="bw-cell" style="width: 100%; font-size: 1.1rem; padding: 10px;" placeholder="King - Man + Woman">
        <button class="btn" style="background:#3b82f6; color:white" onclick="calcVector()">Calculate Result</button>
        
        <div id="vec-console" class="status-console" style="height: 120px;">
            Available: Man, Woman, King, Queen, Boy, Girl, Dog, Cat, Puppy, Kitten, Apple
        </div>
        
        <p style="font-size: 0.8rem; color: #64748b;">
            *ELI5: The AI finds the point in 3D space that is closest to your mathematical result.*
        </p>
    </div>
    <div id="vec-3d-plot" class="plot-container" style="height: 450px;"></div>
</div>
