/**
 * OS Nexus: Resource Allocation Lab (Experiment 6: Banker's Algorithm)
 */
import { bankersAlgorithm, resourceRequest } from '../../algorithms/bankers.js';
import { showError, renderVivaQA, renderCCode, renderTheoryAccordion, setupTabs } from '../../shared/ui.js';
import { EXPERIMENTS } from '../../data/experiments.js';
import { initResourceNetwork3D } from '../../shared/workstation-3d.js';
import { playTick, playRunSound, playSuccessSound, playFaultAlert } from '../../shared/workstation-audio.js';
import { registerCleanup } from '../../app/router.js';

let activeRes3D = null;

export function renderResourcesLab(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Resource Allocation Lab</h1>
      <p class="page-subtitle">Banker's Algorithm for Deadlock Avoidance, Safety State Evaluation, and Resource Request Granting</p>
    </div>
    <div class="info-box amber" style="margin-bottom:var(--space-4)">
      <strong>Simulation Disclaimer:</strong> This is a browser-based educational model of Dijkstra's Banker's Algorithm. It demonstrates safe state vector calculations and does not provide real operating-system kernel resource locking or live hardware deadlock prevention.
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="tab-bankers" role="tab">Banker's Algorithm</button>
      <button class="tab-btn" data-tab="tab-request" role="tab">Resource Request</button>
      <button class="tab-btn" data-tab="tab-res-theory" role="tab">Theory &amp; Code</button>
    </div>

    <!-- Banker's Tab -->
    <div class="tab-panel active" id="tab-bankers" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Safety Algorithm</h2>

        <div class="grid-2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="bk-n">Number of Processes</label>
            <input id="bk-n" class="form-input" type="number" value="5" min="1" max="10" style="max-width:120px" />
          </div>
          <div class="form-group">
            <label class="form-label required" for="bk-m">Number of Resource Types</label>
            <input id="bk-m" class="form-input" type="number" value="3" min="1" max="6" style="max-width:120px" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:var(--space-4)">
          <label class="form-label required" for="bk-available">Available Resources (comma separated)</label>
          <input id="bk-available" class="form-input" type="text" value="3,3,2" style="max-width:300px" />
          <span class="form-hint">One value per resource type, e.g. 3,3,2 for 3 resource types.</span>
        </div>

        <div class="grid-2" style="gap:var(--space-6);margin-bottom:var(--space-4)">
          <div>
            <h3 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Allocation Matrix</h3>
            <div id="bk-alloc-table"></div>
          </div>
          <div>
            <h3 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Maximum Demand Matrix</h3>
            <div id="bk-max-table"></div>
          </div>
        </div>

        <div class="row" style="gap:var(--space-3)">
          <button class="btn btn-primary" id="bk-run">▶ Run Safety Check</button>
          <button class="btn btn-secondary" id="bk-reset">Reset</button>
          <button class="btn btn-ghost" id="bk-example">Load Example (Classic 5P-3R)</button>
        </div>
      </div>
      <div id="bk-output"></div>
    </div>

    <!-- Resource Request Tab -->
    <div class="tab-panel" id="tab-request" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Resource Request Simulation</h2>
        <p class="card-subtitle" style="margin-bottom:var(--space-4)">
          Check if granting a specific resource request to a process keeps the system in a safe state.
        </p>
        <div class="info-box amber" style="margin-bottom:var(--space-4)">
          First run the Safety Algorithm above. Then enter a request here to check if it can be safely granted.
        </div>

        <div class="grid-2" style="gap:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="rq-process">Requesting Process (index, 0-based)</label>
            <input id="rq-process" class="form-input" type="number" value="1" min="0" style="max-width:120px" />
          </div>
          <div class="form-group">
            <label class="form-label required" for="rq-request">Request Vector (comma separated)</label>
            <input id="rq-request" class="form-input" type="text" value="1,0,2" style="max-width:200px" />
          </div>
        </div>

        <div class="row" style="gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-primary" id="rq-run">▶ Check Request</button>
          <button class="btn btn-ghost" id="rq-example">Load Example Request</button>
        </div>
      </div>
      <div id="rq-output"></div>
    </div>

    <!-- Theory -->
    <div class="tab-panel" id="tab-res-theory" role="tabpanel">
      <div class="card">
        <div class="exp-badge teal" style="margin-bottom:var(--space-3)">Exp 6</div>
        <div id="res-theory-6"></div>
        <div id="res-viva-6" style="margin-top:var(--space-4)"></div>
      </div>
      <div class="card" style="margin-top:var(--space-4)">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">C Source Code</h3>
        <div id="res-ccode"></div>
      </div>
    </div>
  `;

  const exp6 = EXPERIMENTS[5];
  buildMatrixTables(container, 5, 3);

  container.querySelector('#bk-n').addEventListener('change', () => rebuildMatrices(container));
  container.querySelector('#bk-m').addEventListener('change', () => rebuildMatrices(container));

  container.querySelector('#bk-run').addEventListener('click', () => runBankers(container));
  container.querySelector('#bk-reset').addEventListener('click', () => {
    buildMatrixTables(container, 5, 3);
    container.querySelector('#bk-n').value = '5';
    container.querySelector('#bk-m').value = '3';
    container.querySelector('#bk-available').value = '3,3,2';
    container.querySelector('#bk-output').innerHTML = '';
  });
  container.querySelector('#bk-example').addEventListener('click', () => loadExample(container));

  container.querySelector('#rq-run').addEventListener('click', () => runRequest(container));
  container.querySelector('#rq-example').addEventListener('click', () => {
    container.querySelector('#rq-process').value = '1';
    container.querySelector('#rq-request').value = '1,0,2';
  });

  renderTheoryAccordion(container.querySelector('#res-theory-6'), exp6);
  renderVivaQA(container.querySelector('#res-viva-6'), exp6.vivaQA);
  renderCCode(container.querySelector('#res-ccode'), exp6.cCode, 'bankers.c');
  setupTabs(container);

  registerCleanup(() => {
    if (activeRes3D?.destroy) {
      activeRes3D.destroy();
      activeRes3D = null;
    }
  });

  // Load classic example by default
  loadExample(container);
}

function rebuildMatrices(container) {
  const n = parseInt(container.querySelector('#bk-n').value, 10) || 5;
  const m = parseInt(container.querySelector('#bk-m').value, 10) || 3;
  buildMatrixTables(container, n, m);
}

function buildMatrixTables(container, n, m) {
  container.querySelector('#bk-alloc-table').innerHTML = buildMatrixHTML('alloc', n, m);
  container.querySelector('#bk-max-table').innerHTML = buildMatrixHTML('max', n, m);
}

function buildMatrixHTML(prefix, n, m) {
  const colHeaders = Array.from({ length: m }, (_, j) => `<th class="center">R${j}</th>`).join('');
  const rows = Array.from({ length: n }, (_, i) => `
    <tr>
      <td class="td-label">P${i}</td>
      ${Array.from({ length: m }, (_, j) => `<td><input type="number" value="0" min="0" class="mat-input" data-row="${i}" data-col="${j}" aria-label="${prefix} P${i} R${j}" style="width:52px;padding:4px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-family:var(--font-mono);text-align:center;font-size:var(--text-sm)" /></td>`).join('')}
    </tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr><th>P\R</th>${colHeaders}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function readMatrix(container, prefix, n, m) {
  const inputs = container.querySelectorAll(`#bk-${prefix}-table .mat-input`);
  const matrix = Array.from({ length: n }, () => Array(m).fill(0));
  inputs.forEach(inp => {
    const r = parseInt(inp.dataset.row, 10);
    const c = parseInt(inp.dataset.col, 10);
    matrix[r][c] = parseInt(inp.value, 10) || 0;
  });
  return matrix;
}

function runBankers(container) {
  const out = container.querySelector('#bk-output');
  try {
    const n = parseInt(container.querySelector('#bk-n').value, 10);
    const m = parseInt(container.querySelector('#bk-m').value, 10);
    const available = container.querySelector('#bk-available').value.split(',').map(s => parseInt(s.trim(), 10));
    if (available.length !== m) throw new Error(`Available vector must have ${m} values.`);
    if (available.some(isNaN)) throw new Error('Available vector contains invalid values.');

    const allocation = readMatrix(container, 'alloc', n, m);
    const maximum = readMatrix(container, 'max', n, m);

    const result = bankersAlgorithm(available, allocation, maximum);
    renderBankersResult(out, result, n, m);

    // Store for resource request
    container._lastResult = { available, allocation, maximum, n, m };
  } catch (e) {
    showError(out, e.message);
  }
}

function renderBankersResult(container, result, n, m) {
  playRunSound();
  const safeClass = result.safe ? 'badge-safe' : 'badge-unsafe';
  const safeText = result.safe ? 'SAFE STATE' : 'UNSAFE STATE';

  const needRows = result.need.map((row, i) => `
    <tr>
      <td class="td-label">P${i}</td>
      ${row.map(v => `<td class="center mono">${v}</td>`).join('')}
      <td class="center"><span class="badge ${result.finish[i] ? 'badge-safe' : 'badge-unsafe'}">${result.finish[i] ? 'Done' : 'Stuck'}</span></td>
    </tr>`).join('');

  const colH = Array.from({ length: m }, (_, j) => `<th class="center">R${j}</th>`).join('');

  container.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-4)">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
        <div>
          <h3 class="section-title" style="margin:0;">3D Resource Allocation Network</h3>
          <p style="font-size:var(--text-xs); color:var(--text-muted); margin:3px 0 0 0;">Process Nodes (Outer Spheres) &amp; Resource Nodes (Inner Cubes) with Safe Sequence Pulsing</p>
        </div>
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <button class="btn btn-sm btn-primary" id="net-pulse-btn">Pulse Safe Path</button>
        </div>
      </div>
      <div id="res-3d-wrap" style="height:230px; width:100%; border-radius:var(--radius-md); overflow:hidden; background:#090d16; border:1px solid var(--border-default); margin-bottom:var(--space-4);"></div>

      <div class="row-between" style="margin-bottom:var(--space-4)">
        <h3 class="section-title" style="margin-bottom:0;flex:none">Result</h3>
        <span class="badge ${safeClass}" style="font-size:var(--text-sm);padding:6px 16px">${safeText}</span>
      </div>

      ${result.safe ? `
        <div class="info-box" style="margin-bottom:var(--space-4)">
          <strong>Safe Sequence:</strong> P${result.sequence.join(' → P')}
        </div>` : `
        <div class="info-box red" style="margin-bottom:var(--space-4)">
          <strong>No safe sequence found.</strong> The system is in an unsafe state: deadlock is possible.
        </div>`}

      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Need Matrix (Max − Allocation)</h4>
      <div class="table-wrap" style="margin-bottom:var(--space-4)">
        <table>
          <thead><tr><th>Process</th>${colH}<th class="center">Finish</th></tr></thead>
          <tbody>${needRows}</tbody>
        </table>
      </div>

      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Safety Algorithm Steps</h4>
      <div class="event-log">
        ${result.steps.map(s => `<div class="log-entry"><span class="log-success">✓ P${s.process}</span><span class="log-info" style="margin-left:var(--space-2)">${s.action}</span></div>`).join('')}
        ${result.steps.length === 0 ? '<div class="log-entry"><span class="log-error">No process could be allocated. Deadlock state.</span></div>' : ''}
      </div>
    </div>`;

  const res3DWrap = container.querySelector('#res-3d-wrap');
  if (activeRes3D?.destroy) {
    activeRes3D.destroy();
    activeRes3D = null;
  }
  const res3D = initResourceNetwork3D(res3DWrap, n, m);
  activeRes3D = res3D;
  if (res3D) {
    if (result.safe) {
      res3D.highlightSafeSequence(result.sequence.map(s => `P${s}`));
      playSuccessSound();
    } else {
      res3D.markUnsafe();
      playFaultAlert();
    }
  }

  container.querySelector('#net-pulse-btn')?.addEventListener('click', () => {
    if (res3D) {
      if (result.safe) {
        res3D.resetColors();
        setTimeout(() => {
          res3D.highlightSafeSequence(result.sequence.map(s => `P${s}`));
          playSuccessSound();
        }, 100);
      } else {
        res3D.markUnsafe();
        playFaultAlert();
      }
    }
  });
}

function runRequest(container) {
  const out = container.querySelector('#rq-output');
  try {
    const stored = container._lastResult;
    if (!stored) throw new Error('Run the Safety Algorithm first to initialize system state.');

    const pi = parseInt(container.querySelector('#rq-process').value, 10);
    if (isNaN(pi) || pi < 0 || pi >= stored.n) throw new Error(`Process index must be between 0 and ${stored.n - 1}.`);

    const requestStr = container.querySelector('#rq-request').value;
    const request = requestStr.split(',').map(s => parseInt(s.trim(), 10));
    if (request.length !== stored.m) throw new Error(`Request vector must have ${stored.m} values.`);
    if (request.some(isNaN)) throw new Error('Request vector contains invalid values.');

    const result = resourceRequest(pi, request, stored.available, stored.allocation, stored.maximum);
    out.innerHTML = `
      <div class="card">
        <div class="row-between">
          <h3 class="section-title" style="flex:none;margin-bottom:0">Request for P${pi}: [${request.join(',')}]</h3>
          <span class="badge ${result.granted ? 'badge-safe' : 'badge-unsafe'}" style="font-size:var(--text-sm);padding:6px 16px">${result.granted ? 'GRANTED' : 'DENIED'}</span>
        </div>
        <div class="info-box ${result.granted ? '' : 'red'}" style="margin-top:var(--space-4)">${result.reason}</div>
      </div>`;
  } catch (e) {
    showError(out, e.message);
  }
}

// Classic 5-process, 3-resource example from Silberschatz
function loadExample(container) {
  container.querySelector('#bk-n').value = '5';
  container.querySelector('#bk-m').value = '3';
  container.querySelector('#bk-available').value = '3,3,2';
  buildMatrixTables(container, 5, 3);

  const allocData = [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]];
  const maxData  = [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]];

  ['alloc','max'].forEach((prefix, mi) => {
    const data = mi === 0 ? allocData : maxData;
    container.querySelectorAll(`#bk-${prefix}-table .mat-input`).forEach(inp => {
      const r = parseInt(inp.dataset.row, 10);
      const c = parseInt(inp.dataset.col, 10);
      inp.value = data[r][c];
    });
  });
}
