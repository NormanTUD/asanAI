/**
 * Live Training Network Visualizer — v6
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
    if (!flat || flat.length === 0) return null;
    const numUnits = shape[shape.length - 1] || 1;
    const perUnit = Math.floor(flat.length / numUnits);
    if (perUnit === 0) return null;
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
    return summaries.length > 0 ? summaries : null;
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
        if (flat.length > 0) {
          weightData = { flat, shape };
        }
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
  const maxNodes = Math.max(...layers.map(l => l.nodeCount));
  const minCanvasH = 500;
  const canvasH = Math.max(minCanvasH, Math.min(950, 130 + maxNodes * 8));
  const canvasW = 1050;

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
  const nodeAreaTop = graphTop + 36;
  const nodeAreaH = graphH - 52;

  function getNodeLayout(layer) {
    const count = layer.nodeCount;
    const spacePerNode = nodeAreaH / (count + 1);
    const nodeR = Math.max(1.5, Math.min(5.5, spacePerNode * 0.35));
    return { count, nodeR, spacePerNode };
  }

  function getNodeY(nodeIdx, totalCount) {
    if (totalCount <= 1) return nodeAreaTop + nodeAreaH / 2;
    return nodeAreaTop + ((nodeIdx + 0.5) / totalCount) * nodeAreaH;
  }

  function getLayerX(idx) {
    return marginL + idx * colW + colW / 2;
  }

  // ─── CONNECTION DRAWING ────────────────────────────────────────
  // Possible failure modes for Conv2D→Conv2D connections:
  //
  // 1. layerB.unitSummary is null because weightData extraction failed
  //    → FIX: fall back to layerA.unitSummary, then to uniform connections
  //
  // 2. Conv2D weight shape is [kH, kW, inChannels, outFilters] (4D)
  //    and the indexing math (inIdx * outDim + outIdx) is wrong for 4D
  //    → FIX: for conv layers, DON'T try to index individual weights,
  //      use per-filter summaries instead
  //
  // 3. shape[0] for conv is kernel height (e.g., 3), not input channels
  //    so inDim=3 and outDim=filters, but the actual connection is
  //    inChannels→outFilters, which is shape[2]→shape[3]
  //    → FIX: detect conv shapes (length >= 3) and use correct dims
  //
  // 4. localMax is 0 or NaN because all weights are exactly 0 (untrained)
  //    → FIX: clamp localMax, and always draw with minimum alpha
  //
  // 5. maxSampleA * maxSampleB = 0 because one layer has 0 display nodes
  //    → FIX: ensure minimum 1 sample per side
  //
  // 6. The connection loop skips entries where strength < threshold
  //    → FIX: remove threshold entirely, always draw every sampled connection
  //
  // 7. NaN/Infinity in weight values corrupts color strings
  //    → FIX: sanitize all values before using in rgba()
  //
  // 8. bezierCurveTo produces invisible curves when y1 ≈ y2 and points overlap
  //    → FIX: ensure start/end x have enough separation

  function sanitize(val) {
    if (!isFinite(val) || isNaN(val)) return 0;
    return val;
  }

  function clampAlpha(a) {
    return Math.max(0.06, Math.min(0.35, a));
  }

  function getConvConnectionData(weightData, numA, numB) {
    // For Conv2D: shape = [kH, kW, inChannels, outFilters]
    // For Conv1D: shape = [kW, inChannels, outFilters]
    // Connection meaning: each output filter connects to ALL input channels
    // So we summarize per (inChannel, outFilter) pair
    const shape = weightData.shape;
    const flat = weightData.flat;
    const dims = shape.length;

    let inChannels, outFilters, kernelSize;

    if (dims >= 4) {
      // Conv2D: [kH, kW, inCh, outF]
      kernelSize = shape[0] * shape[1];
      inChannels = shape[2];
      outFilters = shape[3];
    } else if (dims === 3) {
      // Conv1D: [kW, inCh, outF]
      kernelSize = shape[0];
      inChannels = shape[1];
      outFilters = shape[2];
    } else if (dims === 2) {
      // Dense-like: [in, out]
      inChannels = shape[0];
      outFilters = shape[1];
      kernelSize = 1;
    } else {
      // Fallback: can't determine structure
      return null;
    }

    if (inChannels === 0 || outFilters === 0 || kernelSize === 0) return null;

    // Build per-(in, out) connection strengths
    // For conv: weight layout is [kH][kW][inCh][outF] flattened
    // So weight for (kh, kw, ic, of) = flat[kh * kW * inCh * outF + kw * inCh * outF + ic * outF + of]
    // Per (ic, of) pair, sum across kernel spatial dims
    const connections = [];
    const perPair = kernelSize; // number of weights per (inChannel, outFilter) pair

    for (let ic = 0; ic < inChannels; ic++) {
      for (let of_ = 0; of_ < outFilters; of_++) {
        let sum = 0, sumAbs = 0;
        for (let k = 0; k < kernelSize; k++) {
          const idx = k * inChannels * outFilters + ic * outFilters + of_;
          const val = idx < flat.length ? sanitize(flat[idx]) : 0;
          sum += val;
          sumAbs += Math.abs(val);
        }
        connections.push({
          inIdx: ic,
          outIdx: of_,
          mean: sum / perPair,
          meanAbs: sumAbs / perPair
        });
      }
    }

    return { connections, inChannels, outFilters };
  }

  function getDenseConnectionData(weightData) {
    const shape = weightData.shape;
    const flat = weightData.flat;
    if (shape.length < 2) return null;

    const inDim = shape[0];
    const outDim = shape[shape.length - 1];
    if (inDim === 0 || outDim === 0) return null;

    return { inDim, outDim, flat };
  }

  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];
    const xA = getLayerX(idx);
    const xB = getLayerX(idx + 1);

    const layoutA = getNodeLayout(layerA);
    const layoutB = getNodeLayout(layerB);

    // Ensure we have at least 1 sample per side
    const maxSampleA = Math.max(1, Math.min(layoutA.count, 18));
    const maxSampleB = Math.max(1, Math.min(layoutB.count, 18));

    // Ensure enough x-separation for visible bezier curves
    const xSep = xB - xA;
    if (xSep < 10) continue; // layers too close, skip

    let connectionsDrawn = false;

    // ─── Strategy 1: Use layerB's weights (receiving layer) ─────
    if (layerB.weightData && layerB.weightData.flat.length > 0) {
      const shape = layerB.weightData.shape;
      const isConvLike = shape.length >= 3;

      if (isConvLike) {
        // Conv layer receiving: use per-(inChannel, outFilter) summary
        const convData = getConvConnectionData(layerB.weightData, layoutA.count, layoutB.count);

        if (convData && convData.connections.length > 0) {
          const localMax = Math.max(
            ...convData.connections.map(c => c.meanAbs),
            0.0001
          );

          // Sample connections evenly
          const maxConns = Math.min(convData.connections.length, maxSampleA * maxSampleB, 80);
          const step = Math.max(1, Math.floor(convData.connections.length / maxConns));

          for (let ci = 0; ci < convData.connections.length && ci * step < convData.connections.length; ci++) {
            const conn = convData.connections[Math.min(ci * step, convData.connections.length - 1)];
            const strength = conn.meanAbs / localMax;

            // Map inIdx/outIdx to visual node positions
            const visualA = Math.floor((conn.inIdx / convData.inChannels) * layoutA.count);
            const visualB = Math.floor((conn.outIdx / convData.outFilters) * layoutB.count);

            const y1 = getNodeY(visualA, layoutA.count);
            const y2 = getNodeY(visualB, layoutB.count);
            const cpx = (xA + xB) / 2;

            const alpha = clampAlpha(0.07 + strength * 0.2);
            const lw = 0.4 + strength * 1.2;
            const val = sanitize(conn.mean);

            const color = val >= 0
              ? `rgba(255, 170, 60, ${alpha})`
              : `rgba(80, 160, 255, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(xA + layoutA.nodeR + 2, y1);
            ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
          connectionsDrawn = true;
        }
      } else {
        // Dense-like layer receiving (2D weight matrix)
        const denseData = getDenseConnectionData(layerB.weightData);

        if (denseData) {
          const { inDim, outDim, flat } = denseData;
          const maxConns = maxSampleA * maxSampleB;
          let localMax = 0.0001;

          // Pre-scan for local max
          const sampleStep = Math.max(1, Math.floor(flat.length / maxConns));
          for (let i = 0; i < flat.length; i += sampleStep) {
            const v = Math.abs(sanitize(flat[i]));
            if (v > localMax) localMax = v;
          }

          for (let ai = 0; ai < maxSampleA; ai++) {
            const inIdx = Math.floor((ai / maxSampleA) * inDim);
            const visualA = Math.floor((ai / maxSampleA) * layoutA.count);

            for (let bi = 0; bi < maxSampleB; bi++) {
              const outIdx = Math.floor((bi / maxSampleB) * outDim);
              const visualB = Math.floor((bi / maxSampleB) * layoutB.count);

              const wIdx = inIdx * outDim + outIdx;
              const val = sanitize(wIdx < flat.length ? flat[wIdx] : 0);
              const strength = Math.abs(val) / localMax;

              const y1 = getNodeY(visualA, layoutA.count);
              const y2 = getNodeY(visualB, layoutB.count);
              const cpx = (xA + xB) / 2;

              const alpha = clampAlpha(0.07 + strength * 0.18);
              const lw = 0.3 + strength * 1.3;

              const color = val >= 0
                ? `rgba(255, 170, 60, ${alpha})`
                : `rgba(80, 160, 255, ${alpha})`;

              ctx.beginPath();
              ctx.moveTo(xA + layoutA.nodeR + 2, y1);
              ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
              ctx.strokeStyle = color;
              ctx.lineWidth = lw;
              ctx.stroke();
            }
          }
          connectionsDrawn = true;
        }
      }
    }

    // ─── Strategy 2: Fall back to layerA's weights (sending layer) ─
    if (!connectionsDrawn && layerA.weightData && layerA.weightData.flat.length > 0) {
      const shape = layerA.weightData.shape;
      const isConvLike = shape.length >= 3;

      if (isConvLike) {
        const convData = getConvConnectionData(layerA.weightData, layoutA.count, layoutB.count);
        if (convData && convData.connections.length > 0) {
          const localMax = Math.max(...convData.connections.map(c => c.meanAbs), 0.0001);
          const maxConns = Math.min(convData.connections.length, maxSampleA * maxSampleB, 80);
          const step = Math.max(1, Math.floor(convData.connections.length / maxConns));

          for (let ci = 0; ci < maxConns; ci++) {
            const connIdx = Math.min(ci * step, convData.connections.length - 1);
            const conn = convData.connections[connIdx];
            const strength = conn.meanAbs / localMax;

            const visualA = Math.floor((conn.inIdx / convData.inChannels) * layoutA.count);
            const visualB = Math.floor((conn.outIdx / convData.outFilters) * layoutB.count);

            const y1 = getNodeY(Math.min(visualA, layoutA.count - 1), layoutA.count);
            const y2 = getNodeY(Math.min(visualB, layoutB.count - 1), layoutB.count);
            const cpx = (xA + xB) / 2;

            const alpha = clampAlpha(0.07 + strength * 0.2);
            const lw = 0.4 + strength * 1.2;
            const val = sanitize(conn.mean);

            const color = val >= 0
              ? `rgba(255, 170, 60, ${alpha})`
              : `rgba(80, 160, 255, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(xA + layoutA.nodeR + 2, y1);
            ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
          connectionsDrawn = true;
        }
      } else if (layerA.unitSummary && layerA.unitSummary.length > 0) {
        // Use unit summaries spread across connections
        const summaries = layerA.unitSummary;
        const localMax = Math.max(...summaries.map(s => s.meanAbs), 0.0001);

        for (let ai = 0; ai < maxSampleA; ai++) {
          const visualA = Math.floor((ai / maxSampleA) * layoutA.count);
          for (let bi = 0; bi < maxSampleB; bi++) {
            const visualB = Math.floor((bi / maxSampleB) * layoutB.count);
            const sIdx = (ai + bi) % summaries.length;
            const u = summaries[sIdx];
            const strength = u.meanAbs / localMax;

            const y1 = getNodeY(visualA, layoutA.count);
            const y2 = getNodeY(visualB, layoutB.count);
            const cpx = (xA + xB) / 2;

            const alpha = clampAlpha(0.07 + strength * 0.15);
            const lw = 0.3 + strength * 1.0;
            const val = sanitize(u.mean);

            const color = val >= 0
              ? `rgba(255, 170, 60, ${alpha})`
              : `rgba(80, 160, 255, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(xA + layoutA.nodeR + 2, y1);
            ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        }
        connectionsDrawn = true;
      }
    }

    // ─── Strategy 3: Fall back to unitSummary from either side ────
    if (!connectionsDrawn) {
      const summaries = layerB.unitSummary || layerA.unitSummary;
      if (summaries && summaries.length > 0) {
        const localMax = Math.max(...summaries.map(s => s.meanAbs), 0.0001);

        for (let ai = 0; ai < maxSampleA; ai++) {
          const visualA = Math.floor((ai / maxSampleA) * layoutA.count);
          for (let bi = 0; bi < maxSampleB; bi++) {
            const visualB = Math.floor((bi / maxSampleB) * layoutB.count);
            const sIdx = (ai * maxSampleB + bi) % summaries.length;
            const u = summaries[sIdx];
            const strength = u.meanAbs / localMax;

            const y1 = getNodeY(visualA, layoutA.count);
            const y2 = getNodeY(visualB, layoutB.count);
            const cpx = (xA + xB) / 2;

            const alpha = clampAlpha(0.07 + strength * 0.15);
            const lw = 0.3 + strength * 1.0;
            const val = sanitize(u.mean);

            const color = val >= 0
              ? `rgba(255, 170, 60, ${alpha})`
              : `rgba(80, 160, 255, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(xA + layoutA.nodeR + 2, y1);
            ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        }
        connectionsDrawn = true;
      }
    }

    // ─── Strategy 4: ABSOLUTE FALLBACK — always draw something ───
    if (!connectionsDrawn) {
      // No weight data available anywhere — draw neutral pass-through
      // This guarantees every adjacent layer pair has visible connections
      const numLines = Math.max(3, Math.min(maxSampleA, maxSampleB, 8));
      for (let i = 0; i < numLines; i++) {
        const frac = numLines <= 1 ? 0.5 : i / (numLines - 1);
        const visualA = Math.floor(frac * (layoutA.count - 1));
        const visualB = Math.floor(frac * (layoutB.count - 1));
        const y1 = getNodeY(visualA, layoutA.count);
        const y2 = getNodeY(visualB, layoutB.count);
        const cpx = (xA + xB) / 2;

        ctx.beginPath();
        ctx.moveTo(xA + layoutA.nodeR + 2, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, xB - layoutB.nodeR - 2, y2);
        ctx.strokeStyle = 'rgba(120, 140, 170, 0.22)';
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
        nodeR = layout.nodeR * (0.6 + strength * 0.5);
        glowAlpha = 0.03 + strength * 0.1;

        const val = sanitize(u.mean);
        if (val > 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(180 + t * 75)}, ${Math.floor(130 + t * 40)}, 40)`;
        } else {
          const t = Math.min(1, strength);
          nodeColor = `rgb(40, ${Math.floor(120 + t * 60)}, ${Math.floor(180 + t * 75)})`;
        }
      }

      if (nodeR > 2.5) {
        ctx.beginPath();
        ctx.arc(x, ny, nodeR + 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(150, 150, 220, ${glowAlpha})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, ny, Math.max(1.2, nodeR), 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    }

    // Count label
    if (layout.count > 1) {
      const bottomY = nodeAreaTop + nodeAreaH + 10;
      ctx.fillStyle = '#556677';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${layout.count}`, x, bottomY);
    }

    // Weight stats + mini distribution bar
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
      const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);

      const barY = graphTop + graphH - 14;
      const barW = Math.min(colW - 12, 46);
      const barH = 4;
      const barX = x - barW / 2;

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

      // σ value
      ctx.fillStyle = '#556677';
      ctx.font = '7px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`σ${std.toFixed(3)}`, x, barY + 11);
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
  ctx.fillText('negative (suppresses)', marginL + 14, legY + 9);

  ctx.fillStyle = 'rgba(70, 70, 90, 0.7)';
  ctx.fillRect(marginL + 155, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('near zero', marginL + 169, legY + 9);

  ctx.fillStyle = 'rgba(255, 170, 60, 0.9)';
  ctx.fillRect(marginL + 240, legY, 10, 10);
  ctx.fillStyle = '#99aabb';
  ctx.fillText('positive (amplifies)', marginL + 254, legY + 9);

  ctx.fillStyle = '#556677';
  ctx.fillText('σ = weight spread · lines = actual weights between neurons/filters', marginL + 400, legY + 9);

  ctx.fillStyle = '#4a5a6a';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Training shifts weights from random (gray, small) → specialized (colored, large). Lines show learned connection strengths.', marginL, legY + 26);

  // Health check
  let healthMsg = 'healthy';
  let healthColor = '#44bb77';
  for (const layer of layers) {
    if (!layer.weightData) continue;
    const flat = layer.weightData.flat;
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
    const dead = flat.filter(v => Math.abs(v) < 0.0001).length / flat.length;
    if (dead > 0.7) {
      healthMsg = `⚠ ${layer.name}: ${(dead * 100).toFixed(0)}% dead weights`;
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
