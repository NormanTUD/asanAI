"use strict";

function copy_id_to_clipboard(idname) {
	var serialized = $("#" + idname).text();
	copy_to_clipboard(serialized);

	show_clipboard_feedback();
}

function copy_to_clipboard(text) {
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = text;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

function show_clipboard_feedback() {
	var feedback = $('<div>📋</div>');
	feedback.css({
		position: 'fixed',
		top: last_mouse_y + 'px',
		left: last_mouse_x + 'px',
		transform: 'translate(-50%, -50%)',
		fontSize: '1.5em',
		opacity: 0,
		zIndex: 9999,
		pointerEvents: 'none',
		transition: 'opacity 0.2s ease-in-out, transform 0.3s ease-out'
	});
	$('body').append(feedback);
	setTimeout(() => feedback.css('opacity', 1), 0);
	setTimeout(() => feedback.css('opacity', 0), 300);
	setTimeout(() => feedback.remove(), 600);
}

function save_file (name, type, data) {
	if (data !== null && navigator.msSaveBlob) {
		return navigator.msSaveBlob(new Blob([data], { type: type }), name);
	}

	var a = $("<a style='display: none;'/>");
	var url = window.URL.createObjectURL(new Blob([data], {type: type}));
	a.attr("href", url);
	a.attr("download", name);
	$("body").append(a);
	a[0].click();
	window.URL.revokeObjectURL(url);
	a.remove();
}

async function download_model_and_weights_and_labels () {
	await wait_for_updated_page(3);
	await save_model();
	await download_labels_json();
	await download_weights_json();
	if($("#data_origin").val() == "image") {
		await create_and_download_zip();
	}
}

function downloadNetworkZip(blob) {
	try {
		var url = URL.createObjectURL(blob);
		var link = document.createElement("a");
		link.href = url;
		link.download = "network.zip";
		link.textContent = "Download zip file";

		link.click();

		URL.revokeObjectURL(url);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

function dataURLToBlob(dataURL) {
	try {
		var parts = dataURL?.split(";base64,");

		if(!parts) {
			err(`dataURLToBlob: dataURL was none or undefined`);
			return;
		}

		var contentType = parts[0].split(":")[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;
		var uInt8Array = new Uint8Array(rawLength);

		for (var rawLength_idx = 0; rawLength_idx < rawLength; ++rawLength_idx) {
			uInt8Array[rawLength_idx] = raw.charCodeAt(rawLength_idx);
		}

		return new Blob([uInt8Array], { type: contentType });
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		assert(false, e);
	}
}

async function saveModelAsSingleZip() {
	const modelArtifacts = await model.save({
		async save(artifacts) {
			try {
				const modelJson = {
					modelTopology: artifacts.modelTopology,
					format: artifacts.format,
					generatedBy: artifacts.generatedBy,
					convertedBy: artifacts.convertedBy || null,
					weightsManifest: [{
						paths: ["model.weights.bin"],
						weights: artifacts.weightSpecs
					}]
				};

				const files = [
					{
						name: "model.json",
						data: new TextEncoder().encode(JSON.stringify(modelJson, null, 2)),
					},
					{
						name: "model.weights.bin",
						data: new Uint8Array(artifacts.weightData),
					}
				];

				const zipBlob = createSimpleZip(files);
				const url = URL.createObjectURL(zipBlob);

				const a = document.createElement("a");
				a.href = url;
				a.download = "model.zip";
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);

				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
						modelTopologyBytes: files[0].data.length,
						weightDataBytes: files[1].data.length
					}
				};
			} catch (_err) {
				err("Error at saving:", _err);
				throw _err;
			}
		}
	});
}

function createSimpleZip(files) {
	const chunks = [];
	const centralDirectory = [];
	let offset = 0;

	for (let files_idx = 0; files_idx < files.length; files_idx++) {
		const file = files[files_idx];
		const fileNameBytes = new TextEncoder().encode(file.name);
		const data = file.data;
		const crc32 = computeCRC32(data);

		const localHeader = new Uint8Array(30 + fileNameBytes.length);
		localHeader.set([0x50, 0x4B, 0x03, 0x04], 0);           // Local file header signature
		localHeader.set([0x14, 0x00], 4);                       // Version needed to extract
		localHeader.set([0x00, 0x00], 6);                       // General purpose bit flag
		localHeader.set([0x00, 0x00], 8);                       // Compression method: 0 = store
		localHeader.set([0x00, 0x00, 0x00, 0x00], 10);          // File time/date (optional)
		localHeader.set(uint32le(crc32), 14);                   // CRC-32
		localHeader.set(uint32le(data.length), 18);             // Compressed size
		localHeader.set(uint32le(data.length), 22);             // Uncompressed size
		localHeader.set(uint16le(fileNameBytes.length), 26);    // File name length
		localHeader.set([0x00, 0x00], 28);                      // Extra field length
		localHeader.set(fileNameBytes, 30);                     // File name

		chunks.push(localHeader, data);

		const centralHeader = new Uint8Array(46 + fileNameBytes.length);
		centralHeader.set([0x50, 0x4B, 0x01, 0x02], 0);         // Central dir signature
		centralHeader.set([0x14, 0x00, 0x14, 0x00], 4);         // Version made by / needed
		centralHeader.set([0x00, 0x00], 8);                     // General purpose bit flag
		centralHeader.set([0x00, 0x00], 10);                    // Compression
		centralHeader.set([0x00, 0x00, 0x00, 0x00], 12);        // File time/date
		centralHeader.set(uint32le(crc32), 16);                 // CRC
		centralHeader.set(uint32le(data.length), 20);           // Compressed size
		centralHeader.set(uint32le(data.length), 24);           // Uncompressed size
		centralHeader.set(uint16le(fileNameBytes.length), 28);  // File name length
		centralHeader.set([0x00, 0x00], 30);                    // Extra field length
		centralHeader.set([0x00, 0x00], 32);                    // File comment length
		centralHeader.set([0x00, 0x00], 34);                    // Disk number start
		centralHeader.set([0x00, 0x00], 36);                    // Internal file attributes
		centralHeader.set([0x00, 0x00, 0x00, 0x00], 38);        // External file attributes
		centralHeader.set(uint32le(offset), 42);                // Offset of local header
		centralHeader.set(fileNameBytes, 46);                   // File name

		offset += localHeader.length + data.length;
		centralDirectory.push(centralHeader);
	}

	const centralDirStart = offset;
	for (let cd_idx = 0; cd_idx < centralDirectory.length; cd_idx++) {
		chunks.push(centralDirectory[cd_idx]);
		offset += centralDirectory[cd_idx].length;
	}

	const endRecord = new Uint8Array(22);
	endRecord.set([0x50, 0x4B, 0x05, 0x06], 0);               // EOCD signature
	endRecord.set([0x00, 0x00], 4);                           // Disk number
	endRecord.set([0x00, 0x00], 6);                           // Disk where central dir starts
	endRecord.set(uint16le(files.length), 8);                // Number of entries on disk
	endRecord.set(uint16le(files.length), 10);               // Total number of entries
	endRecord.set(uint32le(offset - centralDirStart), 12);   // Size of central directory
	endRecord.set(uint32le(centralDirStart), 16);            // Offset of start of central dir
	endRecord.set([0x00, 0x00], 20);                          // Comment length

	chunks.push(endRecord);

	return new Blob(chunks, { type: "application/zip" });
}

function uint16le(n) {
    return [n & 0xff, (n >> 8) & 0xff];
}

function uint32le(n) {
    return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

function computeCRC32(data) {
	let crc = 0xffffffff;
	for (let idx = 0; idx < data.length; idx++) {
		crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[idx]) & 0xff];
	}
	return (crc ^ 0xffffffff) >>> 0;
}

var CRC32_TABLE = (function () {
	const table = new Uint32Array(256);
	for (let idx = 0; idx < 256; idx++) {
		let c = idx;
		for (let j = 0; j < 8; j++) {
			c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		}
		table[idx] = c >>> 0;
	}
	return table;
})();
