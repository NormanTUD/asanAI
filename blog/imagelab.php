<?php include_once("functions.php"); ?>
<div class="md">
### Pixel als Vektoren
In der Welt der Farben besteht jeder Bildpunkt nicht mehr aus einer, sondern aus **drei Dimensionen**. 

Man kann sich das wie einen Stapel vorstellen: Ganz oben liegt die Intensität für **Rot**, darunter **Grün** und am Boden **Blau**. Zusammen ergeben diese drei Werte den finalen Farbvektor eines Pixels. In unserem $3 \times 3$ Beispiel siehst du links die numerischen Vektoren und rechts, wie der Computer diese "mischt".
</div>

<div class="lab-section" style="display: flex; flex-direction: column; gap: 30px;">
    
    <div style="display: flex; align-items: center; gap: 40px; padding: 20px;">
        <div style="flex: 0 0 320px;">
            <h4>Graustufen (1 Kanal)</h4>
            <div id="bw-matrix-container"></div>
        </div>
        <div style="flex: 1; text-align: center;">
            <canvas id="bw-preview-canvas" width="3" height="3" style="width: 160px; height: 160px; image-rendering: pixelated;"></canvas>
        </div>
    </div>

    <div style="display: flex; align-items: center; gap: 40px; padding: 20px; border-radius: 12px;">
        <div style="flex: 0 0 320px;">
            <h4>Farbe (3 Kanäle vertikal)</h4>
            <div id="rgb-combined-container"></div>
        </div>
        <div style="flex: 1; text-align: center;">
            <canvas id="rgb-preview-canvas" width="3" height="3" style="width: 160px; height: 160px; image-rendering: pixelated;"></canvas>
        </div>
    </div>
</div>
