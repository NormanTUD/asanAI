/**
 * Renders a radial "neural organism" visualization of a TF.js model's weights.
 * @param {tf.LayersModel} _m - A TensorFlow.js model
 * @param {HTMLElement|string|null} targetDiv - Div element, ID string, or null (appends to body)
 */
function visualizeModelOrganism(_m, targetDiv) {
  // ─── Resolve target container ───────────────────────────────────
  let container;
  if (typeof targetDiv === 'string') {
    container = document.getElementById(targetDiv);
    if (!container) {
      console.warn(`[visualizeModelOrganism] Element with id "${targetDiv}" not found, appending to body.`);
      container = document.body;
    }
  } else if (targetDiv && targetDiv.appendChild) {
    container = targetDiv;
  } else {
    container = document.body;
  }

  // Clear previous render so repeated calls update instead of stacking
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

  // ─── Extract weights from model ────────────────────────────────
  const weightEntries = [];
  const layerInfos = [];

  for (let li = 0; li < _m.layers.length; li++) {
    const layer = _m.layers[li];
    let layerWeights;
    try {
      layerWeights = layer.getWeights();
    } catch (e) {
      continue;
    }
    const layerName = layer.name || `layer_${li}`;
    const layerType = layer.getClassName ? layer.getClassName() : 'Unknown';

    if (!layerWeights || layerWeights.length === 0) {
      layerInfos.push({ name: layerName, type: layerType, hasWeights: false });
      continue;
    }

    for (let wi = 0; wi < layerWeights.length; wi++) {
      let data;
      try {
        data = layerWeights[wi].arraySync();
      } catch (e) {
        continue;
      }
      if (!data || (Array.isArray(data) && data.length === 0)) continue;

      const shape = Array.isArray(data) ? getShape(data) : [1];
      const flat = Array.isArray(data) ? flatten(data) : [data];

      if (flat.length === 0) continue;

      weightEntries.push({
        layerIndex: li,
        weightIndex: wi,
        layerName: layerName,
        layerType: layerType,
        shape: shape,
        flat: flat
      });
    }
    layerInfos.push({ name: layerName, type: layerType, hasWeights: true });
  }

  const numKernels = weightEntries.length;
  if (numKernels === 0) {
    console.warn('[visualizeModelOrganism] No weights found in model.');
    container.innerHTML = '<p style="color:#888;font-family:monospace;">No weight tensors found in model.</p>';
    return null;
  }

  // ─── Canvas Setup ──────────────────────────────────────────────
  const canvasW = 750;
  const canvasH = 750;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  canvas.style.background = '#020208';
  canvas.style.borderRadius = '8px';
  canvas.style.display = 'block';
  canvas.style.maxWidth = '100%';

  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cxCenter = canvasW / 2;
  const cyCenter = canvasH / 2;

  // ─── Background ────────────────────────────────────────────────
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Subtle radial depth
  for (let r = 375; r > 0; r -= 5) {
    const alpha = 0.01 + ((375 - r) / 375) * 0.03;
    ctx.beginPath();
    ctx.arc(cxCenter, cyCenter, r, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(20, 10, 50, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  // ─── Compute layer statistics ──────────────────────────────────
  const layerStats = weightEntries.map(wd => {
    const flat = wd.flat;
    const n = flat.length;
    let sum = 0, sumSq = 0, mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) {
      const v = flat[i];
      sum += v;
      sumSq += v * v;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const std = Math.sqrt(Math.max(0, variance));
    const energy = sumSq / n;
    let sparseCount = 0;
    const threshold = std * 0.1;
    for (let i = 0; i < n; i++) {
      if (Math.abs(flat[i]) < threshold) sparseCount++;
    }
    const sparsity = sparseCount / n;
    return { mean, std, min: mn, max: mx, energy, sparsity, n };
  });

  const maxEnergy = Math.max(...layerStats.map(s => s.energy), 1e-10);

  // ─── Draw layers as concentric organism rings ──────────────────
  const ringGap = Math.min(280 / Math.max(numKernels, 1), 40);
  const baseRadius = 60;

  for (let idx = 0; idx < numKernels; idx++) {
    const wd = weightEntries[idx];
    const stats = layerStats[idx];
    const flat = wd.flat;
    const radius = baseRadius + idx * ringGap;
    const energyRatio = stats.energy / maxEnergy;

    // Number of nodes on ring
    let numNodes = Math.min(Math.floor(Math.sqrt(stats.n)), 90);
    numNodes = Math.max(numNodes, 12);

    // Sample weights
    const step = Math.max(1, Math.floor(flat.length / numNodes));
    const sampled = [];
    for (let i = 0; i < numNodes && i * step < flat.length; i++) {
      sampled.push(flat[i * step]);
    }
    numNodes = sampled.length;
    if (numNodes === 0) continue;

    const sMn = Math.min(...sampled);
    const sMx = Math.max(...sampled);
    const sRng = sMx - sMn || 1;

    // Ring backbone
    ctx.beginPath();
    ctx.arc(cxCenter, cyCenter, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(60, 40, 120, ${0.15 + energyRatio * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw neuron nodes
    for (let ni = 0; ni < numNodes; ni++) {
      const angle = (ni / numNodes) * 2 * Math.PI - Math.PI / 2;
      const nx = cxCenter + Math.cos(angle) * radius;
      const ny = cyCenter + Math.sin(angle) * radius;
      const val = sampled[ni];
      const t = (val - sMn) / sRng;
      const nodeR = 1.5 + t * 4;

      let r, g, b;
      if (val < 0) {
        const intensity = Math.abs(val - sMn) / sRng;
        r = 20;
        g = Math.floor(80 + intensity * 150);
        b = Math.floor(180 + intensity * 75);
      } else {
        const intensity = (val - sMn) / sRng;
        r = Math.floor(180 + intensity * 75);
        g = Math.floor(40 + intensity * 60);
        b = Math.floor(Math.max(0, 80 - intensity * 40));
      }

      // Glow
      ctx.beginPath();
      ctx.arc(nx, ny, nodeR + 3, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
      ctx.fill();

      // Node
      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
    }

    // ─── Dendrite connections to next ring ───────────────────────
    if (idx < numKernels - 1) {
      const nextRadius = baseRadius + (idx + 1) * ringGap;
      let nextNodes = Math.min(Math.floor(Math.sqrt(layerStats[idx + 1].n)), 90);
      nextNodes = Math.max(nextNodes, 12);

      const numConnections = Math.min(numNodes, nextNodes, 20);

      // Sort by absolute value descending
      const sortedIndices = sampled
        .map((v, i) => ({ i, abs: Math.abs(v) }))
        .sort((a, b) => b.abs - a.abs)
        .map(x => x.i);

      for (let ci = 0; ci < Math.min(numConnections, sortedIndices.length); ci++) {
        const si = sortedIndices[ci];
        const angleFrom = (si / numNodes) * 2 * Math.PI - Math.PI / 2;
        const angleTo = (ci / numConnections) * 2 * Math.PI - Math.PI / 2;

        const x1 = cxCenter + Math.cos(angleFrom) * radius;
        const y1 = cyCenter + Math.sin(angleFrom) * radius;
        const x2 = cxCenter + Math.cos(angleTo) * nextRadius;
        const y2 = cyCenter + Math.sin(angleTo) * nextRadius;

        // Curved control point
        const ctrlR = (radius + nextRadius) / 2 + 10;
        const ctrlAngle = (angleFrom + angleTo) / 2;
        const cpx = cxCenter + Math.cos(ctrlAngle) * ctrlR * 0.85;
        const cpy = cyCenter + Math.sin(ctrlAngle) * ctrlR * 0.85;

        const strength = Math.abs(sampled[si]) / (Math.abs(sMx) + 0.0001);
        const alpha = 0.05 + strength * 0.2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.strokeStyle = `rgba(140, 80, 255, ${alpha})`;
        ctx.lineWidth = 0.5 + strength * 1.5;
        ctx.stroke();
      }
    }
  }

  // ─── Core: energy center ───────────────────────────────────────
  const totalEnergy = layerStats.reduce((s, l) => s + l.energy, 0);
  const avgSparsity = layerStats.reduce((s, l) => s + l.sparsity, 0) / numKernels;

  for (let r = 30; r > 0; r -= 3) {
    const alpha = ((30 - r) / 30) * 0.6;
    const hueShift = r * 4;
    ctx.beginPath();
    ctx.arc(cxCenter, cyCenter, r, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(${260 + hueShift}, 80%, ${30 + r}%, ${alpha})`;
    ctx.fill();
  }

  ctx.fillStyle = '#e0d0ff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`E=${totalEnergy.toFixed(4)}`, cxCenter, cyCenter - 5);
  ctx.fillStyle = '#aa88dd';
  ctx.font = '9px monospace';
  ctx.fillText(`S=${(avgSparsity * 100).toFixed(1)}%`, cxCenter, cyCenter + 8);

  // ─── Outer sparsity band ───────────────────────────────────────
  const outerR = baseRadius + numKernels * ringGap + 25;
  for (let idx = 0; idx < numKernels; idx++) {
    const stats = layerStats[idx];
    const arcStart = (idx / numKernels) * 2 * Math.PI - Math.PI / 2;
    const arcEnd = ((idx + 1) / numKernels) * 2 * Math.PI - Math.PI / 2;
    const gap = 0.02;

    const brightness = 1.0 - stats.sparsity;
    const hue = 260 + Math.floor((stats.energy / maxEnergy) * 60);

    ctx.beginPath();
    ctx.arc(cxCenter, cyCenter, outerR, arcStart + gap, arcEnd - gap);
    ctx.strokeStyle = `hsla(${hue}, 70%, ${20 + Math.floor(brightness * 50)}%, ${0.3 + brightness * 0.6})`;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Layer label
    const midAngle = (arcStart + arcEnd) / 2;
    const tx = cxCenter + Math.cos(midAngle) * (outerR + 18);
    const ty = cyCenter + Math.sin(midAngle) * (outerR + 18);
    ctx.fillStyle = `rgba(200, 180, 255, ${0.4 + brightness * 0.4})`;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`L${weightEntries[idx].layerIndex}`, tx, ty + 3);
  }

  // ─── Annotations ───────────────────────────────────────────────
  ctx.fillStyle = '#5544aa';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOPOLOGY:', 15, 20);
  ctx.fillStyle = '#8877cc';
  ctx.fillText(`  rings = weight tensors (${numKernels})`, 15, 34);
  ctx.fillText('  nodes = sampled weights (size=magnitude)', 15, 48);
  ctx.fillText('  arcs = strongest weight connections', 15, 62);
  ctx.fillText('  outer band = sparsity per tensor', 15, 76);

  // Insights
  const maxEIdx = layerStats.reduce((best, s, i) => s.energy > layerStats[best].energy ? i : best, 0);
  const minEIdx = layerStats.reduce((best, s, i) => s.energy < layerStats[best].energy ? i : best, 0);
  const mostSparse = layerStats.reduce((best, s, i) => s.sparsity > layerStats[best].sparsity ? i : best, 0);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#5544aa';
  ctx.fillText('INSIGHT:', canvasW - 15, 20);
  ctx.fillStyle = '#8877cc';
  ctx.fillText(`highest energy: ${weightEntries[maxEIdx].layerName} (${layerStats[maxEIdx].energy.toFixed(5)})`, canvasW - 15, 34);
  ctx.fillText(`lowest energy: ${weightEntries[minEIdx].layerName} (${layerStats[minEIdx].energy.toFixed(5)})`, canvasW - 15, 48);
  ctx.fillText(`most sparse: ${weightEntries[mostSparse].layerName} (${(layerStats[mostSparse].sparsity * 100).toFixed(1)}% near-zero)`, canvasW - 15, 62);
  ctx.fillText(`total params: ${layerStats.reduce((s, l) => s + l.n, 0).toLocaleString()}`, canvasW - 15, 76);

  // Color key
  ctx.fillStyle = '#00ccaa';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('cyan = negative | warm = positive | core E = L2 energy | S = sparsity', canvasW / 2, canvasH - 12);

  // ─── Layer list (bottom-left) ──────────────────────────────────
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  const listY = canvasH - 14 - Math.min(numKernels, 10) * 12;
  const showCount = Math.min(numKernels, 10);
  for (let i = 0; i < showCount; i++) {
    const wd = weightEntries[i];
    const shapeStr = wd.shape.join('x');
    ctx.fillStyle = `hsla(${(i * 45 + 140) % 360}, 60%, 60%, 0.8)`;
    ctx.fillText(`■ L${wd.layerIndex} ${wd.layerType} [${shapeStr}]`, 15, listY + i * 12);
  }
  if (numKernels > 10) {
    ctx.fillStyle = '#555';
    ctx.fillText(`  ...and ${numKernels - 10} more`, 15, listY + showCount * 12);
  }

  console.log(`[visualizeModelOrganism] Rendered ${numKernels} weight tensors, ${layerStats.reduce((s, l) => s + l.n, 0).toLocaleString()} total params`);
  return canvas;
}
