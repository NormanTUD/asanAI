<?php include_once("functions.php"); ?>
<div class="md">
    ### Deep-Dive: The Neural Decision Makers
    Activation functions are the mathematical "gates" of a neural network. Without them, a network would just be a series of linear transformations—essentially one giant linear equation.
    
    By introducing **non-linearity**, these functions allow the model to learn complex patterns, from the curve of a cat's ear to the nuances of human speech.
</div>

<div class="activation-lab-container" style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin-top: 20px;">
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
            <label style="display: block; margin-bottom: 8px;"><b>Select Activation Function:</b></label>
            <select id="pure-act-type" class="btn" style="background: white; color: black; border: 1px solid #ccc; width: 100%; padding: 10px;">
                <option value="relu">ReLU (The Modern Standard)</option>
                <option value="sigmoid">Sigmoid (The Classic S-Curve)</option>
                <option value="tanh">Tanh (Zero-Centered)</option>
                <option value="leaky_relu">Leaky ReLU (Death Prevention)</option>
                <option value="identity">Identity (Linear)</option>
            </select>
        </div>
        <div id="pure-math-box" style="padding: 15px; background: white; border-radius: 8px; border: 1px solid #dcfce7; font-size: 1.2em; display: flex; align-items: center; justify-content: center; min-height: 60px;">
        </div>
    </div>

    

    <div id="plot-pure-activation" style="height: 350px; background: white; border-radius: 8px; width: 100%;"></div>
    
    <div id="act-analysis-box" style="margin-top: 20px; padding: 20px; background: #f8fafc; border-left: 5px solid #22c55e; border-radius: 4px; width: 100%; box-sizing: border-box;">
        <h4 id="act-title" style="margin-top:0; color: #166534; font-size: 1.3em;">Function Name</h4>
        <div id="act-description" class="md" style="font-size: 1em; line-height: 1.6;">
        </div>
    </div>
</div>
