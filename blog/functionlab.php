<?php include_once("functions.php"); ?>

<div class="md">
    ## 1. Die Basis: $f(x) = x$
    Jeder Schritt auf der X-Achse entspricht genau einem Schritt auf der Y-Achse.
</div>
<div id="plot-step-1" class="plot-container" style="height: 250px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 2. Interaktiv: Die Gerade ($ax + b$)
    In der KI passen wir Gewichte und Bias an, um Datenpunkte zu treffen.
</div>
<div style="margin-bottom: 10px;">
    Gewicht ($a$): <input type="range" id="slider-6-a" min="-5" max="5" step="0.1" value="1"> 
    Bias ($b$): <input type="range" id="slider-6-b" min="-10" max="10" step="1" value="0">
</div>
<div id="formula-6" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x) = 1x + 0$$</div>
<div id="plot-step-6" class="plot-container" style="height: 300px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 3. Die dritte Dimension: $f(x, y) = x + y$
    Zwei Eingaben spannen eine Fläche im Raum auf.
</div>
<div id="plot-step-4" class="plot-container" style="height: 350px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 4. Interaktiv: Die geneigte Ebene ($ax + by$)
    Hier bestimmen wir, wie stark jeder Input die Vorhersage beeinflusst.
</div>
<div style="margin-bottom: 10px;">
    Gewicht X ($a$): <input type="range" id="slider-7-a" min="-2" max="2" step="0.1" value="0.5"> 
    Gewicht Y ($b$): <input type="range" id="slider-7-b" min="-2" max="2" step="0.1" value="0.5">
</div>
<div id="formula-7" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 0.5x + 0.5y$$</div>
<div id="plot-step-7" class="plot-container" style="height: 400px; margin-bottom: 40px;"></div>

<hr>

<div class="md">
    ## 5. Interaktiv: Nicht-Linearität (Wellen)
    Komplexe Muster erfordern Kurven. Wir nutzen hier die Sinus-Funktion.
</div>
<div style="margin-bottom: 10px;">
    Frequenz: <input type="range" id="slider-5-freq" min="0.1" max="2.0" step="0.1" value="0.5"> 
    Amplitude: <input type="range" id="slider-5-amp" min="0.5" max="5.0" step="0.1" value="1.0">
</div>
<div id="formula-5" style="font-size: 1.2em; margin-bottom: 10px; min-height: 1.5em;">$$f(x, y) = 1.0 \cdot (\sin(0.5x) + \sin(0.5y))$$</div>
<div id="plot-step-5" class="plot-container" style="height: 450px; margin-bottom: 40px;"></div>
