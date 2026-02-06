<?php include_once("functions.php"); ?>

<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script src="https://d3js.org/d3.v7.min.js"></script>

<div id="paper-graph" style="width: 100%; height: 600px; border: 1px solid #ccc; background: #fdfdfd; border-radius: 8px;"></div>

<script>
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    window.onload = () => {
        if (typeof renderInteractiveGraph === 'function') {
            renderInteractiveGraph('paper-graph');
        }
    };
</script>

<div id="paper-graph" style="width: 100%; height: 80vh; background: #fff; border: 1px solid #ddd; margin: 20px 0;"></div>
