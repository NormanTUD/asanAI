/**
 * Live Training Network Visualizer — Clean Edition v2
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

  function getPerUnitSummary(weightData) {
    if (!weightData) return null;
    const shape = weightData.shape;
    const flat = weightData.flat;
    const numUnits = shape[shape.length - 1] || 1;
    const perUnit = Math.floor(flat.length / numUnits);
    const summaries = [];
    for (let u = 0; u < numUnits; u++) {
      const start = u * perUnit;
      const end = Math.min(start + perUnit, flat.length);
      let sum = 0, sumAbs = 0;
      for (let i = start; i < end; i++) {
        sum += flat[i];
        sumAbs += Math.abs(flat[i]);
      }
      const count = end - start || 1;
      summaries.push({ mean: sum / count, meanAbs: sumAbs / count });
    }
    return summaries;
  }

  function describeLayer(layer) {
    const type = layer.getClassName ? layer.getClassName() : 'Unknown';
    const config = layer.getConfig ? layer.getConfig() : {};
    let shortDesc = '';
    let role = '';
    let nodeCount = 1;

    switch (type.toLowerCase()) {
      case 'inputlayer':
        const inputShape = config.batchInputShape || config.inputShape || [];
        shortDesc = `[${inputShape.filter(x => x !== null).join(',')}]`;
        role = 'INPUT';
        nodeCount = Math.min(inputShape.filter(x => x !== null).reduce((a, b) => a * b, 1) || 4, 64);
        break;
      case 'dense':
        const units = config.units || 1;
        const act = config.activation || 'linear';
        shortDesc = `${units} × ${act}`;
        role = act === 'softmax' ? 'OUTPUT' : act === 'sigmoid' ? 'GATE' : 'DENSE';
        nodeCount = units;
        break;
      case 'conv2d':
      case 'conv1d':
        const filters = config.filters || 1;
        const ks = config.kernelSize || [];
        shortDesc = `${filters}f ${Array.isArray(ks) ? ks.join('×') : ks}k`;
        role = 'CONV';
        nodeCount = filters;
        break;
      case 'maxpooling2d':
      case 'maxpooling1d':
      case 'averagepooling2d':
        shortDesc = 'shrink';
        role = 'POOL';
        nodeCount = 4;
        break;
      case 'flatten':
        shortDesc = '→ 1D';
        role = 'FLATTEN';
        nodeCount = 8;
        break;
      case 'dropout':
        shortDesc = `${((config.rate || 0) * 100).toFixed(0)}%`;
        role = 'DROP';
        nodeCount = 5;
        break;
      case 'batchnormalization':
        shortDesc = 'norm';
        role = 'NORM';
        nodeCount = 5;
        break;
      case 'lstm':
      case 'gru':
        shortDesc = `${config.units || '?'} cells`;
        role = type.toUpperCase();
        nodeCount = config.units || 4;
        break;
      default:
        shortDesc = type;
        role = type.substring(0, 5).toUpperCase();
        nodeCount = 4;
    }
    return { type, shortDesc, role, nodeCount };
  }

  // ─── Extract layers ─────────────────────────────────────────────
  const layers = [];
  for (let li = 0; li < _m.layers.length; li++) {
    const layer = _m.layers[li];
    const info = describeLayer(layer);
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
          biasData = { flat: Array.isArray(b) ? flatten(b) : [b] };
        } catch (e) {}
      }
    }

    layers.push({
      index: li,
      name: layer.name || `layer_${li}`,
      ...info,
      weightData,
      biasData,
      unitSummary: getPerUnitSummary(weightData)
    });
  }

  const numLayers = layers.length;
  if (numLayers === 0) {
    container.innerHTML = '<p style="color:#888;font-family:monospace;">No layers found.</p>';
    return null;
  }

  // ─── Canvas ────────────────────────────────────────────────────
  const canvasW = 1000;
  const canvasH = 560;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';
  canvas.style.borderRadius = '6px';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // ─── Background ────────────────────────────────────────────────
  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ─── Layout ────────────────────────────────────────────────────
  const marginL = 45;
  const marginR = 45;
  const headerH = 42;
  const footerH = 60;
  const graphW = canvasW - marginL - marginR;
  const graphTop = headerH;
  const graphH = canvasH - headerH - footerH;
  const colW = graphW / numLayers;

  // ─── Header ────────────────────────────────────────────────────
  ctx.fillStyle = '#dde0f0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Network Structure', marginL, 18);

  const totalParams = layers.reduce((s, l) => {
    let p = 0;
    if (l.weightData) p += l.weightData.flat.length;
    if (l.biasData) p += l.biasData.flat.length;
    return s + p;
  }, 0);
  ctx.fillStyle = '#556677';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(`${numLayers} layers · ${totalParams.toLocaleString()} parameters`, marginL, 34);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#445566';
  ctx.fillText('data flows left → right', canvasW - marginR, 34);

  // ─── Determine display node counts and positions ───────────────
  const maxDisplayNodes = 10;
  const nodeAreaTop = graphTop + 38;
  const nodeAreaH = graphH - 65;

  function getDisplayNodes(layer) {
    return Math.min(layer.nodeCount, maxDisplayNodes);
  }

  function getNodeY(nodeIdx, totalDisplay) {
    const spacing = nodeAreaH / (totalDisplay + 1);
    return nodeAreaTop + (nodeIdx + 1) * spacing;
  }

  // ─── Find the NEXT layer with weights (for drawing connections) ─
  // This ensures connections pass through weightless layers (Flatten, Pool, etc.)
  function findNextWeightedLayer(fromIdx) {
    for (let i = fromIdx + 1; i < numLayers; i++) {
      if (layers[i].weightData) return i;
    }
    return -1;
  }

  // ─── Draw connections ──────────────────────────────────────────
  // Strategy: draw connections between ALL adjacent layers,
  // using the receiving layer's weights if available,
  // or just thin pass-through lines if no weights.

  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];

    const xA = marginL + idx * colW + colW / 2;
    const xB = marginL + (idx + 1) * colW + colW / 2;

    const displayA = getDisplayNodes(layerA);
    const displayB = getDisplayNodes(layerB);

    if (layerB.unitSummary) {
      // Layer B has weights — draw weighted connections
      const summaries = layerB.unitSummary;

      // Normalize within THIS connection pair (not globally)
      // This prevents conv→conv from being super thick
      const localMax = Math.max(...summaries.map(s => s.meanAbs), 0.001);

      const maxConns = Math.min(displayA * displayB, 40);
      let drawn = 0;

      for (let a = 0; a < displayA && drawn < maxConns; a++) {
        for (let b = 0; b < displayB && drawn < maxConns; b++) {
          const sIdx = b % summaries.length;
          const u = summaries[sIdx];
          // Normalize relative to this layer's own max
          const strength = u.meanAbs / localMax;

          if (strength < 0.1) { drawn++; continue; }

          const y1 = getNodeY(a, displayA);
          const y2 = getNodeY(b, displayB);
          const cpx = (xA + xB) / 2;

          // Cap alpha and line width to prevent ugly thick lines
          const alpha = Math.min(0.25, 0.03 + strength * 0.15);
          const lw = Math.min(2, 0.3 + strength * 1.2);

          let color;
          if (u.mean >= 0) {
            color = `rgba(255, 170, 60, ${alpha})`;
          } else {
            color = `rgba(80, 160, 255, ${alpha})`;
          }

          ctx.beginPath();
          ctx.moveTo(xA + 6, y1);
          ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - 6, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.stroke();

          drawn++;
        }
      }
    } else {
      // No weights on layer B (Flatten, Pool, Dropout, etc.)
      // Draw thin pass-through lines to show data still flows
      const numLines = Math.min(displayA, displayB, 6);
      for (let i = 0; i < numLines; i++) {
        const aIdx = Math.floor((i / numLines) * displayA);
        const bIdx = Math.floor((i / numLines) * displayB);
        const y1 = getNodeY(aIdx, displayA);
        const y2 = getNodeY(bIdx, displayB);
        const cpx = (xA + xB) / 2;

        ctx.beginPath();
        ctx.moveTo(xA + 6, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - 6, y2);
        ctx.strokeStyle = 'rgba(100, 120, 150, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ─── Draw layers (nodes + labels) ──────────────────────────────
  const roleColors = {
    'INPUT': '#44bb88',
    'DENSE': '#6699dd',
    'OUTPUT': '#ff8855',
    'GATE': '#ddaa44',
    'CONV': '#aa77dd',
    'POOL': '#55aabb',
    'FLATTEN': '#778899',
    'DROP': '#aa6666',
    'NORM': '#66aa88',
    'LSTM': '#dd77aa',
    'GRU': '#dd77aa',
  };

  for (let idx = 0; idx < numLayers; idx++) {
    const layer = layers[idx];
    const x = marginL + idx * colW + colW / 2;
    const color = roleColors[layer.role] || '#6688aa';
    const displayNodes = getDisplayNodes(layer);

    // ─── Role + description at top ──────────────────────────────
    ctx.fillStyle = color;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.role, x, graphTop + 10);

    ctx.fillStyle = '#667788';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText(layer.shortDesc, x, graphTop + 22);

    // ─── Nodes ──────────────────────────────────────────────────
    // Compute local normalization for this layer's unit summaries
    let localAbsMax = 0.001;
    if (layer.unitSummary) {
      for (const u of layer.unitSummary) {
        if (u.meanAbs > localAbsMax) localAbsMax = u.meanAbs;
      }
    }

    for (let n = 0; n < displayNodes; n++) {
      const ny = getNodeY(n, displayNodes);
      let nodeR = 4.5;
      let nodeColor = color;
      let glowAlpha = 0.08;

      if (layer.unitSummary) {
        const uIdx = n % layer.unitSummary.length;
        const u = layer.unitSummary[uIdx];
        const strength = u.meanAbs / localAbsMax;
        nodeR = 3.5 + strength * 3.5;
        glowAlpha = 0.05 + strength * 0.15;

        if (u.mean > 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(200 + t * 55)}, ${Math.floor(140 + t * 30)}, ${Math.floor(40)})`;
        } else {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(40)}, ${Math.floor(130 + t * 50)}, ${Math.floor(200 + t * 55)})`;
        }
      }

      // Glow
      ctx.beginPath();
      ctx.arc(x, ny, nodeR + 3, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(150, 150, 200, ${glowAlpha})`;
      ctx.fill();

      // Node
      ctx.beginPath();
      ctx.arc(x, ny, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    }

    // Overflow indicator
    if (layer.nodeCount > maxDisplayNodes) {
      const overflowY = getNodeY(displayNodes, displayNodes) + 8;
      ctx.fillStyle = '#556677';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${layer.nodeCount - maxDisplayNodes}`, x, overflowY);
    }

    // ─── Mini distribution bar ──────────────────────────────────
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const barY = graphTop + graphH - 20;
      const barW = Math.min(colW - 12, 50);
      const barH = 6;
      const barX = x - barW / 2;

      const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
      const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
      let neg = 0, zero = 0, pos = 0;
      const threshold = std * 0.2;
      for (const v of flat) {
        if (v < -threshold) neg++;
        else if (v > threshold) pos++;
        else zero++;
      }
      const total = flat.length;

      const negW = (neg / total) * barW;
      const zeroW = (zero / total) * barW;
      const posW = (pos / total) * barW;

      ctx.fillStyle = 'rgba(80, 160, 255, 0.7)';
      ctx.fillRect(barX, barY, negW, barH);
      ctx.fillStyle = 'rgba(70, 70, 90, 0.5)';
      ctx.fillRect(barX + negW, barY, zeroW, barH);
      ctx.fillStyle = 'rgba(255, 170, 60, 0.7)';
      ctx.fillRect(barX + negW + zeroW, barY, posW, barH);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);
    }
  }

  // ─── Footer ────────────────────────────────────────────────────
  const footY = canvasH - footerH + 5;

  ctx.fillStyle = 'rgba(8, 8, 16, 0.9)';
  ctx.fillRect(0, footY, canvasW, footerH);
  ctx.strokeStyle = 'rgba(60, 60, 100, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footY);
  ctx.lineTo(canvasW, footY);
  ctx.stroke();

  // Legend
  const legY = footY + 14;
  ctx.textAlign = 'left';
  ctx.font = '9px system-ui, sans-serif';

  ctx.fillStyle = 'rgba(80, 160, 255, 0.9)';
  ctx.fillRect(marginL, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('suppresses', marginL + 14, legY + 9);

  ctx.fillStyle = 'rgba(70, 70, 90, 0.7)';
  ctx.fillRect(marginL + 90, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('near zero', marginL + 104, legY + 9);

  ctx.fillStyle = 'rgba(255, 170, 60, 0.9)';
  ctx.fillRect(marginL + 175, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('amplifies', marginL + 189, legY + 9);

  ctx.fillStyle = '#667788';
  ctx.fillText('|  node size = strength  |  dashed = pass-through (no weights)', marginL + 255, legY + 9);

  // Training note
  ctx.fillStyle = '#556677';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Watch nodes grow and color as training finds patterns. Gray → colored = learning.', marginL, legY + 26);

  // Health
  let healthMsg = 'All layers healthy';
  let healthColor = '#44bb77';
  for (const layer of layers) {
    if (!layer.weightData) continue;
    const flat = layer.weightData.flat;
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
    const dead = flat.filter(v => Math.abs(v) < 0.0001).length / flat.length;
    if (dead > 0.7) {
      healthMsg = `${layer.name}: ${(dead * 100).toFixed(0)}% dead weights`;
      healthColor = '#dd8844';
      break;
    }
    if (std > 3) {
      healthMsg = `${layer.name}: weights may be exploding (σ=${std.toFixed(2)})`;
      healthColor = '#dd6644';
      break;
    }
  }
  ctx.fillStyle = healthColor;
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(healthMsg, canvasW - marginR, legY + 26);

  return canvas;
}
