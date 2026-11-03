(async function() {
    console.log("==========================================");
    console.log("[AsanAI Debug] ===== START: asanai_loader.js geladen =====");
    console.log("==========================================");

    const host = document.getElementById('asanai-shadow-host');
    if (!host) {
        console.error("[AsanAI Debug ERROR] Host-Element #asanai-shadow-host nicht gefunden!");
        return;
    }

    const shadow = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadow.appendChild(container);

    const statusMsg = document.createElement('div');
    statusMsg.style.fontFamily = 'monospace';
    statusMsg.style.padding = '10px';
    statusMsg.style.color = '#666';
    statusMsg.textContent = 'Lade AsanAI-Modul...';
    container.appendChild(statusMsg);

    const proxyBase = window.location.protocol + '//' + window.location.host + '/asanai_blog_proxy.php?';
    const proxyUrl = proxyBase + 'tenminutes/intuition.html';
    console.log("[AsanAI Debug] Proxy-URL:", proxyUrl);

    try {
        const response = await fetch(proxyUrl);
        console.log("[AsanAI Debug] fetch Status:", response.status);
        if (!response.ok) throw new Error('HTTP-Fehler: ' + response.status);
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        container.innerHTML = '';

        doc.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
            shadow.appendChild(node.cloneNode(true));
        });

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = doc.body ? doc.body.innerHTML : html;
        container.appendChild(contentDiv);

        container.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                let val = attr.value;
                if (attr.name === 'src' && !val.match(/^(?:https?:)?\/\/|data:|blob:/i)) {
                    val = proxyBase + 'tenminutes/' + val.replace(/^\//, '');
                }
                newScript.setAttribute(attr.name, val);
            });
            if (!oldScript.src) {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        console.log("[AsanAI Debug] ===== ERFOLGREICH GELADEN =====");

    } catch (err) {
        console.error("[AsanAI Debug ERROR]", err);
        container.innerHTML = '';
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.fontFamily = 'monospace';
        errorMsg.style.padding = '10px';
        errorMsg.textContent = 'Fehler beim Laden: ' + err.message;
        container.appendChild(errorMsg);
    }
})();
