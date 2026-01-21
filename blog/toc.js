function toc () {
	var toc = "";
	var level = 0;

	var s = document.createElement("style");
	s.textContent = `
		#toc {
		    font-family: system-ui, sans-serif;
		    background: #fafafa;
		    padding: 14px 18px;
		    border: 1px solid #ddd;
		    border-radius: 8px;
		    margin: 20px 0;
		    line-height: 1.4;
		    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
		}
		/* New GUI Table Styling */
		[id$="_layer_gui"] {
			width: 100%;
			max-width: 500px;
			border-collapse: collapse;
			margin: 15px 0;
			font-family: system-ui, sans-serif;
			font-size: 14px;
			background: #fff;
			border: 1px solid #eee;
			border-radius: 4px;
		}
		[id$="_layer_gui"] td {
			padding: 8px 12px;
			border-bottom: 1px solid #f0f0f0;
		}
		[id$="_layer_gui"] td:first-child {
			font-weight: 600;
			color: #555;
			width: 40%;
			background: #fdfdfd;
		}
		[id$="_layer_gui"] input, [id$="_layer_gui"] select {
			width: 100%;
			padding: 4px 6px;
			border: 1px solid #ccc;
			border-radius: 4px;
			box-sizing: border-box;
		}
		[id$="_layer_gui"] input[type="checkbox"] {
			width: auto;
		}
		.error_msg {
			color: white;
			font-family: monospace;
			font-size: 12px;
			margin: 5px 0;
		}
		/* Rest of original styles... */
		#toc ul { list-style: none; padding-left: 10px; margin: 6px 0; border-left: 2px solid #ccc; }
		#toc li { margin: 5px 0; padding-left: 4px; transition: all 0.15s ease-in-out; }
		#toc li::before { content: "- "; color: #888; font-size: 0.8em; position: relative; top: -1px; }
		#toc a { text-decoration: none; color: #0044aa; font-size: 0.94em; }
		#toc a:hover { color: #cc3300; text-decoration: underline; }
		#toc li:hover { transform: translateX(3px); }
	`;
	document.head.appendChild(s);

	document.getElementById("contents").innerHTML =
		document.getElementById("contents").innerHTML.replace(
			/<h([\d])>([^<]+)<\/h\1>/gi,
			function (str, openLevel, titleText) {
				openLevel = (function parse_int(x){return parseInt(x);})(openLevel);
				if (openLevel > level) {
					toc += new Array(openLevel - level + 1).join("<ul>");
				} else if (openLevel < level) {
					toc += new Array(level - openLevel + 1).join("</ul>");
				}
				level = openLevel;
				var anchor = titleText.replace(/\s+/g, "_");
				toc += "<li><a href='#" + anchor + "'>" + titleText + "</a></li>";
				return "<h" + openLevel + "><a name='" + anchor + "'>" +
					titleText + "</a></h" + openLevel + ">";
			}
		);

	if (level) toc += new Array(level + 1).join("</ul>");
	document.getElementById("toc").innerHTML += toc;
}
