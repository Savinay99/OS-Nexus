/**
 * OS Nexus: Disk Scheduling Lab (Experiments 10 & 11)
 * High-precision Secondary Storage Head Movement & Seek Trajectory Visualizer.
 * Accurately models cylinder traversals for FCFS and SSTF algorithms with:
 * - 2D Physical Cylinder Trajectory Graph (X: Cylinder 0-199, Y: Sequential Steps)
 * - Animated Step-by-Step Actuator Head Seek with Play/Pause/Step/Reset
 * - Instant Static Trajectory Chart (Reduced-motion & exam study mode)
 * - Complete verified seek distance, direction, and cumulative metrics
 */
import { fcfsDisk, sstfDisk } from '../../algorithms/disk.js';
import { showError, renderVivaQA, renderCCode, renderTheoryAccordion, setupTabs } from '../../shared/ui.js';
import { EXPERIMENTS } from '../../data/experiments.js';
import { playTick, playRunSound, playSuccessSound } from '../../shared/workstation-audio.js';

const DEFAULT_HEAD = 50;
const DEFAULT_REQUESTS = '82,170,43,140,24,16,190';

export function renderDiskLab(container, params = {}) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Disk Scheduling</h1>
      <p class="page-subtitle">Secondary Storage Seek Optimization: Realistic cylinder head seek trajectory and movement analysis for FCFS and SSTF</p>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="tab-disk-fcfs" role="tab">FCFS</button>
      <button class="tab-btn" data-tab="tab-disk-sstf" role="tab">SSTF</button>
      <button class="tab-btn" data-tab="tab-disk-cmp" role="tab">Algorithm Comparison</button>
      <button class="tab-btn" data-tab="tab-disk-theory" role="tab">Theory &amp; C Code</button>
    </div>

    ${diskAlgoTab('disk-fcfs', 'First-Come First-Served (FCFS) Disk Scheduling', 'tab-disk-fcfs', true)}
    ${diskAlgoTab('disk-sstf', 'Shortest Seek Time First (SSTF) Disk Scheduling', 'tab-disk-sstf', false)}

    <!-- Algorithm Comparison Tab -->
    <div class="tab-panel" id="tab-disk-cmp" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4);">
        <h2 class="card-title" style="margin-bottom:var(--space-3);">FCFS vs SSTF Seek Trajectory Comparison</h2>
        <p style="font-size:var(--text-xs); color:var(--text-secondary); margin-bottom:var(--space-4);">
          Evaluate seek efficiency and total head traversals across identical cylinder request queues.
        </p>
        ${diskInputHTML('dcmp')}
        <div class="row" style="margin-top:var(--space-4); gap:var(--space-2);">
          <button class="btn btn-primary" id="dcmp-run">▶ Compare Trajectories</button>
        </div>
      </div>
      <div id="dcmp-output"></div>
    </div>

    <!-- Theory & Curriculum Tab -->
    <div class="tab-panel" id="tab-disk-theory" role="tabpanel">
      <div class="grid-2" style="gap:var(--space-4); margin-bottom:var(--space-4);">
        ${[10, 11].map(i => `
          <div class="card">
            <div class="exp-badge teal" style="margin-bottom:var(--space-3)">Experiment ${i}</div>
            <div id="disk-theory-${i}"></div>
            <div id="disk-viva-${i}" style="margin-top:var(--space-4)"></div>
          </div>`).join('')}
      </div>
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">C Source Code: Disk Scheduling Implementation</h3>
        <div id="disk-ccode"></div>
      </div>
    </div>
  `;

  setupDiskTab(container, 'disk-fcfs', fcfsDisk, 'FCFS');
  setupDiskTab(container, 'disk-sstf', sstfDisk, 'SSTF');
  setupDiskCompare(container);

  [10, 11].forEach(i => {
    const exp = EXPERIMENTS[i - 1];
    if (exp) {
      renderTheoryAccordion(container.querySelector(`#disk-theory-${i}`), exp);
      renderVivaQA(container.querySelector(`#disk-viva-${i}`), exp.vivaQA);
    }
  });

  if (EXPERIMENTS[9]) {
    renderCCode(container.querySelector('#disk-ccode'), EXPERIMENTS[9].cCode, 'disk_fcfs.c');
  }

  setupTabs(container);
}

function diskInputHTML(prefix) {
  return `
    <div class="grid-2" style="gap:var(--space-4)">
      <div class="form-group">
        <label class="form-label required" for="${prefix}-head">Initial Cylinder Head Position</label>
        <input id="${prefix}-head" class="form-input" type="number" value="${DEFAULT_HEAD}" min="0" max="999" style="max-width:160px; font-family:var(--font-mono);" />
        <span class="form-hint">Physical start track (e.g. 50).</span>
      </div>
      <div class="form-group">
        <label class="form-label required" for="${prefix}-requests">Cylinder Request Queue</label>
        <input id="${prefix}-requests" class="form-input" type="text" value="${DEFAULT_REQUESTS}" placeholder="e.g. 82, 170, 43, 140, 24, 16, 190" style="font-family:var(--font-mono);" />
        <span class="form-hint">Comma or space-separated cylinder indices (0–199).</span>
      </div>
    </div>`;
}

function diskAlgoTab(id, title, tabId, isActive) {
  return `
    <div class="tab-panel ${isActive ? 'active' : ''}" id="${tabId}" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4);">
        <h2 class="card-title" style="margin-bottom:var(--space-3);">${title}</h2>
        ${diskInputHTML(id)}
        <div class="row" style="margin-top:var(--space-4); gap:var(--space-2); flex-wrap:wrap;">
          <button class="btn btn-primary" id="${id}-run">▶ Calculate &amp; Plot Trajectory</button>
          <button class="btn btn-secondary" id="${id}-reset">↺ Reset</button>
          <button class="btn btn-ghost" id="${id}-example">Load Textbook Example</button>
        </div>
      </div>
      <div id="${id}-output"></div>
    </div>`;
}

function parseRequests(str) {
  if (!str.trim()) throw new Error('Cylinder request queue cannot be empty.');
  const parts = str.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) throw new Error('Please enter at least one cylinder request.');

  return parts.map(s => {
    const n = parseInt(s, 10);
    if (isNaN(n) || n < 0) throw new Error(`Invalid cylinder track number: "${s}". Must be a non-negative integer.`);
    return n;
  });
}

function setupDiskTab(container, id, algoFn, algoName) {
  const runBtn = container.querySelector(`#${id}-run`);
  const resetBtn = container.querySelector(`#${id}-reset`);
  const exampleBtn = container.querySelector(`#${id}-example`);

  runBtn.addEventListener('click', () => {
    runDiskSimulation(container, id, algoFn, algoName);
  });

  resetBtn.addEventListener('click', () => {
    container.querySelector(`#${id}-head`).value = String(DEFAULT_HEAD);
    container.querySelector(`#${id}-requests`).value = DEFAULT_REQUESTS;
    container.querySelector(`#${id}-output`).innerHTML = '';
  });

  exampleBtn.addEventListener('click', () => {
    container.querySelector(`#${id}-head`).value = String(DEFAULT_HEAD);
    container.querySelector(`#${id}-requests`).value = DEFAULT_REQUESTS;
    runDiskSimulation(container, id, algoFn, algoName);
  });
}

function runDiskSimulation(container, id, algoFn, algoName) {
  const out = container.querySelector(`#${id}-output`);
  try {
    const headInput = container.querySelector(`#${id}-head`).value;
    const head = parseInt(headInput, 10);
    if (isNaN(head) || head < 0) throw new Error('Initial head position must be a non-negative integer.');

    const requests = parseRequests(container.querySelector(`#${id}-requests`).value);
    const result = algoFn(head, requests);
    renderDiskTrajectory(out, result, algoName);
  } catch (e) {
    showError(out, e.message);
  }
}

/**
 * Renders the accurate 2D Cylinder Seek Trajectory Chart & Interactive Actuator Controller
 */
function renderDiskTrajectory(container, result, algoName) {
  playRunSound();

  const allCylinders = [result.headStart, ...result.order];
  const maxCyl = Math.max(199, ...allCylinders);
  const minCyl = 0;
  const cylinderSpan = maxCyl - minCyl || 1;

  // Trajectory Steps: Step 0 = start at headStart
  const steps = [
    { step: 0, cyl: result.headStart, from: null, dist: 0, dir: 'START', cum: 0 }
  ];

  let cumulative = 0;
  for (let i = 0; i < result.order.length; i++) {
    const from = i === 0 ? result.headStart : result.order[i - 1];
    const to = result.order[i];
    const dist = result.movements[i];
    cumulative += dist;
    const dir = to > from ? 'Outward (+)' : (to < from ? 'Inward (−)' : 'None');
    steps.push({ step: i + 1, cyl: to, from, dist, dir, cum: cumulative });
  }

  // SVG Chart Dimensions
  const chartW = 760;
  const padLeft = 70;
  const padRight = 40;
  const padTop = 45;
  const rowHeight = 36;
  const totalSteps = steps.length;
  const chartH = padTop + totalSteps * rowHeight + 30;
  const usableW = chartW - padLeft - padRight;

  const getX = (cyl) => padLeft + ((cyl - minCyl) / cylinderSpan) * usableW;
  const getY = (stepIdx) => padTop + stepIdx * rowHeight;

  // Build SVG path
  const points = steps.map((s, idx) => ({ x: getX(s.cyl), y: getY(idx), step: s.step, cyl: s.cyl, dist: s.dist, dir: s.dir }));
  const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  container.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-4);">
      <!-- Header with Verified Statistics -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-4);">
        <div>
          <h3 class="card-title" style="margin:0;">${algoName} Head Seek Trajectory Graph</h3>
          <p style="font-size:var(--text-xs); color:var(--text-tertiary); margin:2px 0 0 0;">
            Textbook Trajectory Plot: X-axis represents physical cylinder address (0–${maxCyl}), Y-axis advances per sequential service step
          </p>
        </div>
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <button class="btn btn-sm btn-primary" id="disk-anim-play">▶ Play Seek Animation</button>
          <button class="btn btn-sm btn-secondary" id="disk-anim-step">⏭ Step</button>
          <button class="btn btn-sm btn-secondary" id="disk-anim-reset">↺ Reset</button>
          <button class="btn btn-sm btn-ghost" id="disk-anim-toggle-mode">Show Full Path</button>
        </div>
      </div>

      <!-- Verified Metric Cards -->
      <div class="stat-grid" style="margin-bottom:var(--space-4);">
        <div class="stat-card">
          <div class="stat-label">Total Head Movement</div>
          <div class="stat-value teal">${result.total}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Physical cylinders traversed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Movement / Request</div>
          <div class="stat-value amber">${result.average.toFixed(2)}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Cylinders per serviced I/O</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Requests Serviced</div>
          <div class="stat-value">${result.order.length}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">100% Queue completion</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Initial Head Position</div>
          <div class="stat-value purple">Cyl ${result.headStart}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Start spindle coordinate</div>
        </div>
      </div>

      <!-- Trajectory Chart SVG Viewport -->
      <div style="background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius); padding:var(--space-3); overflow-x:auto; margin-bottom:var(--space-4);">
        <svg id="disk-trajectory-svg" viewBox="0 0 ${chartW} ${chartH}" style="width:100%; min-width:640px; height:auto; display:block;" aria-label="Disk head trajectory diagram">
          <defs>
            <marker id="seek-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-teal)" />
            </marker>
          </defs>

          <!-- Top Cylinder Axis Scale -->
          <line x1="${padLeft}" y1="30" x2="${padLeft + usableW}" y2="30" stroke="var(--border)" stroke-width="2" />

          ${[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, maxCyl].map(cyl => {
            const cx = getX(cyl);
            return `
              <line x1="${cx.toFixed(1)}" y1="24" x2="${cx.toFixed(1)}" y2="30" stroke="var(--border)" stroke-width="1.5" />
              <text x="${cx.toFixed(1)}" y="18" fill="var(--text-tertiary)" font-size="10" font-family="var(--font-mono)" text-anchor="middle">${cyl}</text>
              <line x1="${cx.toFixed(1)}" y1="30" x2="${cx.toFixed(1)}" y2="${chartH - 20}" stroke="var(--border-subtle)" stroke-dasharray="3,3" opacity="0.4" />
            `;
          }).join('')}

          <!-- Background Step Rows -->
          ${steps.map((s, idx) => {
            const sy = getY(idx);
            return `
              <line x1="${padLeft - 10}" y1="${sy}" x2="${chartW - padRight}" y2="${sy}" stroke="var(--border-subtle)" stroke-width="1" opacity="0.6" />
              <text x="${padLeft - 18}" y="${sy + 4}" fill="var(--text-tertiary)" font-size="10" font-family="var(--font-mono)" text-anchor="end">${idx === 0 ? 'Start' : `Step ${s.step}`}</text>
            `;
          }).join('')}

          <!-- Static Full Path Polyline -->
          <polyline id="disk-full-path" points="${polylinePoints}" fill="none" stroke="var(--accent-teal)" stroke-width="2" opacity="0.4" stroke-dasharray="4,3" />

          <!-- Active Animated Segment Polyline -->
          <polyline id="disk-active-path" points="${points[0].x},${points[0].y}" fill="none" stroke="var(--accent-teal)" stroke-width="2.5" />

          <!-- Step Point Nodes -->
          ${points.map((p, idx) => {
            const isStart = idx === 0;
            const nodeFill = isStart ? 'var(--accent-purple)' : 'var(--accent-teal)';
            return `
              <g class="disk-node-group" id="disk-node-${idx}">
                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isStart ? 6 : 5}" fill="${nodeFill}" stroke="var(--bg-primary)" stroke-width="2" />
                <rect x="${(p.x - 22).toFixed(1)}" y="${(p.y - 20).toFixed(1)}" width="44" height="14" rx="2" fill="var(--bg-elevated)" stroke="var(--border)" stroke-width="1" />
                <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" fill="var(--text-primary)" font-size="9" font-weight="600" font-family="var(--font-mono)" text-anchor="middle">Cyl ${p.cyl}</text>
              </g>
            `;
          }).join('')}

          <!-- Live Animated Actuator Head Cursor -->
          <g id="disk-head-cursor" transform="translate(${points[0].x}, ${points[0].y})">
            <circle cx="0" cy="0" r="10" fill="rgba(13, 148, 136, 0.25)" />
            <circle cx="0" cy="0" r="5" fill="var(--accent-amber)" stroke="#ffffff" stroke-width="1.5" />
          </g>
        </svg>
      </div>

      <!-- Step-by-Step Numerical Service Table -->
      <h3 class="card-title" style="margin-bottom:var(--space-2); font-size:var(--text-sm);">Sequential Seek Schedule &amp; Traversal Breakdown</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:70px;">Sequence</th>
              <th>Destination Cylinder</th>
              <th>Departed Cylinder</th>
              <th>Seek Distance</th>
              <th>Seek Direction</th>
              <th>Cumulative Movement</th>
            </tr>
          </thead>
          <tbody id="disk-schedule-tbody">
            ${steps.map((s, idx) => `
              <tr id="disk-row-${idx}" style="transition:background 0.2s ease;">
                <td style="font-family:var(--font-mono); font-weight:600;">${idx === 0 ? 'Start' : `#${s.step}`}</td>
                <td class="mono" style="font-weight:700; color:${idx === 0 ? 'var(--accent-purple)' : 'var(--accent-teal)'};">Cylinder ${s.cyl}</td>
                <td class="mono">${s.from !== null ? `Cylinder ${s.from}` : '<span style="color:var(--text-tertiary);">-</span>'}</td>
                <td class="mono" style="font-weight:600;">${s.dist > 0 ? `${s.dist} cyl` : '0'}</td>
                <td>
                  <span class="status-badge ${s.dir.includes('+') ? 'blue' : (s.dir.includes('−') ? 'amber' : 'gray')}">
                    ${s.dir}
                  </span>
                </td>
                <td class="mono" style="font-weight:700;">${s.cum} cyl</td>
              </tr>
            `).join('')}
            <tr style="font-weight:700; background:var(--bg-elevated);">
              <td colspan="3">Total Cumulative Seek</td>
              <td class="mono" style="color:var(--accent-teal); font-size:var(--text-md);">${result.total} cylinders</td>
              <td>Avg: ${result.average.toFixed(2)} cyl/req</td>
              <td class="mono" style="color:var(--accent-teal);">${result.total} cyl</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Animated Actuator Stepping Controller
  let currentStepIdx = 0;
  let animTimer = null;
  const playBtn = container.querySelector('#disk-anim-play');
  const stepBtn = container.querySelector('#disk-anim-step');
  const resetBtn = container.querySelector('#disk-anim-reset');
  const toggleBtn = container.querySelector('#disk-anim-toggle-mode');
  const activePathEl = container.querySelector('#disk-active-path');
  const headCursor = container.querySelector('#disk-head-cursor');

  function highlightRow(stepIdx) {
    for (let i = 0; i < steps.length; i++) {
      const row = container.querySelector(`#disk-row-${i}`);
      if (row) {
        if (i === stepIdx) {
          row.style.background = 'var(--bg-hover)';
          row.style.borderLeft = '3px solid var(--accent-teal)';
        } else {
          row.style.background = '';
          row.style.borderLeft = '';
        }
      }
    }
  }

  function advanceToStep(idx) {
    currentStepIdx = Math.max(0, Math.min(idx, points.length - 1));
    const activePoints = points.slice(0, currentStepIdx + 1).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    activePathEl.setAttribute('points', activePoints);

    const targetPoint = points[currentStepIdx];
    headCursor.setAttribute('transform', `translate(${targetPoint.x}, ${targetPoint.y})`);

    highlightRow(currentStepIdx);
    playTick();
  }

  function resetAnimation() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
    playBtn.textContent = '▶ Play Seek Animation';
    advanceToStep(0);
  }

  stepBtn.addEventListener('click', () => {
    if (currentStepIdx < points.length - 1) {
      advanceToStep(currentStepIdx + 1);
    } else {
      advanceToStep(0);
    }
  });

  playBtn.addEventListener('click', () => {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
      playBtn.textContent = '▶ Resume Seek';
    } else {
      if (currentStepIdx >= points.length - 1) {
        advanceToStep(0);
      }
      playBtn.textContent = '⏸ Pause Seek';
      animTimer = setInterval(() => {
        if (currentStepIdx < points.length - 1) {
          advanceToStep(currentStepIdx + 1);
        } else {
          clearInterval(animTimer);
          animTimer = null;
          playBtn.textContent = '↺ Replay Seek';
          playSuccessSound();
        }
      }, 700);
    }
  });

  resetBtn.addEventListener('click', resetAnimation);

  toggleBtn.addEventListener('click', () => {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
      playBtn.textContent = '▶ Play Seek Animation';
    }
    advanceToStep(points.length - 1);
  });

  // Start with step 0 active
  advanceToStep(0);
}

/**
 * Side-by-Side Trajectory Comparison for FCFS vs SSTF
 */
function setupDiskCompare(container) {
  const compareBtn = container.querySelector('#dcmp-run');
  if (!compareBtn) return;

  compareBtn.addEventListener('click', () => {
    const out = container.querySelector('#dcmp-output');
    try {
      const headInput = container.querySelector('#dcmp-head').value;
      const head = parseInt(headInput, 10);
      if (isNaN(head) || head < 0) throw new Error('Head position must be a non-negative integer.');

      const requests = parseRequests(container.querySelector('#dcmp-requests').value);
      const fcfsR = fcfsDisk(head, requests);
      const sstfR = sstfDisk(head, requests);

      const savedCyl = fcfsR.total - sstfR.total;
      const pctSaved = Math.round((savedCyl / Math.max(1, fcfsR.total)) * 100);

      out.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-4);">
          <h3 class="card-title" style="margin-bottom:var(--space-3);">Comparative Performance Summary</h3>
          <div class="table-wrap" style="margin-bottom:var(--space-4);">
            <table>
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th class="center">Total Head Movement</th>
                  <th class="center">Average / Request</th>
                  <th>Service Trajectory Order</th>
                  <th class="center">Efficiency Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="td-label">FCFS (First-Come First-Served)</td>
                  <td class="center mono" style="font-weight:700;">${fcfsR.total} cyl</td>
                  <td class="center mono">${fcfsR.average.toFixed(2)} cyl</td>
                  <td class="mono" style="font-size:var(--text-xs);">${fcfsR.order.join(' → ')}</td>
                  <td class="center"><span class="status-badge gray">Baseline</span></td>
                </tr>
                <tr>
                  <td class="td-label" style="color:var(--accent-teal);">SSTF (Shortest Seek Time First)</td>
                  <td class="center mono" style="font-weight:700; color:var(--accent-emerald); font-size:var(--text-md);">${sstfR.total} cyl</td>
                  <td class="center mono" style="color:var(--accent-emerald);">${sstfR.average.toFixed(2)} cyl</td>
                  <td class="mono" style="font-size:var(--text-xs);">${sstfR.order.join(' → ')}</td>
                  <td class="center"><span class="status-badge green">${pctSaved > 0 ? `+${pctSaved}% More Efficient` : 'Optimal'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="info-box ${savedCyl > 0 ? '' : 'amber'}">
            ${savedCyl > 0
              ? `<strong>SSTF Optimization Advantage:</strong> SSTF eliminates unnecessary back-and-forth arm traversals, saving <strong>${savedCyl} cylinder seeks (${pctSaved}%)</strong> compared to FCFS on this request queue.`
              : `Both algorithms produced identical head movement for this workload.`}
          </div>
        </div>
      `;
      playSuccessSound();
    } catch (e) {
      showError(out, e.message);
    }
  });
}
