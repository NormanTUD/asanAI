<?php include_once("functions.php"); ?>

<section style="font-family: 'Segoe UI', sans-serif; max-width: 1100px; margin: auto; padding: 20px;">
    <header>
        <h1>Step-by-Step Normalization Guide</h1>
        <p>Compare <strong>Batch Normalization</strong> (Vertical) vs <strong>Layer Normalization</strong> (Horizontal).</p>
    </header>

    <main style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <section>
            <h3>1. Data Input</h3>
            <div id="input-plot" style="height: 250px; margin-bottom: 20px;"></div>
            <table id="input-table" style="width:100%; border-collapse: collapse; text-align: center;"></table>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="NormLab.process('batch')" style="flex:1; padding:12px; cursor:pointer;">Show Batch Norm Steps</button>
                <button onclick="NormLab.process('layer')" style="flex:1; padding:12px; cursor:pointer;">Show Layer Norm Steps</button>
            </div>
        </section>

        <section>
            <h3>2. Mathematical Breakdown</h3>
            <div id="math-display" style="background:#fff; border:1px solid #ddd; padding:20px; border-radius:8px; min-height: 400px; overflow-y: auto;">
                <p style="color: #888;">Select a method to see the calculations...</p>
            </div>
        </section>
    </main>

    <section style="margin-top: 30px;">
        <h3>3. Normalized Result</h3>
        <div id="output-plot" style="height: 250px;"></div>
    </section>
</section>
