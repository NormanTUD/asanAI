/**
 * Live Training Network Visualizer — v8 (Bulletproof)
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

  // ─── UTILITIES ──────────────────────────────────────────────────

  function flatten(arr) {
    const result = [];
    const stack = [arr];
    while (stack.length) {
      const item = stack.pop();
      if (Array.isArray(item)) {
        for (let i = item.length - 1; i >= 0; i--) stack.push(item[i]);
      } else {
        result.push(typeof item === 'number' ? item : 0);
      }
    }
    return result;
  }

  function getShape(arr) {
    const shape = [];
    let current = arr;
    while (Array.isArray(current) && current.length > 0) {
      shape.push(current.length);
      current = current[0];
    }
    return shape;
  }

  function sanitize(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val !== 'number') return 0;
    if (!isFinite(val)) return 0;
    if (isNaN(val)) return 0;
    return val;
  }

  // Safe mapping: maps index i in range [0, fromCount) to range [0, toCount)
  // Guarantees: output is always a valid integer in [0, toCount-1]
  function mapIndex(i, fromCount, toCount) {
    if (toCount <= 0) return 0;
    if (fromCount <= 0) return 0;
    if (toCount === 1) return 0;
    if (fromCount === 1) return Math.floor(toCount / 2);
    const ratio = i / (fromCount - 1);
    return Math.min(toCount - 1, Math.max(0, Math.round(ratio * (toCount - 1))));
  }

  function getPerUnitSummary(weightData) {
    if (!weightData) return null;
    if (!weightData.flat || weightData.flat.length === 0) return null;
    if (!weightData.shape || weightData.shape.length === 0) return null;
    const shape = weightData.shape;
    const flat = weightData.flat;
    const numUnits = shape[shape.length - 1] || 1;
    const perUnit = Math.floor(flat.length / numUnits);
    if (perUnit <= 0) return null;
    const summaries = [];
    for (let u = 0; u < numUnits; u++) {
      const start = u * perUnit;
      const end = Math.min(start + perUnit, flat.length);
      let sum = 0, sumAbs = 0, count = 0;
      for (let i = start; i < end; i++) {
        const v = sanitize(flat[i]);
        sum += v;
        sumAbs += Math.abs(v);
        count++;
      }
      if (count === 0) count = 1;
      summaries.push({ mean: sum / count, meanAbs: sumAbs / count });
    }
    return summaries.length > 0 ? summaries : null;
  }

  function describeLayer(layer) {
    const type = layer.getClassName ? layer.getClassName() : 'Unknown';
    let config = {};
    try { config = layer.getConfig ? layer.getConfig() : {}; } catch (e) {}
    let shortDesc = '';
    let role = '';
    let nodeCount = 1;

    switch (type.toLowerCase()) {
      case 'inputlayer': {
        const inputShape = config.batchInputShape || config.inputShape || [];
        const filtered = inputShape.filter(x => x !== null && x !== undefined && x > 0);
        shortDesc = `[${filtered.join(',')}]`;
        role = 'INPUT';
        nodeCount = Math.min(filtered.reduce((a, b) => a * b, 1) || 4, 128);
        break;
      }
      case 'dense': {
        const units = config.units || 1;
        const act = config.activation || 'linear';
        shortDesc = `${units} × ${act}`;
        role = act === 'softmax' ? 'OUTPUT' : act === 'sigmoid' ? 'GATE' : 'DENSE';
        nodeCount = units;
        break;
      }
      case 'conv2d':
      case 'conv1d': {
        const filters = config.filters || 1;
        const ks = config.kernelSize || [];
        shortDesc = `${filters}f ${Array.isArray(ks) ? ks.join('×') : ks}k`;
        role = 'CONV';
        nodeCount = filters;
        break;
      }
      case 'maxpooling2d':
      case 'maxpooling1d':
      case 'averagepooling2d':
      case 'globalmaxpooling2d':
      case 'globalaveragepooling2d':
        shortDesc = 'pool';
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
      case 'simplernn':
        shortDesc = `${config.units || '?'} cells`;
        role = type.toUpperCase();
        nodeCount = config.units || 4;
        break;
      case 'embedding':
        shortDesc = `${config.outputDim || '?'}d`;
        role = 'EMBED';
        nodeCount = config.outputDim || 4;
        break;
      default:
        shortDesc = type.substring(0, 10);
        role = type.substring(0, 5).toUpperCase();
        nodeCount = 4;
    }
    return { type, shortDesc, role, nodeCount: Math.max(1, nodeCount) };
  }

  // ─── EXTRACT LAYERS ─────────────────────────────────────────────

  const layers = [];
  for (let li = 0; li < _m.layers.length; li++) {
    const layer = _m.layers[li];
    const info = describeLayer(layer);
    let weightData = null;
    let biasData = null;

    let layerWeights = [];
    try { layerWeights = layer.getWeights() || []; } catch (e) {}

    if (layerWeights.length > 0) {
      try {
        const w = layerWeights[0].arraySync();
        if (w !== null && w !== undefined) {
          const flat = Array.isArray(w) ? flatten(w) : (typeof w === 'number' ? [w] : []);
          const shape = Array.isArray(w) ? getShape(w) : [1];
          if (flat.length > 0) {
            weightData = { flat, shape };
          }
        }
      } catch (e) {}
      if (layerWeights.length > 1) {
        try {
          const b = layerWeights[1].arraySync();
          if (b !== null && b !== undefined) {
            biasData = { flat: Array.isArray(b) ? flatten(b) : (typeof b === 'number' ? [b] : []) };
          }
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

  // ─── CANVAS SETUP ──────────────────────────────────────────────

  const maxNodes = Math.max(...layers.map(l => l.nodeCount));
  const canvasH = Math.max(480, Math.min(950, 130 + maxNodes * 8));
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

  // ─── LAYOUT CONSTANTS ──────────────────────────────────────────

  const marginL = 45;
  const marginR = 45;
  const headerH = 42;
  const footerH = 55;
  const graphW = canvasW - marginL - marginR;
  const graphTop = headerH;
  const graphH = canvasH - headerH - footerH;
  const colW = graphW / numLayers;
  const nodeAreaTop = graphTop + 36;
  const nodeAreaH = graphH - 52;

  // ─── POSITION HELPERS ──────────────────────────────────────────

  function getNodeR(count) {
    const spacePerNode = nodeAreaH / (count + 1);
    return Math.max(1.5, Math.min(5.5, spacePerNode * 0.35));
  }

  function getNodeY(nodeIdx, totalCount) {
    if (totalCount <= 1) return nodeAreaTop + nodeAreaH / 2;
    return nodeAreaTop + ((nodeIdx + 0.5) / totalCount) * nodeAreaH;
  }

  function getLayerX(idx) {
    return marginL + idx * colW + colW / 2;
  }

  // ─── HEADER ────────────────────────────────────────────────────

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

  // ─── CONNECTION DRAWING ────────────────────────────────────────
  //
  // GUARANTEE: Between every pair of adjacent layers, EVERY visual node
  // on the left will have at least one line going right, and EVERY visual
  // node on the right will have at least one line coming from the left.
  //
  // Method: We draw a FULL GRID of connections: every sampled left node
  // connects to every sampled right node. We sample up to 24 nodes per side.
  // If a layer has fewer than 24 nodes, ALL its nodes get connections.
  //
  // Weight data determines ONLY the color and thickness of lines.
  // It NEVER determines whether a line is drawn or not.

  for (let idx = 0; idx < numLayers - 1; idx++) {
    const layerA = layers[idx];
    const layerB = layers[idx + 1];
    const xA = getLayerX(idx);
    const xB = getLayerX(idx + 1);
    const countA = layerA.nodeCount;
    const countB = layerB.nodeCount;
    const nodeRA = getNodeR(countA);
    const nodeRB = getNodeR(countB);

    // Number of visual nodes to sample per side
    // CRITICAL: if count <= 24, use ALL nodes. No node left behind.
    const sampleA = Math.min(countA, 24);
    const sampleB = Math.min(countB, 24);

    // Find weight data
    let weightFlat = null;
    let weightShape = null;

    if (layerB.weightData && layerB.weightData.flat.length > 0) {
      weightFlat = layerB.weightData.flat;
      weightShape = layerB.weightData.shape;
    } else if (layerA.weightData && layerA.weightData.flat.length > 0) {
      weightFlat = layerA.weightData.flat;
      weightShape = layerA.weightData.shape;
    }

    // Build value for every (sampleA, sampleB) pair
    const totalConns = sampleA * sampleB;
    const values = new Array(totalConns);

    if (weightFlat && weightShape && weightFlat.length > 0) {
      // We have weight data — compute a value for each visual connection
      const wLen = weightFlat.length;

      for (let ai = 0; ai < sampleA; ai++) {
        for (let bi = 0; bi < sampleB; bi++) {
          const connIdx = ai * sampleB + bi;

          // Strategy: map (ai, bi) to a position in the weight array
          // Use multiple approaches and pick the one that works

          let val = 0;
          let found = false;

          // Approach 1: 2D matrix indexing [inDim, outDim]
          if (!found && weightShape.length === 2) {
            const inDim = weightShape[0];
            const outDim = weightShape[1];
            if (inDim > 0 && outDim > 0) {
              const row = mapIndex(ai, sampleA, inDim);
              const col = mapIndex(bi, sampleB, outDim);
              const wIdx = row * outDim + col;
              if (wIdx >= 0 && wIdx < wLen) {
                val = sanitize(weightFlat[wIdx]);
                found = true;
              }
            }
          }

          // Approach 2: 4D conv [kH, kW, inCh, outF]
          if (!found && weightShape.length === 4) {
            const kH = weightShape[0];
            const kW = weightShape[1];
            const inCh = weightShape[2];
            const outF = weightShape[3];
            if (inCh > 0 && outF > 0 && kH > 0 && kW > 0) {
              const ic = mapIndex(ai, sampleA, inCh);
              const of_ = mapIndex(bi, sampleB, outF);
              // Average across kernel
              let sum = 0;
              const kernelSize = kH * kW;
              for (let k = 0; k < kernelSize; k++) {
                const wIdx = k * (inCh * outF) + ic * outF + of_;
                if (wIdx >= 0 && wIdx < wLen) {
                  sum += sanitize(weightFlat[wIdx]);
                }
              }
              val = sum / kernelSize;
              found = true;
            }
          }

          // Approach 3: 3D conv [kW, inCh, outF]
          if (!found && weightShape.length === 3) {
            const kW = weightShape[0];
            const inCh = weightShape[1];
            const outF = weightShape[2];
            if (inCh > 0 && outF > 0 && kW > 0) {
              const ic = mapIndex(ai, sampleA, inCh);
              const of_ = mapIndex(bi, sampleB, outF);
              let sum = 0;
              for (let k = 0; k < kW; k++) {
                const wIdx = k * (inCh * outF) + ic * outF + of_;
                if (wIdx >= 0 && wIdx < wLen) {
                  sum += sanitize(weightFlat[wIdx]);
                }
              }
              val = sum / kW;
              found = true;
            }
          }

          // Approach 4: 1D or unknown shape — linear interpolation into flat array
          if (!found) {
            const flatIdx = Math.floor((connIdx / totalConns) * wLen);
            if (flatIdx >= 0 && flatIdx < wLen) {
              val = sanitize(weightFlat[flatIdx]);
              found = true;
            }
          }

          // Approach 5: absolute fallback
          if (!found) {
            val = 0;
          }

          values[connIdx] = val;
        }
      }
    } else {
      // No weight data at all — fill with zeros (will draw as neutral)
      for (let i = 0; i < totalConns; i++) {
        values[i] = 0;
      }
    }

    // Find local max for normalization
    let localMax = 0;
    for (let i = 0; i < totalConns; i++) {
      const abs = Math.abs(values[i]);
      if (abs > localMax) localMax = abs;
    }
    if (localMax < 0.00001) localMax = 1; // untrained or all-zero

    const hasWeights = weightFlat !== null && localMax > 0.00001;

    // ─── DRAW EVERY CONNECTION ──────────────────────────────────
    for (let ai = 0; ai < sampleA; ai++) {
      // Map sample index to visual node index
      // CRITICAL: use mapIndex to guarantee coverage of all visual nodes
      const visualA = mapIndex(ai, sampleA, countA);
      const y1 = getNodeY(visualA, countA);

      for (let bi = 0; bi < sampleB; bi++) {
        const visualB = mapIndex(bi, sampleB, countB);
        const y2 = getNodeY(visualB, countB);

        const val = values[ai * sampleB + bi];
        const strength = Math.abs(val) / localMax;

        const cpx = (xA + xB) / 2;
        const x1 = xA + nodeRA + 2;
        const x2 = xB - nodeRB - 2;

        let alpha, lw, color;

        if (hasWeights) {
          // MINIMUM alpha = 0.06, so even the weakest connection is visible
          alpha = 0.06 + strength * 0.24;
          lw = 0.35 + strength * 1.5;

          if (val >= 0) {
            color = `rgba(255, 170, 60, ${alpha})`;
          } else {
            color = `rgba(80, 160, 255, ${alpha})`;
          }
        } else {
          // No weights — uniform gray dashed
          alpha = 0.14;
          lw = 0.6;
          color = `rgba(130, 150, 180, ${alpha})`;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;

        if (!hasWeights) {
          ctx.setLineDash([3, 3]);
        }
        ctx.stroke();
        if (!hasWeights) {
          ctx.setLineDash([]);
        }
      }
    }
  }

  // ─── DRAW LAYER NODES ──────────────────────────────────────────

  const roleColors = {
    'INPUT': '#44bb88', 'DENSE': '#6699dd', 'OUTPUT': '#ff8855',
    'GATE': '#ddaa44', 'CONV': '#aa77dd', 'POOL': '#55aabb',
    'FLATTEN': '#778899', 'DROP': '#aa6666', 'NORM': '#66aa88',
    'LSTM': '#dd77aa', 'GRU': '#dd77aa', 'EMBED': '#77aadd',
  };

  for (let idx = 0; idx < numLayers; idx++) {
    const layer = layers[idx];
    const x = getLayerX(idx);
    const color = roleColors[layer.role] || '#6688aa';
    const count = layer.nodeCount;
    const nodeR = getNodeR(count);

    // Role label
    ctx.fillStyle = color;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.role, x, graphTop + 10);

    // Description
    ctx.fillStyle = '#667788';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText(layer.shortDesc, x, graphTop + 22);

    // Local normalization for node coloring
    let localAbsMax = 0.001;
    if (layer.unitSummary) {
      for (const u of layer.unitSummary) {
        if (u.meanAbs > localAbsMax) localAbsMax = u.meanAbs;
      }
    }

    // Draw ALL nodes
    for (let n = 0; n < count; n++) {
      const ny = getNodeY(n, count);
      let r = nodeR;
      let nodeColor = color;
      let glowAlpha = 0.04;

      if (layer.unitSummary && layer.unitSummary.length > 0) {
        const uIdx = n % layer.unitSummary.length;
        const u = layer.unitSummary[uIdx];
        const strength = u.meanAbs / localAbsMax;
        r = nodeR * (0.6 + strength * 0.5);
        glowAlpha = 0.03 + strength * 0.12;

        const val = sanitize(u.mean);
        if (val > 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(${Math.floor(180 + t * 75)}, ${Math.floor(130 + t * 40)}, 40)`;
        } else if (val < 0) {
          const t = Math.min(1, strength);
          nodeColor = `rgb(40, ${Math.floor(120 + t * 60)}, ${Math.floor(180 + t * 75)})`;
        }
        // val === 0 keeps default color
      }

      // Glow
      if (r > 2) {
        ctx.beginPath();
        ctx.arc(x, ny, r + 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(150, 150, 220, ${glowAlpha})`;
        ctx.fill();
      }

      // Node body — always at least 1.2px radius so it's visible
      ctx.beginPath();
      ctx.arc(x, ny, Math.max(1.2, r), 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    }

    // Count label below
    if (count > 1) {
      ctx.fillStyle = '#556677';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${count}`, x, nodeAreaTop + nodeAreaH + 10);
    }

    // Mini distribution bar + σ
    if (layer.weightData && layer.weightData.flat.length > 1) {
      const flat = layer.weightData.flat;
      const n2 = flat.length;
      let sum = 0, sumSq = 0;
      for (let i = 0; i < n2; i++) {
        const v = sanitize(flat[i]);
        sum += v;
        sumSq += v * v;
      }
      const mean = sum / n2;
      const std = Math.sqrt(Math.max(0, sumSq / n2 - mean * mean));

      const barY = graphTop + graphH - 14;
      const barW = Math.min(colW - 12, 46);
      const barH = 4;
      const barX = x - barW / 2;

      let neg = 0, zero = 0, pos = 0;
      const threshold = Math.max(std * 0.2, 0.0001);
      for (let i = 0; i < n2; i++) {
        const v = sanitize(flat[i]);
        if (v < -threshold) neg++;
        else if (v > threshold) pos++;
        else zero++;
      }

      ctx.fillStyle = 'rgba(80, 160, 255, 0.7)';
      ctx.fillRect(barX, barY, (neg / n2) * barW, barH);
      ctx.fillStyle = 'rgba(70, 70, 90, 0.5)';
      ctx.fillRect(barX + (neg / n2) * barW, barY, (zero / n2) * barW, barH);
      ctx.fillStyle = 'rgba(255, 170, 60, 0.7)';
      ctx.fillRect(barX + ((neg + zero) / n2) * barW, barY, (pos / n2) * barW, barH);

      ctx.fillStyle = '#556677';
      ctx.font = '7px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`σ${std.toFixed(3)}`, x, barY + 11);
    }
  }

  // ─── FOOTER ────────────────────────────────────────────────────

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
  ctx.fillText('σ = weight spread · thickness = strength', marginL + 400, legY + 9);

  ctx.fillStyle = '#4a5a6a';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Watch during training: nodes grow & color as patterns emerge. Thick lines = strong learned paths.', marginL, legY + 26);

  // Health
  let healthMsg = 'healthy';
  let healthColor = '#44bb77';
  for (const layer of layers) {
    if (!layer.weightData) continue;
    const flat = layer.weightData.flat;
    const n2 = flat.length;
    if (n2 === 0) continue;
    let sum = 0, sumSq = 0, deadCount = 0;
    for (let i = 0; i < n2; i++) {
      const v = sanitize(flat[i]);
      sum += v;
      sumSq += v * v;
      if (Math.abs(v) < 0.0001) deadCount++;
    }
    const mean = sum / n2;
    const std = Math.sqrt(Math.max(0, sumSq / n2 - mean * mean));
    if (deadCount / n2 > 0.7) {
      healthMsg = `⚠ ${layer.name}: ${((deadCount / n2) * 100).toFixed(0)}% dead`;
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
