/**
 * Live Training Network Visualizer — v3
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

  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ─── Layout ────────────────────────────────────────────────────
  const marginL = 45;
  const marginR = 45;
  const headerH = 42;
  const footerH = 55;
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

  // ─── Node layout helpers ───────────────────────────────────────
  const maxDisplayNodes = 10;
  const nodeAreaTop = graphTop + 38;
  const nodeAreaH = graphH - 60;

  function getDisplayCount(layer) {
    return Math.min(layer.nodeCount, maxDisplayNodes);
  }

  function getNodeY(nodeIdx, totalDisplay) {
    if (totalDisplay <= 1) return nodeAreaTop + nodeAreaH / 2;
    const spacing = nodeAreaH / (totalDisplay + 1);
    return nodeAreaTop + (nodeIdx + 1) * spacing;
  }

  function getLayerX(idx) {
    return marginL + idx * colW + colW / 2;
  }

  // ─── Draw ALL connections between adjacent layers ──────────────
  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];
    const xA = getLayerX(idx);
    const xB = getLayerX(idx + 1);
    const displayA = getDisplayCount(layerA);
    const displayB = getDisplayCount(layerB);

    // Determine if we have weight info from EITHER side
    // Use layer B's weights if it has them (typical: Dense, Conv receiving input)
    // Otherwise use layer A's weights if available (for connections leaving a weighted layer)
    // Otherwise draw neutral pass-through
    let summaries = null;
    let localMax = 0.001;

    if (layerB.unitSummary && layerB.unitSummary.length > 0) {
      summaries = layerB.unitSummary;
      localMax = Math.max(...summaries.map(s => s.meanAbs), 0.001);
    } else if (layerA.unitSummary && layerA.unitSummary.length > 0) {
      // Use the outgoing layer's weights (e.g., Conv2D → Flatten)
      summaries = layerA.unitSummary;
      localMax = Math.max(...summaries.map(s => s.meanAbs), 0.001);
    }

    if (summaries) {
      // Draw weighted connections
      const maxConns = Math.min(displayA * displayB, 35);
      let drawn = 0;

      for (let a = 0; a < displayA && drawn < maxConns; a++) {
        for (let b = 0; b < displayB && drawn < maxConns; b++) {
          const sIdx = (a + b) % summaries.length;
          const u = summaries[sIdx];
          const strength = u.meanAbs / localMax;

          if (strength < 0.08) { drawn++; continue; }

          const y1 = getNodeY(a, displayA);
          const y2 = getNodeY(b, displayB);
          const cpx = (xA + xB) / 2;

          const alpha = Math.min(0.22, 0.03 + strength * 0.12);
          const lw = Math.min(1.8, 0.3 + strength * 1.0);

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
      // No weights on either side — draw neutral pass-through lines
      const numLines = Math.min(displayA, displayB, 5);
      for (let i = 0; i < numLines; i++) {
        const aFrac = numLines <= 1 ? 0.5 : i / (numLines - 1);
        const bFrac = numLines <= 1 ? 0.5 : i / (numLines - 1);
        const aIdx = Math.floor(aFrac * (displayA - 1));
        const bIdx = Math.floor(bFrac * (displayB - 1));
        const y1 = getNodeY(aIdx, displayA);
        const y2 = getNodeY(bIdx, displayB);
        const cpx = (xA + xB) / 2;

        ctx.beginPath();
        ctx.moveTo(xA + 6, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - 6, y2);
        ctx.strokeStyle = 'rgba(100, 120, 150, 0.18)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ─── Draw layer nodes and labels ───────────────────────────────
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
    const x = getLayerX(idx);
    const color = roleColors[layer.role] || '#6688aa';
    const displayNodes = getDisplayCount(layer);

    // Role label
    ctx.fillStyle = color;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.role, x, graphTop + 10);

    // Description
    ctx.fillStyle = '#667788';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText(layer.shortDesc, x, graphTop + 22);

    // Local normalization for node sizing
    let localAbsMax = 0.001;
    if (layer.unitSummary) {
      for (const u of layer.unitSummary) {
        if (u.meanAbs > localAbsMax) localAbsMax = u.meanAbs;
      }
    }

    // Draw nodes
    for (let n = 0; n < displayNodes; n++) {
      const ny = getNodeY(n, displayNodes);
      let nodeR = 4.5;
      let nodeColor = color;
      let glowAlpha = 0.06;

      if (layer.unitSummary) {
        const uIdx = n % layer.unitSummary.length;
        const u = layer.unitSummary[uIdx];
        const strength = u.meanAbs / localAbsMax;
        nodeR = 3.5 + strength * 3;
        glowAlpha = 0.04 + strength * 0.12;

        if (u.mean > 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(200 + t * 55)}, ${Math.floor(140 + t * 30)}, 40)`;
        } else {
          const t = Math.min(1, strength);
          nodeColor = `rgb(40, ${Math.floor(130 + t * 50)}, ${Math.floor(200 + t * 55)})`;
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

    // Overflow
    if (layer.nodeCount > maxDisplayNodes) {
      const overflowY = getNodeY(displayNodes - 1, displayNodes) + 16;
      ctx.fillStyle = '#556677';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${layer.nodeCount - maxDisplayNodes}`, x, overflowY);
    }

    // Mini distribution bar
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const barY = graphTop + graphH - 16;
      const barW = Math.min(colW - 14, 46);
      const barH = 5;
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

      ctx.fillStyle = 'rgba(80, 160, 255, 0.7)';
      ctx.fillRect(barX, barY, (neg / total) * barW, barH);
      ctx.fillStyle = 'rgba(70, 70, 90, 0.5)';
      ctx.fillRect(barX + (neg / total) * barW, barY, (zero / total) * barW, barH);
      ctx.fillStyle = 'rgba(255, 170, 60, 0.7)';
      ctx.fillRect(barX + ((neg + zero) / total) * barW, barY, (pos / total) * barW, barH);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);
    }
  }

  // ─── Footer ────────────────────────────────────────────────────
  const footY = canvasH - footerH + 3;
  ctx.fillStyle = 'rgba(8, 8, 16, 0.95)';
  ctx.fillRect(0, footY, canvasW, footerH);

  const legY = footY + 12;
  ctx.textAlign = 'left';
  ctx.font = '9px system-ui, sans-serif';

  ctx.fillStyle = 'rgba(80, 160, 255, 0.9)';
  ctx.fillRect(marginL, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('suppresses', marginL + 14, legY + 9);

  ctx.fillStyle = 'rgba(70, 70, 90, 0.7)';
  ctx.fillRect(marginL + 88, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('near zero', marginL + 102, legY + 9);

  ctx.fillStyle = 'rgba(255, 170, 60, 0.9)';
  ctx.fillRect(marginL + 172, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('amplifies', marginL + 186, legY + 9);

  ctx.fillStyle = '#556677';
  ctx.fillText('bigger node = stronger filter/neuron · dashed = reshape (no learned weights)', marginL + 260, legY + 9);

  // Training note
  ctx.fillStyle = '#4a5a6a';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Nodes grow and color as training progresses. Gray → blue/orange = the network is learning patterns.', marginL, legY + 25);

  // Health
  let healthMsg = 'healthy';
  let healthColor = '#44bb77';
  for (const layer of layers) {
    if (!layer.weightData) continue;
    const flat = layer.weightData.flat;
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
    const dead = flat.filter(v => Math.abs(v) < 0.0001).length / flat.length;
    if (dead > 0.7) {
      healthMsg = `⚠ ${layer.name}: ${(dead * 100).toFixed(0)}% dead`;
      healthColor = '#dd8844';
      break;
    }
    if (std > 3) {
      healthMsg = `⚠ ${layer.name}: exploding (σ=${std.toFixed(2)})`;
      healthColor = '#dd6644';
      break;
    }
  }
  ctx.fillStyle = healthColor;
  ctx.textAlign = 'right';
  ctx.fillText(healthMsg, canvasW - marginR, legY + 25);

  return canvas;
}
