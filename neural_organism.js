/**
 * Live Training Network Visualizer — v4
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
        nodeCount = Math.min(inputShape.filter(x => x !== null).reduce((a, b) => a * b, 1) || 4, 128);
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

  // ─── Canvas — height adapts to largest layer ───────────────────
  const maxNodes = Math.max(...layers.map(l => l.nodeCount));
  const minCanvasH = 500;
  const canvasH = Math.max(minCanvasH, Math.min(900, 120 + maxNodes * 9));
  const canvasW = 1000;

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
  const footerH = 52;
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

  // ─── Node layout ──────────────────────────────────────────────
  const nodeAreaTop = graphTop + 36;
  const nodeAreaH = graphH - 50;

  // Show ALL nodes — scale radius down when there are many
  function getNodeLayout(layer) {
    const count = layer.nodeCount;
    // Available vertical space per node
    const spacePerNode = nodeAreaH / (count + 1);
    // Scale node radius: big when few, tiny when many
    const nodeR = Math.max(1.5, Math.min(5, spacePerNode * 0.35));
    return { count, nodeR, spacePerNode };
  }

  function getNodeY(nodeIdx, totalCount) {
    if (totalCount <= 1) return nodeAreaTop + nodeAreaH / 2;
    return nodeAreaTop + ((nodeIdx + 0.5) / totalCount) * nodeAreaH;
  }

  function getLayerX(idx) {
    return marginL + idx * colW + colW / 2;
  }

  // ─── Draw connections ──────────────────────────────────────────
  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];
    const xA = getLayerX(idx);
    const xB = getLayerX(idx + 1);

    const layoutA = getNodeLayout(layerA);
    const layoutB = getNodeLayout(layerB);

    // Determine how many connection lines to draw
    // For large layers, sample evenly
    const maxLinesA = Math.min(layoutA.count, 16);
    const maxLinesB = Math.min(layoutB.count, 16);

    let summaries = null;
    let localMax = 0.001;

    if (layerB.unitSummary && layerB.unitSummary.length > 0) {
      summaries = layerB.unitSummary;
      localMax = Math.max(...summaries.map(s => s.meanAbs), 0.001);
    } else if (layerA.unitSummary && layerA.unitSummary.length > 0) {
      summaries = layerA.unitSummary;
      localMax = Math.max(...summaries.map(s => s.meanAbs), 0.001);
    }

    if (summaries) {
      const maxConns = Math.min(maxLinesA * maxLinesB, 60);
      let drawn = 0;

      for (let ai = 0; ai < maxLinesA && drawn < maxConns; ai++) {
        // Map sampled index back to actual node index
        const a = Math.floor((ai / maxLinesA) * layoutA.count);
        for (let bi = 0; bi < maxLinesB && drawn < maxConns; bi++) {
          const b = Math.floor((bi / maxLinesB) * layoutB.count);

          const sIdx = (ai + bi) % summaries.length;
          const u = summaries[sIdx];
          const strength = u.meanAbs / localMax;

          const y1 = getNodeY(a, layoutA.count);
          const y2 = getNodeY(b, layoutB.count);
          const cpx = (xA + xB) / 2;

          // MINIMUM visibility — never fully invisible
          const alpha = 0.06 + strength * 0.18;
          const lw = 0.4 + strength * 1.2;

          let color;
          if (u.mean >= 0) {
            color = `rgba(255, 170, 60, ${alpha})`;
          } else {
            color = `rgba(80, 160, 255, ${alpha})`;
          }

          ctx.beginPath();
          ctx.moveTo(xA + layoutA.nodeR + 2, y1);
          ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.stroke();

          drawn++;
        }
      }
    } else {
      // Pass-through: always visible dashed lines
      const numLines = Math.min(maxLinesA, maxLinesB, 8);
      for (let i = 0; i < numLines; i++) {
        const a = Math.floor((i / numLines) * layoutA.count);
        const b = Math.floor((i / numLines) * layoutB.count);
        const y1 = getNodeY(a, layoutA.count);
        const y2 = getNodeY(b, layoutB.count);
        const cpx = (xA + xB) / 2;

        ctx.beginPath();
        ctx.moveTo(xA + layoutA.nodeR + 2, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
        ctx.strokeStyle = 'rgba(120, 140, 170, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ─── Draw layers ───────────────────────────────────────────────
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
    const layout = getNodeLayout(layer);

    // Role label
    ctx.fillStyle = color;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.role, x, graphTop + 10);

    // Description
    ctx.fillStyle = '#667788';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText(layer.shortDesc, x, graphTop + 22);

    // Local normalization
    let localAbsMax = 0.001;
    if (layer.unitSummary) {
      for (const u of layer.unitSummary) {
        if (u.meanAbs > localAbsMax) localAbsMax = u.meanAbs;
      }
    }

    // Draw ALL nodes
    for (let n = 0; n < layout.count; n++) {
      const ny = getNodeY(n, layout.count);
      let nodeR = layout.nodeR;
      let nodeColor = color;
      let glowAlpha = 0.04;

      if (layer.unitSummary) {
        const uIdx = n % layer.unitSummary.length;
        const u = layer.unitSummary[uIdx];
        const strength = u.meanAbs / localAbsMax;

        // Scale radius by strength but keep minimum visible
        nodeR = layout.nodeR * (0.6 + strength * 0.6);
        glowAlpha = 0.03 + strength * 0.1;

        if (u.mean > 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(180 + t * 75)}, ${Math.floor(130 + t * 40)}, 40)`;
        } else {
          const t = Math.min(1, strength);
          nodeColor = `rgb(40, ${Math.floor(120 + t * 60)}, ${Math.floor(180 + t * 75)})`;
        }
      }

      // Glow (only for larger nodes to avoid clutter)
      if (nodeR > 2.5) {
        ctx.beginPath();
        ctx.arc(x, ny, nodeR + 2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(150, 150, 220, ${glowAlpha})`;
        ctx.fill();
      }

      // Node — always visible
      ctx.beginPath();
      ctx.arc(x, ny, Math.max(1.2, nodeR), 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    }

    // Node count label below
    if (layout.count > 1) {
      const bottomY = nodeAreaTop + nodeAreaH + 10;
      ctx.fillStyle = '#556677';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${layout.count}`, x, bottomY);
    }

    // Mini distribution bar
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const barY = graphTop + graphH - 12;
      const barW = Math.min(colW - 14, 44);
      const barH = 4;
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
  ctx.fillText('inactive', marginL + 102, legY + 9);

  ctx.fillStyle = 'rgba(255, 170, 60, 0.9)';
  ctx.fillRect(marginL + 160, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('amplifies', marginL + 174, legY + 9);

  ctx.fillStyle = '#556677';
  ctx.fillText('node size = strength · all neurons shown · dashed = no weights (reshape/pass)', marginL + 248, legY + 9);

  ctx.fillStyle = '#4a5a6a';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Nodes grow and shift blue/orange as training learns. Number below each column = neuron/filter count.', marginL, legY + 26);

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
  ctx.fillText(healthMsg, canvasW - marginR, legY + 26);

  return canvas;
}
