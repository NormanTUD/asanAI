/**
 * Live Training Network Visualizer
 * Shows the actual structure, data flow, and learning dynamics of a TF.js model.
 * @param {tf.LayersModel} _m - A TensorFlow.js model
 * @param {HTMLElement|string|null} targetDiv - Div element, ID string, or null
 */
function visualizeModelOrganism(_m, targetDiv) {
  let container;
  if (typeof targetDiv === 'string') {
    container = document.getElementById(targetDiv);
    if (!container) container = document.body;
  } else if (targetDiv && targetDiv.appendChild) {
    container = targetDiv;
  } else {
    container = document.body;
  }
  container.innerHTML = '';

  // ─── Helpers ────────────────────────────────────────────────────
  function flatten(arr) {
    const result = [];
    const stack = [arr];
    while (stack.length) {
      const item = stack.pop();
      if (Array.isArray(item)) {
        for (let i = item.length - 1; i >= 0; i--) stack.push(item[i]);
      } else {
        result.push(item);
      }
    }
    return result;
  }

  function getShape(arr) {
    const shape = [];
    let current = arr;
    while (Array.isArray(current)) {
      shape.push(current.length);
      current = current[0];
    }
    return shape;
  }

  function describeLayer(layer, idx) {
    const type = layer.getClassName ? layer.getClassName() : 'Unknown';
    const config = layer.getConfig ? layer.getConfig() : {};
    const outputShape = layer.outputShape || [];

    let description = '';
    let role = '';
    let icon = '';

    switch (type.toLowerCase()) {
      case 'inputlayer':
        description = `Receives raw data`;
        role = 'DATA IN';
        icon = '→';
        break;
      case 'dense':
        const units = config.units || '?';
        const activation = config.activation || 'linear';
        description = `${units} neurons, ${activation}`;
        role = activation === 'softmax' ? 'DECISION' :
               activation === 'relu' ? 'TRANSFORM' :
               activation === 'sigmoid' ? 'GATE' : 'COMPUTE';
        icon = activation === 'relu' ? '⦿' :
               activation === 'softmax' ? '◎' :
               activation === 'sigmoid' ? '◐' : '○';
        break;
      case 'conv2d':
      case 'conv1d':
        const filters = config.filters || '?';
        const kernelSize = config.kernelSize || '?';
        description = `${filters} filters, ${kernelSize} kernel`;
        role = 'DETECT FEATURES';
        icon = '▣';
        break;
      case 'maxpooling2d':
      case 'maxpooling1d':
      case 'averagepooling2d':
        description = `Compress spatial info`;
        role = 'COMPRESS';
        icon = '▽';
        break;
      case 'flatten':
        description = `Reshape to 1D`;
        role = 'RESHAPE';
        icon = '═';
        break;
      case 'dropout':
        const rate = config.rate || 0;
        description = `Drop ${(rate * 100).toFixed(0)}% randomly`;
        role = 'REGULARIZE';
        icon = '✕';
        break;
      case 'batchnormalization':
        description = `Normalize activations`;
        role = 'STABILIZE';
        icon = '≈';
        break;
      case 'lstm':
      case 'gru':
        const rUnits = config.units || '?';
        description = `${rUnits} memory cells`;
        role = 'REMEMBER';
        icon = '↻';
        break;
      default:
        description = type;
        role = 'PROCESS';
        icon = '◇';
    }

    return { type, description, role, icon, outputShape, config };
  }

  // ─── Extract all layer info and weights ─────────────────────────
  const layers = [];
  for (let li = 0; li < _m.layers.length; li++) {
    const layer = _m.layers[li];
    const info = describeLayer(layer, li);
    let weightData = null;
    let biasData = null;

    let layerWeights;
    try { layerWeights = layer.getWeights(); } catch (e) { layerWeights = []; }

    if (layerWeights && layerWeights.length > 0) {
      try {
        const w = layerWeights[0].arraySync();
        const flat = Array.isArray(w) ? flatten(w) : [w];
        const shape = Array.isArray(w) ? getShape(w) : [1];
        weightData = { flat, shape };
      } catch (e) {}

      if (layerWeights.length > 1) {
        try {
          const b = layerWeights[1].arraySync();
          const flat = Array.isArray(b) ? flatten(b) : [b];
          biasData = { flat };
        } catch (e) {}
      }
    }

    layers.push({
      index: li,
      name: layer.name || `layer_${li}`,
      ...info,
      weightData,
      biasData
    });
  }

  const numLayers = layers.length;
  if (numLayers === 0) {
    container.innerHTML = '<p style="color:#888;font-family:monospace;">No layers found.</p>';
    return null;
  }

  // ─── Canvas Setup ──────────────────────────────────────────────
  const canvasW = 1000;
  const canvasH = 650;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';
  canvas.style.borderRadius = '6px';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // ─── Background ────────────────────────────────────────────────
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Subtle grid
  ctx.strokeStyle = 'rgba(40, 40, 80, 0.3)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < canvasW; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
  }
  for (let y = 0; y < canvasH; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
  }

  // ─── Layout ────────────────────────────────────────────────────
  const marginL = 60;
  const marginR = 40;
  const headerH = 50;
  const footerH = 100;
  const graphW = canvasW - marginL - marginR;
  const graphH = canvasH - headerH - footerH;
  const graphTop = headerH;

  const colW = graphW / numLayers;

  // ─── Title ─────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('LIVE MODEL STRUCTURE', marginL, 20);

  ctx.fillStyle = '#556677';
  ctx.font = '11px monospace';
  const totalParams = layers.reduce((s, l) => {
    let p = 0;
    if (l.weightData) p += l.weightData.flat.length;
    if (l.biasData) p += l.biasData.flat.length;
    return s + p;
  }, 0);
  ctx.fillText(`${numLayers} layers | ${totalParams.toLocaleString()} trainable parameters | data flows left → right`, marginL, 38);

  // ─── Flow arrow along bottom ───────────────────────────────────
  const arrowY = headerH + graphH + 15;
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginL, arrowY);
  ctx.lineTo(marginL + graphW - 10, arrowY);
  ctx.stroke();
  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(marginL + graphW - 10, arrowY);
  ctx.lineTo(marginL + graphW - 18, arrowY - 5);
  ctx.lineTo(marginL + graphW - 18, arrowY + 5);
  ctx.closePath();
  ctx.fillStyle = '#334455';
  ctx.fill();

  ctx.fillStyle = '#44aa77';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('INPUT DATA', marginL, arrowY + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff8855';
  ctx.fillText('PREDICTION', marginL + graphW, arrowY + 16);

  // ─── Draw each layer ───────────────────────────────────────────
  const layerPositions = []; // store x positions for connection drawing

  for (let idx = 0; idx < numLayers; idx++) {
    const layer = layers[idx];
    const x = marginL + idx * colW + colW / 2;
    const centerY = graphTop + graphH / 2;
    layerPositions.push({ x, centerY });

    // Determine visual height based on output shape
    const outShape = layer.outputShape;
    let numNeurons = 1;
    if (Array.isArray(outShape)) {
      const flat = outShape.flat ? outShape.flat() : outShape;
      for (const s of flat) {
        if (typeof s === 'number' && s > 0) numNeurons *= s;
      }
    }
    numNeurons = Math.min(numNeurons, 200);
    const displayNodes = Math.min(Math.max(3, Math.ceil(Math.sqrt(numNeurons))), 16);

    // Layer column background
    const colLeft = marginL + idx * colW + 4;
    const colRight = colLeft + colW - 8;
    ctx.fillStyle = 'rgba(15, 15, 30, 0.6)';
    ctx.fillRect(colLeft, graphTop, colW - 8, graphH);

    // ─── Role badge at top ──────────────────────────────────────
    const badgeColors = {
      'DATA IN': '#44aa77',
      'TRANSFORM': '#5588dd',
      'DECISION': '#ff8855',
      'GATE': '#ddaa44',
      'DETECT FEATURES': '#aa66dd',
      'COMPRESS': '#66aaaa',
      'RESHAPE': '#888899',
      'REGULARIZE': '#cc6666',
      'STABILIZE': '#66bb88',
      'REMEMBER': '#dd77aa',
      'COMPUTE': '#7799bb',
      'PROCESS': '#7799bb'
    };
    const badgeColor = badgeColors[layer.role] || '#667788';

    ctx.fillStyle = badgeColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    const badgeW = ctx.measureText(layer.role).width + 10;
    const badgeX = x - badgeW / 2;
    const badgeY = graphTop + 5;

    // Badge background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(badgeX, badgeY, badgeW, 14);
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, 14);
    ctx.fillStyle = badgeColor;
    ctx.fillText(layer.role, x, badgeY + 10);

    // ─── Layer type + description ────────────────────────────────
    ctx.fillStyle = '#ccccee';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(layer.type, x, badgeY + 28);

    ctx.fillStyle = '#667788';
    ctx.font = '9px monospace';
    ctx.fillText(layer.description, x, badgeY + 40);

    // ─── Draw neurons/nodes ──────────────────────────────────────
    const nodeAreaTop = graphTop + 60;
    const nodeAreaH = graphH - 130;
    const nodeSpacing = nodeAreaH / (displayNodes + 1);

    for (let n = 0; n < displayNodes; n++) {
      const ny = nodeAreaTop + (n + 1) * nodeSpacing;
      const nodeR = 6;

      // If we have weight data, color the node by its average weight
      let nodeColor = '#445566';
      let nodeGlow = 'rgba(60, 80, 120, 0.3)';

      if (layer.weightData && layer.weightData.flat.length > 0) {
        const flat = layer.weightData.flat;
        const chunkSize = Math.max(1, Math.floor(flat.length / displayNodes));
        const start = n * chunkSize;
        const end = Math.min(start + chunkSize, flat.length);
        let sum = 0, sumAbs = 0;
        for (let i = start; i < end; i++) {
          sum += flat[i];
          sumAbs += Math.abs(flat[i]);
        }
        const avg = sum / (end - start || 1);
        const avgAbs = sumAbs / (end - start || 1);

        // Color by sign and magnitude
        if (avg > 0) {
          const t = Math.min(1, avgAbs * 3);
          nodeColor = `rgb(${Math.floor(180 + t * 75)}, ${Math.floor(100 + t * 50)}, ${Math.floor(30)})`;
          nodeGlow = `rgba(255, 150, 40, ${t * 0.4})`;
        } else {
          const t = Math.min(1, avgAbs * 3);
          nodeColor = `rgb(${Math.floor(30)}, ${Math.floor(100 + t * 80)}, ${Math.floor(180 + t * 75)})`;
          nodeGlow = `rgba(60, 150, 255, ${t * 0.4})`;
        }
      }

      // Glow
      ctx.beginPath();
      ctx.arc(x, ny, nodeR + 4, 0, 2 * Math.PI);
      ctx.fillStyle = nodeGlow;
      ctx.fill();

      // Node body
      ctx.beginPath();
      ctx.arc(x, ny, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // "..." if more neurons than displayed
    if (numNeurons > displayNodes) {
      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⋮ ${numNeurons} total`, x, nodeAreaTop + nodeAreaH + 5);
    }

    // ─── Weight distribution mini-chart ──────────────────────────
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const chartY = graphTop + graphH - 55;
      const chartW2 = colW - 20;
      const chartH2 = 35;
      const chartX = x - chartW2 / 2;

      // Mini histogram
      const numBins = 20;
      const bins = new Array(numBins).fill(0);
      let mn = Infinity, mx = -Infinity;
      for (const v of flat) { if (v < mn) mn = v; if (v > mx) mx = v; }
      const range = mx - mn || 1;
      for (const v of flat) {
        const bin = Math.min(numBins - 1, Math.max(0, Math.floor(((v - mn) / range) * numBins)));
        bins[bin]++;
      }
      const maxBin = Math.max(...bins);

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(chartX, chartY, chartW2, chartH2);

      // Bars
      const barW = chartW2 / numBins;
      for (let i = 0; i < numBins; i++) {
        const barH = (bins[i] / maxBin) * (chartH2 - 4);
        const t = i / numBins; // 0 = negative side, 1 = positive side
        let r, g, b;
        if (t < 0.5) {
          r = 40; g = Math.floor(100 + t * 200); b = Math.floor(200 + t * 100);
        } else {
          const t2 = (t - 0.5) * 2;
          r = Math.floor(150 + t2 * 105); g = Math.floor(100 + t2 * 50); b = 40;
        }
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.fillRect(chartX + i * barW, chartY + chartH2 - barH - 2, barW - 1, barH);
      }

      // Zero line in histogram
      const zeroPos = (0 - mn) / range;
      const zeroX = chartX + zeroPos * chartW2;
      if (zeroPos > 0 && zeroPos < 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(zeroX, chartY);
        ctx.lineTo(zeroX, chartY + chartH2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Stats
      const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
      const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
      ctx.fillStyle = '#778899';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`μ=${mean.toFixed(3)} σ=${std.toFixed(3)}`, x, chartY + chartH2 + 9);
    }
  }

  // ─── Draw connections between layers ───────────────────────────
  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];
    const posA = layerPositions[idx];
    const posB = layerPositions[idx + 1];

    const nodeAreaTop = graphTop + 60;
    const nodeAreaH = graphH - 130;

    const outShapeA = layerA.outputShape;
    let numA = 1;
    if (Array.isArray(outShapeA)) {
      const flatS = outShapeA.flat ? outShapeA.flat() : outShapeA;
      for (const s of flatS) { if (typeof s === 'number' && s > 0) numA *= s; }
    }
    numA = Math.min(numA, 200);
    const displayA = Math.min(Math.max(3, Math.ceil(Math.sqrt(numA))), 16);

    const outShapeB = layerB.outputShape;
    let numB = 1;
    if (Array.isArray(outShapeB)) {
      const flatS = outShapeB.flat ? outShapeB.flat() : outShapeB;
      for (const s of flatS) { if (typeof s === 'number' && s > 0) numB *= s; }
    }
    numB = Math.min(numB, 200);
    const displayB = Math.min(Math.max(3, Math.ceil(Math.sqrt(numB))), 16);

    const spacingA = nodeAreaH / (displayA + 1);
    const spacingB = nodeAreaH / (displayB + 1);

    // Get weight data for connections
    let weightFlat = null;
    let absMax = 1;
    if (layerB.weightData) {
      weightFlat = layerB.weightData.flat;
      absMax = Math.max(...weightFlat.map(Math.abs)) || 1;
    }

    // Draw subset of connections
    const maxConns = 40;
    let drawn = 0;

    for (let a = 0; a < displayA && drawn < maxConns; a++) {
      for (let b = 0; b < displayB && drawn < maxConns; b++) {
        const y1 = nodeAreaTop + (a + 1) * spacingA;
        const y2 = nodeAreaTop + (b + 1) * spacingB;

        let strength = 0.2;
        let val = 0;

        if (weightFlat) {
          const wIdx = (a * displayB + b) % weightFlat.length;
          val = weightFlat[wIdx];
          strength = Math.abs(val) / absMax;
        }

        if (strength < 0.15) continue; // skip weak connections

        const x1 = posA.x + 8;
        const x2 = posB.x - 8;
        const cpx = (x1 + x2) / 2;

        let color;
        if (val >= 0) {
          color = `rgba(255, 160, 50, ${0.05 + strength * 0.35})`;
        } else {
          color = `rgba(70, 150, 255, ${0.05 + strength * 0.35})`;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.3 + strength * 2;
        ctx.stroke();

        drawn++;
      }
    }
  }

  // ─── Training insight panel (bottom) ───────────────────────────
  const panelY = canvasH - footerH + 30;
  ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
  ctx.fillRect(marginL - 10, panelY - 5, graphW + 20, footerH - 25);
  ctx.strokeStyle = '#222244';
  ctx.lineWidth = 1;
  ctx.strokeRect(marginL - 10, panelY - 5, graphW + 20, footerH - 25);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('WHAT TRAINING DOES:', marginL, panelY + 10);

  ctx.fillStyle = '#99aabb';
  ctx.font = '9px monospace';

  // Compute training health indicators
  let hasDeadLayers = false;
  let hasExploding = false;
  let healthNotes = [];

  for (const layer of layers) {
    if (!layer.weightData) continue;
    const flat = layer.weightData.flat;
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
    const nearZero = flat.filter(v => Math.abs(v) < 0.001).length / flat.length;

    if (nearZero > 0.8) {
      hasDeadLayers = true;
      healthNotes.push(`⚠ ${layer.name}: ${(nearZero * 100).toFixed(0)}% weights near zero — may be dying`);
    }
    if (std > 2.0) {
      hasExploding = true;
      healthNotes.push(`⚠ ${layer.name}: std=${std.toFixed(2)} — weights may be exploding`);
    }
  }

  const explanations = [
    'Each iteration: data enters left → flows through layers → prediction exits right → error computed → weights adjusted backward',
    'Orange connections = excitatory (amplify signal) | Blue connections = inhibitory (suppress signal)',
    'Mini histograms show weight distribution per layer — should be centered near zero, bell-shaped after good training',
  ];

  let textY = panelY + 24;
  for (const line of explanations) {
    ctx.fillStyle = '#778899';
    ctx.fillText(line, marginL, textY);
    textY += 13;
  }

  // Health warnings
  if (healthNotes.length > 0) {
    textY += 4;
    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('TRAINING HEALTH:', marginL, textY);
    textY += 13;
    ctx.font = '9px monospace';
    for (const note of healthNotes.slice(0, 3)) {
      ctx.fillStyle = '#dd8833';
      ctx.fillText(note, marginL + 10, textY);
      textY += 12;
    }
  } else {
    textY += 4;
    ctx.fillStyle = '#44bb77';
    ctx.font = '9px monospace';
    ctx.fillText('✓ All layers look healthy — weights are well-distributed', marginL, textY);
  }

  // ─── Color legend (top right) ──────────────────────────────────
  const legX = canvasW - 200;
  const legY2 = 8;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(legX - 8, legY2, 195, 85);
  ctx.strokeStyle = '#222244';
  ctx.strokeRect(legX - 8, legY2, 195, 85);

  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('NODE COLORS:', legX, legY2 + 12);

  ctx.fillStyle = '#ff9933';
  ctx.beginPath(); ctx.arc(legX + 6, legY2 + 25, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#aabbcc';
  ctx.font = '9px monospace';
  ctx.fillText('positive avg weight (excites)', legX + 16, legY2 + 28);

  ctx.fillStyle = '#3399ff';
  ctx.beginPath(); ctx.arc(legX + 6, legY2 + 40, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#aabbcc';
  ctx.fillText('negative avg weight (inhibits)', legX + 16, legY2 + 43);

  ctx.fillStyle = '#445566';
  ctx.beginPath(); ctx.arc(legX + 6, legY2 + 55, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#aabbcc';
  ctx.fillText('no weights (pass-through)', legX + 16, legY2 + 58);

  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('CONNECTIONS:', legX, legY2 + 73);
  ctx.font = '9px monospace';
  ctx.fillText('thicker = stronger influence', legX, legY2 + 84);

  return canvas;
}
