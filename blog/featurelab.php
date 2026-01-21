<?php include_once("functions.php"); ?>

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px; font-family: 'Segoe UI', sans-serif; background: #f1f5f9;">
	<p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 0.9rem;">Edit the kernel matrices to see how convolution extracts features.</p>

    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px;">
        <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: fit-content;">
            <h4 style="margin-top:0;">Input Image</h4>
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #cbd5e1; width:200px; image-rendering:pixelated; border-radius: 4px;"></canvas>
                <p style="color: #64748b; font-size: 0.8rem;">Source Image</p>
            </div>
            <div style="margin-top: 20px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 0.8rem; color: #475569;">
                <strong>Info:</strong> Each matrix (kernel) acts as a specialized "eye" that searches for specific patterns in the image.
            </div>
        </div>

        <div id="filter-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            </div>
    </div>
</div>
