<?php include_once("functions.php"); ?>

<section id="norm-lab" style="font-family: sans-serif; max-width: 1000px; margin: auto; color: #333;">
    <header>
        <h2 style="border-bottom: 2px solid #4338ca; padding-bottom: 10px;">Normalization Lab: Schritt-für-Schritt</h2>
        <p>Vergleiche, wie Daten innerhalb eines Batches oder innerhalb einer Schicht (Layer) normiert werden.</p>
    </header>

    <main style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <article>
            <fieldset style="border: 1px solid #ccc; border-radius: 8px; padding: 15px;">
                <legend><strong>1. Input Daten (3 Beispiele, 2 Features)</strong></legend>
                <div id="input-plot" style="height: 200px;"></div>
                <table id="input-table" style="width: 100%; border-collapse: collapse; font-family: monospace; text-align: center;">
                    </table>
            </fieldset>

            <nav style="margin: 20px 0;">
                <button onclick="NormLab.process('batch')" style="padding: 10px 20px; cursor:pointer;">Berechne Batch Norm</button>
                <button onclick="NormLab.process('layer')" style="padding: 10px 20px; cursor:pointer;">Berechne Layer Norm</button>
            </nav>

            <section id="math-steps" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b;">Klicke auf einen Button, um den Rechenweg zu sehen.</p>
            </section>
        </article>

        <article>
            <fieldset style="border: 1px solid #4338ca; border-radius: 8px; padding: 15px;">
                <legend><strong id="output-title">2. Output (Normalisiert)</strong></legend>
                <div id="output-plot" style="height: 200px;"></div>
                <div id="output-formula" style="padding: 10px; text-align: center;"></div>
                <table id="output-table" style="width: 100%; border-collapse: collapse; font-family: monospace; text-align: center;">
                    </table>
            </fieldset>
        </article>
    </main>
</section>
