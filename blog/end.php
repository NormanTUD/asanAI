<div class="md">
    ## Part 6: The Neural Universe (Interactive Sandbox)
    Now, let's look at the big picture. In a real AI, thousands of words form "neighborhoods" (clusters).
    When you type a sentence, the Transformer connects these far-away points in milliseconds.
</div>

<div class="grid-layout">
    <div class="layers-vertical">
        <h4>Sentence Architect</h4>
        <p style="font-size: 0.8rem; color: #64748b;">
            Type a sentence using words like: <i>love, hate, cat, dog, king, queen, pizza, apple, happy, sad.</i>
        </p>
        <input type="text" id="universe-input" class="bw-cell" style="width: 100%;" value="The happy king loves his dog" oninput="runUniverse()">

        <div id="universe-console" class="status-console" style="height: 100px;">
            Universe initialized. 25 words active.
        </div>

        <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 0.75rem;">
            <strong>Pro-Tip:</strong> Try <i>"The sad cat hates the pizza"</i> to see how the points in different "neighborhoods" react to each other.
        </div>
    </div>
    <div id="universe-plot" class="plot-container" style="height: 600px;"></div>
</div>


