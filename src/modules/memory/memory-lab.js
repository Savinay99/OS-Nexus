/**
 * OS Nexus: Memory Lab (Page Replacement, Contiguous Allocation & Paging)
 * Experiments 7, 8, 9 & Memory Management Subsystem
 */
import {
  fifoPageReplacement,
  lruPageReplacement,
  optimalPageReplacement,
  firstFit,
  bestFit,
  worstFit,
  translateAddress
} from '../../algorithms/memory.js';
import {
  parseRefString,
  renderPageTable,
  showError,
  renderVivaQA,
  renderCCode,
  renderTheoryAccordion,
  setupTabs,
  escapeHtml
} from '../../shared/ui.js';
import { EXPERIMENTS } from '../../data/experiments.js';
import { initMemoryCube3D } from '../../shared/workstation-3d.js';
import { playTick, playRunSound, playSuccessSound, playFaultAlert } from '../../shared/workstation-audio.js';
import { registerCleanup } from '../../app/router.js';

let activeMemPlayInterval = null;

const DEFAULT_REF = '7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0';
const DEFAULT_FRAMES = 3;

export function renderMemoryLab(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Memory Management</h1>
      <p class="page-subtitle">Virtual Memory Page Replacement (FIFO, LRU, Optimal), Contiguous Partition Allocation &amp; Hardware MMU Translation</p>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="tab-fifo" role="tab">FIFO</button>
      <button class="tab-btn" data-tab="tab-lru" role="tab">LRU</button>
      <button class="tab-btn" data-tab="tab-optimal" role="tab">Optimal</button>
      <button class="tab-btn" data-tab="tab-memcmp" role="tab">Compare Replacement</button>
      <button class="tab-btn" data-tab="tab-contiguous" role="tab">Contiguous Allocation</button>
      <button class="tab-btn" data-tab="tab-paging" role="tab">Paging &amp; Address Translation</button>
      <button class="tab-btn" data-tab="tab-memtheory" role="tab">Theory &amp; Code</button>
    </div>

    ${pageAlgoTab('fifo', 'FIFO: First In First Out', 'tab-fifo', true)}
    ${pageAlgoTab('lru', 'LRU: Least Recently Used', 'tab-lru', false)}
    ${pageAlgoTab('optimal', 'Optimal: Belady\'s OPT', 'tab-optimal', false)}

    <!-- Compare Tab -->
    <div class="tab-panel" id="tab-memcmp" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Algorithm Comparison</h2>
        ${refInputHTML('cmp')}
        <button class="btn btn-primary" id="cmp-mem-run" style="margin-top:var(--space-4)">▶ Compare All</button>
      </div>
      <div id="cmp-mem-output"></div>
    </div>

    <!-- Contiguous Allocation Tab -->
    <div class="tab-panel" id="tab-contiguous" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-2)">Contiguous Memory Allocation Simulator</h2>
        <p class="form-hint" style="margin-bottom:var(--space-4)">
          Simulate how fixed variable-sized memory blocks are allocated to incoming processes using First Fit, Best Fit, and Worst Fit algorithms.
        </p>
        <div class="grid-2" style="gap:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="alloc-blocks">Memory Block Sizes (KB, comma-separated)</label>
            <input id="alloc-blocks" class="form-input" type="text" value="100, 500, 200, 300, 600" aria-required="true" />
            <span class="form-hint">Physical memory hole partitions available in RAM.</span>
          </div>
          <div class="form-group">
            <label class="form-label required" for="alloc-processes">Process Memory Demands (KB, comma-separated)</label>
            <input id="alloc-processes" class="form-input" type="text" value="212, 417, 112, 426" aria-required="true" />
            <span class="form-hint">Memory required by processes P1, P2, P3, P4 in arrival sequence.</span>
          </div>
        </div>

        <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
          <button class="btn btn-primary" id="btn-run-firstfit">Run First Fit</button>
          <button class="btn btn-secondary" id="btn-run-bestfit">Run Best Fit</button>
          <button class="btn btn-secondary" id="btn-run-worstfit">Run Worst Fit</button>
          <button class="btn btn-amber" id="btn-run-allfit">Compare All Three</button>
          <button class="btn btn-ghost" id="btn-reset-fit">Reset</button>
        </div>
      </div>
      <div id="contiguous-output"></div>
    </div>

    <!-- Paging & Address Translation Tab -->
    <div class="tab-panel" id="tab-paging" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-2)">Hardware Paging &amp; Address Translation MMU</h2>
        <p class="form-hint" style="margin-bottom:var(--space-4)">
          Simulate the Memory Management Unit (MMU) translating virtual/logical addresses to physical memory addresses via the Page Table.
        </p>
        <div class="grid-3" style="gap:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="page-size-select">Page / Frame Size</label>
            <select id="page-size-select" class="form-select">
              <option value="1024">1 KB (1024 bytes)</option>
              <option value="2048">2 KB (2048 bytes)</option>
              <option value="4096" selected>4 KB (4096 bytes)</option>
              <option value="8192">8 KB (8192 bytes)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required" for="logical-address-input">Logical (Virtual) Address (Bytes)</label>
            <input id="logical-address-input" class="form-input" type="number" min="0" value="13318" />
            <span class="form-hint">e.g. 13318 = Page 3, Offset 1030 (with 4KB pages)</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="page-table-input">Page Table Mapping (Page:Frame, comma-separated)</label>
            <input id="page-table-input" class="form-input" type="text" value="0:5, 1:6, 2:1, 3:2, 4:8" />
            <span class="form-hint">Format: 0:5, 1:6 means Page 0 is in Frame 5, etc.</span>
          </div>
        </div>

        <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
          <button class="btn btn-primary" id="btn-translate-addr">▶ Translate Address</button>
          <button class="btn btn-ghost" id="btn-sample-addr">Load Example Fault</button>
        </div>
      </div>
      <div id="paging-output"></div>
    </div>

    <!-- Theory Tab -->
    <div class="tab-panel" id="tab-memtheory" role="tabpanel">
      <div class="grid-3">
        ${[7,8,9].map(i => `
          <div class="card">
            <div class="exp-badge teal" style="margin-bottom:var(--space-3)">Exp ${i}</div>
            <div id="mem-theory-${i}"></div>
            <div id="mem-viva-${i}" style="margin-top:var(--space-4)"></div>
          </div>`).join('')}
      </div>
      <div class="card" style="margin-top:var(--space-4)">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">C Source Code: FIFO Page Replacement</h3>
        <div id="mem-ccode"></div>
      </div>
    </div>
  `;

  // Setup each page replacement tab
  setupPageTab(container, 'fifo', fifoPageReplacement);
  setupPageTab(container, 'lru', lruPageReplacement);
  setupPageTab(container, 'optimal', optimalPageReplacement);
  setupCompareTab(container);

  // Setup Contiguous Allocation
  setupContiguousAllocation(container);

  // Setup Paging Address Translation
  setupPagingTranslation(container);

  // Theory
  [7,8,9].forEach(i => {
    const exp = EXPERIMENTS[i - 1];
    renderTheoryAccordion(container.querySelector(`#mem-theory-${i}`), exp);
    renderVivaQA(container.querySelector(`#mem-viva-${i}`), exp.vivaQA);
  });
  setupTabs(container);

  registerCleanup(() => {
    if (activeMemPlayInterval) {
      clearInterval(activeMemPlayInterval);
      activeMemPlayInterval = null;
    }
  });
}

function refInputHTML(prefix) {
  return `
    <div class="grid-2" style="gap:var(--space-4)">
      <div class="form-group">
        <label class="form-label required" for="${prefix}-refstr">Page Reference String (comma or space separated)</label>
        <input id="${prefix}-refstr" class="form-input" type="text" value="${DEFAULT_REF}"
          aria-required="true" placeholder="e.g. 7,0,1,2,0,3" />
        <span class="form-hint">Integers ≥ 0 separated by commas or spaces.</span>
      </div>
      <div class="form-group">
        <label class="form-label required" for="${prefix}-frames">Number of Frames</label>
        <input id="${prefix}-frames" class="form-input" type="number" value="${DEFAULT_FRAMES}" min="1" max="20"
          aria-required="true" style="max-width:120px" />
      </div>
    </div>`;
}

function pageAlgoTab(id, title, tabId, isActive) {
  return `
    <div class="tab-panel ${isActive ? 'active' : ''}" id="${tabId}" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">${title}</h2>
        ${refInputHTML(id)}
        <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
          <button class="btn btn-primary" id="${id}-run">▶ Run</button>
          <button class="btn btn-secondary" id="${id}-reset">Reset</button>
          <button class="btn btn-ghost" id="${id}-example">Load Example</button>
        </div>
      </div>
      <div id="${id}-output"></div>
    </div>`;
}

function setupPageTab(container, id, algoFn) {
  container.querySelector(`#${id}-run`).addEventListener('click', () => {
    runPageAlgo(container, id, algoFn);
  });
  container.querySelector(`#${id}-reset`).addEventListener('click', () => {
    container.querySelector(`#${id}-refstr`).value = DEFAULT_REF;
    container.querySelector(`#${id}-frames`).value = String(DEFAULT_FRAMES);
    container.querySelector(`#${id}-output`).innerHTML = '';
  });
  container.querySelector(`#${id}-example`).addEventListener('click', () => {
    container.querySelector(`#${id}-refstr`).value = DEFAULT_REF;
    container.querySelector(`#${id}-frames`).value = String(DEFAULT_FRAMES);
    runPageAlgo(container, id, algoFn);
  });
}

function runPageAlgo(container, id, algoFn) {
  const out = container.querySelector(`#${id}-output`);
  try {
    const refStr = parseRefString(container.querySelector(`#${id}-refstr`).value);
    const frames = parseInt(container.querySelector(`#${id}-frames`).value, 10);
    if (isNaN(frames) || frames < 1) throw new Error('Frames must be a positive integer.');

    const result = algoFn(refStr, frames);
    renderPageResult(out, result, frames, refStr);
  } catch (e) {
    showError(out, e.message);
  }
}

function renderPageResult(container, result, frames, refString = []) {
  playRunSound();
  container.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-4)">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
        <div>
          <h3 class="section-title" style="margin:0;">Physical Memory Frame Architecture</h3>
          <p style="font-size:var(--text-xs); color:var(--text-muted); margin:3px 0 0 0;">Hardware Paging Model: Live page reference stream mapping to physical RAM frame sockets</p>
        </div>
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <button class="btn btn-sm btn-secondary" id="mem-step-btn">Step Memory</button>
          <button class="btn btn-sm btn-primary" id="mem-play-btn">Auto-Simulate</button>
          <button class="btn btn-sm btn-ghost" id="mem-reset-btn">Reset</button>
        </div>
      </div>
      <div id="memory-3d-wrap" style="height:240px; width:100%; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-primary); border:1px solid var(--border); margin-bottom:var(--space-4);"></div>

      <div class="stat-grid" style="margin-bottom:var(--space-4)">
        <div class="stat-card"><div class="stat-label">Page Faults</div><div class="stat-value red">${result.faults}</div></div>
        <div class="stat-card"><div class="stat-label">Page Hits</div><div class="stat-value green">${result.hits}</div></div>
        <div class="stat-card"><div class="stat-label">Hit Ratio</div><div class="stat-value teal">${(result.hitRatio * 100).toFixed(1)}%</div></div>
        <div class="stat-card"><div class="stat-label">Fault Ratio</div><div class="stat-value amber">${(result.faultRatio * 100).toFixed(1)}%</div></div>
      </div>
      <h3 class="section-title">Step-by-Step Frame State</h3>
      <div id="page-step-table"></div>
    </div>`;

  const mem3DWrap = container.querySelector('#memory-3d-wrap');
  const mem3D = initMemoryCube3D(mem3DWrap, frames, result.steps, refString);

  let currentStepIdx = 0;
  if (activeMemPlayInterval) {
    clearInterval(activeMemPlayInterval);
    activeMemPlayInterval = null;
  }

  if (mem3D && result.steps && result.steps.length) {
    mem3D.updateStep(result.steps[0], 0, result.steps.length, refString);
  }

  const stepMemory = () => {
    if (!mem3D || !result.steps || !result.steps.length) return;
    if (currentStepIdx >= result.steps.length) {
      currentStepIdx = 0;
      mem3D.reset();
    }
    const step = result.steps[currentStepIdx];
    mem3D.updateStep(step, currentStepIdx, result.steps.length, refString);
    if (step.hit) {
      playSuccessSound();
    } else {
      playFaultAlert();
    }
    currentStepIdx++;
  };

  container.querySelector('#mem-step-btn').addEventListener('click', stepMemory);

  container.querySelector('#mem-play-btn').addEventListener('click', (e) => {
    if (activeMemPlayInterval) {
      clearInterval(activeMemPlayInterval);
      activeMemPlayInterval = null;
      e.target.textContent = 'Auto-Simulate';
    } else {
      e.target.textContent = 'Pause';
      activeMemPlayInterval = setInterval(() => {
        if (currentStepIdx >= result.steps.length) {
          clearInterval(activeMemPlayInterval);
          activeMemPlayInterval = null;
          e.target.textContent = 'Replay';
          playSuccessSound();
        } else {
          stepMemory();
        }
      }, 900);
    }
  });

  container.querySelector('#mem-reset-btn').addEventListener('click', () => {
    if (activeMemPlayInterval) {
      clearInterval(activeMemPlayInterval);
      activeMemPlayInterval = null;
      container.querySelector('#mem-play-btn').textContent = 'Auto-Simulate';
    }
    currentStepIdx = 0;
    if (mem3D) mem3D.reset();
  });

  renderPageTable(container.querySelector('#page-step-table'), result.steps, frames);
}

function setupCompareTab(container) {
  container.querySelector('#cmp-mem-run').addEventListener('click', () => {
    const out = container.querySelector('#cmp-mem-output');
    try {
      const refStr = parseRefString(container.querySelector('#cmp-refstr').value);
      const frames = parseInt(container.querySelector('#cmp-frames').value, 10);
      if (isNaN(frames) || frames < 1) throw new Error('Frames must be a positive integer.');

      const results = {
        FIFO: fifoPageReplacement(refStr, frames),
        LRU: lruPageReplacement(refStr, frames),
        Optimal: optimalPageReplacement(refStr, frames),
      };

      out.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-4)">
          <h3 class="section-title">Comparison Summary</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Algorithm</th><th class="center">Faults</th><th class="center">Hits</th><th class="center">Hit Ratio</th><th class="center">Fault Ratio</th></tr></thead>
              <tbody>
                ${Object.entries(results).map(([name, r]) => {
                  const bestFaults = Math.min(...Object.values(results).map(x => x.faults));
                  const isBest = r.faults === bestFaults;
                  return `<tr>
                    <td class="td-label">${name}</td>
                    <td class="center" style="${isBest?'color:var(--accent-green);font-weight:600':''}">${r.faults}</td>
                    <td class="center">${r.hits}</td>
                    <td class="center">${(r.hitRatio*100).toFixed(1)}%</td>
                    <td class="center">${(r.faultRatio*100).toFixed(1)}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <p class="form-hint" style="margin-top:var(--space-3)">✓ Best (fewest faults) highlighted in green</p>
        </div>`;
    } catch (e) {
      showError(out, e.message);
    }
  });
}

function parseNumberList(str) {
  return str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(s => {
    const n = parseInt(s, 10);
    if (isNaN(n) || n <= 0) throw new Error(`Invalid positive integer "${s}".`);
    return n;
  });
}

function setupContiguousAllocation(container) {
  const out = container.querySelector('#contiguous-output');

  function runAlloc(algoName, algoFn) {
    try {
      const blocks = parseNumberList(container.querySelector('#alloc-blocks').value);
      const processes = parseNumberList(container.querySelector('#alloc-processes').value);
      const res = algoFn(blocks, processes);
      renderAllocResult(out, algoName, res);
    } catch (err) {
      showError(out, err.message);
    }
  }

  container.querySelector('#btn-run-firstfit').addEventListener('click', () => runAlloc('First Fit', firstFit));
  container.querySelector('#btn-run-bestfit').addEventListener('click', () => runAlloc('Best Fit', bestFit));
  container.querySelector('#btn-run-worstfit').addEventListener('click', () => runAlloc('Worst Fit', worstFit));

  container.querySelector('#btn-run-allfit').addEventListener('click', () => {
    try {
      const blocks = parseNumberList(container.querySelector('#alloc-blocks').value);
      const processes = parseNumberList(container.querySelector('#alloc-processes').value);
      const r1 = firstFit(blocks, processes);
      const r2 = bestFit(blocks, processes);
      const r3 = worstFit(blocks, processes);

      out.innerHTML = `
        <div class="grid-3" style="gap:var(--space-4);margin-bottom:var(--space-4)">
          <div class="card">${allocCardHTML('First Fit', r1)}</div>
          <div class="card">${allocCardHTML('Best Fit', r2)}</div>
          <div class="card">${allocCardHTML('Worst Fit', r3)}</div>
        </div>
      `;
    } catch (err) {
      showError(out, err.message);
    }
  });

  container.querySelector('#btn-reset-fit').addEventListener('click', () => {
    container.querySelector('#alloc-blocks').value = '100, 500, 200, 300, 600';
    container.querySelector('#alloc-processes').value = '212, 417, 112, 426';
    out.innerHTML = '';
  });
}

function allocCardHTML(title, res) {
  const totalFrag = res.allocation.reduce((sum, a) => sum + (a.frag || 0), 0);
  const unallocated = res.allocation.filter(a => !a.success).length;

  return `
    <h3 class="card-title" style="margin-bottom:var(--space-3)">${title}</h3>
    <div style="font-size:var(--text-xs);margin-bottom:var(--space-3);color:var(--text-secondary)">
      Total Internal Frag: <strong style="color:var(--accent-amber)">${totalFrag} KB</strong> |
      Unallocated: <strong style="color:${unallocated > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${unallocated}</strong>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Process</th><th>Size</th><th>Block</th><th>Frag</th></tr></thead>
        <tbody>
          ${res.allocation.map(a => `
            <tr>
              <td class="td-label">${a.process}</td>
              <td>${a.pSize} KB</td>
              <td>${a.success ? `Block ${a.blockId + 1} (${a.blockSize}KB)` : '<span class="status-badge red">Not Allocated</span>'}</td>
              <td>${a.success ? `${a.frag} KB` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAllocResult(container, algoName, res) {
  const totalFrag = res.allocation.reduce((sum, a) => sum + (a.frag || 0), 0);
  const unallocated = res.allocation.filter(a => !a.success).length;

  container.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-4)">
      <div class="stat-grid" style="margin-bottom:var(--space-4)">
        <div class="stat-card"><div class="stat-label">Algorithm</div><div class="stat-value teal">${algoName}</div></div>
        <div class="stat-card"><div class="stat-label">Allocated</div><div class="stat-value green">${res.allocation.length - unallocated} / ${res.allocation.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Internal Frag</div><div class="stat-value amber">${totalFrag} KB</div></div>
        <div class="stat-card"><div class="stat-label">Unallocated Processes</div><div class="stat-value ${unallocated > 0 ? 'red' : 'green'}">${unallocated}</div></div>
      </div>

      <h3 class="section-title">Memory Partitions Allocation Map</h3>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4)">
        ${res.blocks.map(b => `
          <div style="flex:1;min-width:110px;background:var(--bg-elevated);border:1px solid ${b.allocatedTo ? 'var(--accent-teal)' : 'var(--border)'};border-radius:var(--radius);padding:var(--space-3);text-align:center;">
            <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Block ${b.id + 1} (${b.initialSize} KB)</div>
            ${b.allocatedTo ? `
              <div style="font-weight:700;color:var(--accent-teal);margin:4px 0">${b.allocatedTo} (${b.used} KB)</div>
              <div style="font-size:10px;color:var(--accent-amber)">Frag: ${b.internalFrag} KB</div>
            ` : `
              <div style="color:var(--text-tertiary);margin:4px 0;font-size:var(--text-xs)">Free</div>
              <div style="font-size:10px;color:var(--text-tertiary)">100% available</div>
            `}
          </div>
        `).join('')}
      </div>

      <h3 class="section-title">Allocation Table</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Process</th><th>Process Size</th><th>Block Allocated</th><th>Block Capacity</th><th>Internal Fragmentation</th><th>Status</th></tr></thead>
          <tbody>
            ${res.allocation.map(a => `
              <tr>
                <td class="td-label">${a.process}</td>
                <td>${a.pSize} KB</td>
                <td>${a.success ? `Block ${a.blockId + 1}` : 'None'}</td>
                <td>${a.success ? `${a.blockSize} KB` : '-'}</td>
                <td>${a.success ? `${a.frag} KB` : '-'}</td>
                <td>${a.success ? '<span class="status-badge green">Allocated</span>' : '<span class="status-badge red">Waiting / Failed</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function setupPagingTranslation(container) {
  const out = container.querySelector('#paging-output');

  function translate() {
    try {
      const pageSize = parseInt(container.querySelector('#page-size-select').value, 10);
      const logicalAddr = parseInt(container.querySelector('#logical-address-input').value, 10);
      const ptRaw = container.querySelector('#page-table-input').value;

      const pageTable = {};
      ptRaw.split(',').forEach(pair => {
        const parts = pair.split(':').map(s => s.trim());
        if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
          pageTable[parseInt(parts[0], 10)] = parseInt(parts[1], 10);
        }
      });

      const res = translateAddress(logicalAddr, pageSize, pageTable);

      out.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-4)">
          <div class="stat-grid" style="margin-bottom:var(--space-4)">
            <div class="stat-card"><div class="stat-label">Page Number (p)</div><div class="stat-value teal">${res.pageNumber}</div></div>
            <div class="stat-card"><div class="stat-label">Offset (d)</div><div class="stat-value amber">${res.offset} B</div></div>
            <div class="stat-card"><div class="stat-label">Frame Number (f)</div><div class="stat-value ${res.pageFault ? 'red' : 'green'}">${res.pageFault ? 'Fault' : res.frameNumber}</div></div>
            <div class="stat-card"><div class="stat-label">Physical Address</div><div class="stat-value ${res.pageFault ? 'red' : 'teal'}">${res.pageFault ? 'Page Fault!' : `${res.physicalAddress} B`}</div></div>
          </div>

          <div style="background:var(--bg-elevated);padding:var(--space-4);border-radius:var(--radius-md);border:1px solid var(--border);margin-bottom:var(--space-4)">
            <h4 style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-2)">Hardware MMU Formula Derivation:</h4>
            <div style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.7;color:var(--text-secondary)">
              <div>1. Page Number: p = ⌊ Logical Address / Page Size ⌋ = ⌊ ${res.logicalAddress} / ${res.pageSize} ⌋ = <strong style="color:var(--accent-teal)">${res.pageNumber}</strong></div>
              <div>2. Offset: d = Logical Address mod Page Size = ${res.logicalAddress} % ${res.pageSize} = <strong style="color:var(--accent-amber)">${res.offset}</strong></div>
              <div>3. Page Table Lookup: PT[${res.pageNumber}] → ${res.pageFault ? '<strong style="color:var(--accent-red)">INVALID / NOT IN MEMORY (Page Fault Exception)</strong>' : `Frame <strong style="color:var(--accent-green)">${res.frameNumber}</strong>`}</div>
              ${!res.pageFault ? `<div>4. Physical Address = Frame Number × Page Size + Offset = (${res.frameNumber} × ${res.pageSize}) + ${res.offset} = <strong style="color:var(--accent-teal)">${res.physicalAddress}</strong> (0x${res.physicalAddress.toString(16).toUpperCase()})</div>` : ''}
            </div>
          </div>

          <h3 class="section-title">Active Page Table</h3>
          <div class="table-wrap" style="max-width:400px">
            <table>
              <thead><tr><th>Page # (Virtual)</th><th>Frame # (Physical)</th><th>Status</th></tr></thead>
              <tbody>
                ${Object.keys(pageTable).map(p => {
                  const pn = parseInt(p, 10);
                  const isCurrent = pn === res.pageNumber;
                  return `
                    <tr style="${isCurrent ? 'background:var(--accent-teal-glow)' : ''}">
                      <td class="td-label">${pn} ${isCurrent ? '← Target' : ''}</td>
                      <td>Frame ${pageTable[pn]}</td>
                      <td><span class="status-badge green">Valid (In RAM)</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      showError(out, err.message);
    }
  }

  container.querySelector('#btn-translate-addr').addEventListener('click', translate);
  container.querySelector('#btn-sample-addr').addEventListener('click', () => {
    container.querySelector('#logical-address-input').value = '25000'; // Target page not in page table
    translate();
  });
}
