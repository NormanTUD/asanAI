<?php include_once("functions.php"); ?>
<div class="md" style="background: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px;">
    ### 📈 Vector Evolution: 1D to 3D
    Observe how the blue path arrows in each stage visualize the mathematical operations in vector space.
</div>

<div id="evolution-lab" style="display: flex; flex-direction: column; gap: 60px; margin-top: 30px;">
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 1: 1D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-1d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Cold + Warm" onkeyup="if(event.key==='Enter') calcEvo('1d')">
                <div id="res-1d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #3b82f6;">Match: -</div>
            </div>
            <div id="plot-1d" style="height: 180px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>

    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 2: 2D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-2d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Man + Power" onkeyup="if(event.key==='Enter') calcEvo('2d')">
                <div id="res-2d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #10b981;">Match: -</div>
            </div>
            <div id="plot-2d" style="height: 400px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>

    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 3: 3D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-3d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., King + Animal" onkeyup="if(event.key==='Enter') calcEvo('3d')">
                <div id="res-3d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #6366f1;">Match: -</div>
            </div>
            <div id="plot-3d" style="height: 500px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>
</div>
