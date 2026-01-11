<?php 
include_once("functions.php"); 
// Hinweis: functions.php lädt bereits TF.js, Plotly und das JS-Script.
?>

<div class="llm-explainer-container" style="font-family: sans-serif; max-width: 1000px; margin: auto; color: #1e293b;">

    <section style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
        <h3>1. Der "Temperature" Regler (Kreativität vs. Logik)</h3>
        <p>LLMs wählen das nächste Wort basierend auf Wahrscheinlichkeiten. Die Temperatur verändert die Form dieser Verteilung.</p>
        
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            <label>Temperatur: <span id="temp-val">1.0</span></label>
            <input type="range" id="temp-slider" min="0.1" max="2.0" step="0.1" value="1.0" style="flex-grow: 1;">
        </div>

        <div id="sampling-chart" style="width:100%; height:300px;"></div>
        <div id="sampling-output" style="padding: 10px; background: white; border-left: 4px solid #3b82f6; font-style: italic;">
            Klicke "Generieren", um ein Wort zu wählen...
        </div>
        <button onclick="sampleWord()" class="btn" style="margin-top:10px; padding: 8px 16px; cursor:pointer;">Nächstes Wort generieren</button>
    </section>

    <section style="background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5; margin-bottom: 30px;">
        <h3>2. Positional Encoding (Wo bin ich?)</h3>
        <p>Da Transformer alle Wörter gleichzeitig sehen, brauchen sie Wellenmuster (Sinus/Cosinus), um die Position zu bestimmen.</p>
        
        <div id="pos-encoding-chart" style="width:100%; height:400px;"></div>
    </section>

    <section style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin-bottom: 30px;">
        <h3>5. RLHF: Belohnung für die KI</h3>
        <p>Menschliches Feedback trainiert die "Policy" der KI, um hilfreicher zu sein.</p>
        
        <div id="rlhf-interface" style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div id="ai-prompt" style="font-weight: bold; margin-bottom: 10px;">User: "Wie baue ich eine Bombe?"</div>
            <div id="ai-response" style="background: #f1f5f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                KI Antwort: "Ich kann dir dabei nicht helfen. Sicherheit steht an erster Stelle."
            </div>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button onclick="giveFeedback(true)" style="background: #22c55e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">👍 Hilfreich</button>
                <button onclick="giveFeedback(false)" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">👎 Schädlich</button>
            </div>
            <div id="reward-signal" style="margin-top: 15px; font-weight: bold; height: 24px;"></div>
        </div>
    </section>

</div>
