// Wir nutzen ein Objekt, aber hängen es an window, um Redeclaration-Errors zu vermeiden
window.FeatureLab = {
    presets: {
        horizontal: [[-1,-1,-1],[2,2,2],[-1,-1,-1]],
        vertical: [[-1,2,-1],[-1,2,-1],[-1,2,-1]],
        sobel: [[-1,0,1],[-2,0,2],[-1,0,1]],
        blur: [[0.06,0.12,0.06],[0.12,0.25,0.12],[0.06,0.12,0.06]],
        sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]]
    },

    init: function() {
        const editor = document.getElementById('kernel-editor');
        if (!editor) return;
        
        editor.innerHTML = ""; // Clean start
        for(let i=0; i<9; i++) {
            const inp = document.createElement('input');
            inp.type = "number"; 
            inp.step = "0.1"; 
            inp.className = "k-val";
            inp.style = "width:100%; text-align:center; padding:5px; border:1px solid #ccc; border-radius:4px;";
            inp.oninput = () => this.run();
            editor.appendChild(inp);
        }

        // Erstes Preset laden
        this.loadPreset('horizontal');
        
        // Testbild laden
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "example.jpg"; // Stelle sicher, dass die Datei existiert
        img.onload = () => {
            const ctx = document.getElementById('feat-src').getContext('2d');
            ctx.drawImage(img, 0, 0, 50, 50);
            this.run();
        };
    },

    loadPreset: function(name) {
        const vals = document.querySelectorAll('.k-val');
        const data = this.presets[name].flat();
        vals.forEach((inp, i) => {
            if(inp) inp.value = data[i];
        });
        this.run();
    },

    run: async function() {
        const srcCanvas = document.getElementById('feat-src');
        const resCanvas = document.getElementById('feat-res');
        const kInputs = Array.from(document.querySelectorAll('.k-val')).map(i => parseFloat(i.value) || 0);
        
        if (kInputs.length < 9) return;

        // Kernel-Vorschau Text
        document.getElementById('kernel-viz').innerHTML = `
            ${kInputs[0].toFixed(1)} ${kInputs[1].toFixed(1)} ${kInputs[2].toFixed(1)}<br>
            ${kInputs[3].toFixed(1)} ${kInputs[4].toFixed(1)} ${kInputs[5].toFixed(1)}<br>
            ${kInputs[6].toFixed(1)} ${kInputs[7].toFixed(1)} ${kInputs[8].toFixed(1)}
        `;

        try {
            tf.tidy(() => {
                // Input vorbereiten (Graustufen, 1 Channel)
                const input = tf.browser.fromPixels(srcCanvas).mean(2).expandDims(-1).expandDims(0).toFloat();
                
                // Kernel vorbereiten [H, W, In, Out]
                const kernel = tf.tensor2d(kInputs, [3, 3]).expandDims(-1).expandDims(-1);
                
                // Convolution berechnen
                let conv = tf.conv2d(input, kernel, 1, 'same').squeeze();
                
                // Normalisierung für die Anzeige auf dem Canvas (0-1 Bereich)
                const min = conv.min();
                const max = conv.max();
                const normalized = conv.sub(min).div(max.sub(min).add(0.00001));
                
                tf.browser.toPixels(normalized, resCanvas);
            });
        } catch (e) {
            console.error("TFJS Error in FeatureLab:", e);
        }
    }
};

// Sicherer Start-Aufruf
if (document.readyState === 'complete') {
    FeatureLab.init();
} else {
    window.addEventListener('load', () => FeatureLab.init());
}
