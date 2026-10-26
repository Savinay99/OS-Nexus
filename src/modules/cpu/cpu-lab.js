/**
 * OS Nexus: CPU Scheduling Lab (Experiments 1 & 2)
 */
import { fcfs, sjf, priorityScheduling, roundRobin } from '../../algorithms/cpu.js';
import { renderGantt, renderScheduleTable, renderMetrics, buildProcessTable, parseProcessTable, showError, renderVivaQA, renderCCode, renderTheoryAccordion, setupTabs } from '../../shared/ui.js';
import { EXPERIMENTS } from '../../data/experiments.js';
import { initCPUPipeline3D } from '../../shared/workstation-3d.js';
import { playRunSound, playTick, playSuccessSound } from '../../shared/workstation-audio.js';
import { registerCleanup } from '../../app/router.js';

let activeCpuPlayInterval = null;

export function renderCPULab(container, params = {}) {
  const activeTab = params.tab || 'fcfs';

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">CPU Scheduling Lab</h1>
      <p class="page-subtitle">Interactive process scheduling simulation with FCFS, SJF, Priority, and Round Robin Gantt charts</p>
    </div>

    <div class="tabs" role="tablist" aria-label="CPU Scheduling algorithms">
      <button class="tab-btn ${activeTab==='fcfs'?'active':''}" data-tab="tab-fcfs" role="tab">FCFS</button>
      <button class="tab-btn ${activeTab==='sjf'?'active':''}" data-tab="tab-sjf" role="tab">SJF</button>
      <button class="tab-btn ${activeTab==='priority'?'active':''}" data-tab="tab-priority" role="tab">Priority</button>
      <button class="tab-btn ${activeTab==='rr'?'active':''}" data-tab="tab-rr" role="tab">Round Robin</button>
      <button class="tab-btn" data-tab="tab-compare" role="tab">Compare All</button>
      <button class="tab-btn" data-tab="tab-theory" role="tab">Theory &amp; Code</button>
    </div>

    <!-- FCFS Tab -->
    <div class="tab-panel ${activeTab==='fcfs'?'active':''}" id="tab-fcfs" role="tabpanel">
      ${algoPanel('fcfs', 'First Come First Served (FCFS)', false)}
    </div>

    <!-- SJF Tab -->
    <div class="tab-panel ${activeTab==='sjf'?'active':''}" id="tab-sjf" role="tabpanel">
      ${algoPanel('sjf', 'Shortest Job First (SJF): Non-Preemptive', false)}
    </div>

    <!-- Priority Tab -->
    <div class="tab-panel ${activeTab==='priority'?'active':''}" id="tab-priority" role="tabpanel">
      ${algoPanel('priority', 'Priority Scheduling: Non-Preemptive', true)}
    </div>

    <!-- Round Robin Tab -->
    <div class="tab-panel ${activeTab==='rr'?'active':''}" id="tab-rr" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Round Robin</h2>
        <div class="row" style="align-items:flex-end;flex-wrap:wrap;gap:var(--space-4);margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="rr-quantum">Time Quantum</label>
            <input id="rr-quantum" class="form-input" type="number" value="2" min="1" style="width:120px" aria-required="true"/>
          </div>
        </div>
        <div id="rr-proc-table"></div>
        <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
          <button class="btn btn-primary" id="rr-run">▶ Run Round Robin</button>
          <button class="btn btn-secondary" id="rr-reset">Reset</button>
          <button class="btn btn-ghost" id="rr-example">Load Example</button>
        </div>
      </div>
      <div id="rr-output"></div>
    </div>

    <!-- Compare Tab -->
    <div class="tab-panel" id="tab-compare" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Algorithm Comparison</h2>
        <p class="card-subtitle" style="margin-bottom:var(--space-4)">Enter a process set and compare all algorithms on the same data.</p>
        <div id="cmp-proc-table"></div>
        <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
          <div class="form-group">
            <label class="form-label" for="cmp-quantum">RR Quantum</label>
            <input id="cmp-quantum" class="form-input" type="number" value="2" min="1" style="width:100px"/>
          </div>
          <div style="align-self:flex-end">
            <button class="btn btn-primary" id="cmp-run">▶ Compare All</button>
          </div>
        </div>
      </div>
      <div id="cmp-output"></div>
    </div>

    <!-- Theory Tab -->
    <div class="tab-panel" id="tab-theory" role="tabpanel">
      <div class="grid-2">
        <div class="card">
          <h2 class="card-title" style="margin-bottom:var(--space-4)">Experiment 1: FCFS &amp; SJF</h2>
          <div id="theory-exp1"></div>
          <div style="margin-top:var(--space-4)"><div id="viva-exp1"></div></div>
        </div>
        <div class="card">
          <h2 class="card-title" style="margin-bottom:var(--space-4)">Experiment 2: Priority &amp; RR</h2>
          <div id="theory-exp2"></div>
          <div style="margin-top:var(--space-4)"><div id="viva-exp2"></div></div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">C Source Code: FCFS</h2>
        <div id="c-code-block"></div>
      </div>
    </div>
  `;

  // Setup all algo panels
  setupAlgoPanel(container, 'fcfs', fcfs, false);
  setupAlgoPanel(container, 'sjf', sjf, false);
  setupAlgoPanel(container, 'priority', priorityScheduling, true);
  setupRRPanel(container);
  setupComparePanel(container);

  // Theory
  const exp1 = EXPERIMENTS[0]; const exp2 = EXPERIMENTS[1];
  renderTheoryAccordion(container.querySelector('#theory-exp1'), exp1);
  renderTheoryAccordion(container.querySelector('#theory-exp2'), exp2);
  renderVivaQA(container.querySelector('#viva-exp1'), exp1.vivaQA);
  renderCCode(container.querySelector('#c-code-block'), exp1.cCode, 'fcfs_sjf.c');

  // Tabs
  setupTabs(container);

  registerCleanup(() => {
    if (activeCpuPlayInterval) {
      clearInterval(activeCpuPlayInterval);
      activeCpuPlayInterval = null;
    }
  });
}

function algoPanel(id, title, hasPriority) {
  return `
    <div class="card" style="margin-bottom:var(--space-4)">
      <h2 class="card-title" style="margin-bottom:var(--space-4)">${title}</h2>
      <div id="${id}-proc-table"></div>
      <div class="row" style="margin-top:var(--space-4);gap:var(--space-3)">
        <button class="btn btn-primary" id="${id}-run">▶ Run</button>
        <button class="btn btn-secondary" id="${id}-reset">Reset</button>
        <button class="btn btn-ghost" id="${id}-example">Load Example</button>
      </div>
    </div>
    <div id="${id}-output"></div>`;
}

const EXAMPLE_PROCESSES = [
  { id: 'P1', at: 0, bt: 5, priority: 2 },
  { id: 'P2', at: 1, bt: 3, priority: 1 },
  { id: 'P3', at: 2, bt: 8, priority: 3 },
  { id: 'P4', at: 3, bt: 6, priority: 2 },
];

function setupAlgoPanel(container, id, algo, hasPriority) {
  const tableEl = container.querySelector(`#${id}-proc-table`);
  buildProcessTable(tableEl, hasPriority);

  container.querySelector(`#${id}-run`).addEventListener('click', () => {
    try {
      const processes = parseProcessTable(tableEl.querySelector('#proc-tbody'), hasPriority);
      const result = algo(processes);
      renderOutput(container.querySelector(`#${id}-output`), result);
    } catch (e) {
      showError(container.querySelector(`#${id}-output`), e.message);
    }
  });

  container.querySelector(`#${id}-reset`).addEventListener('click', () => {
    buildProcessTable(tableEl, hasPriority);
    container.querySelector(`#${id}-output`).innerHTML = '';
  });

  container.querySelector(`#${id}-example`).addEventListener('click', () => {
    buildProcessTable(tableEl, hasPriority);
    // Patch in example data
    const rows = tableEl.querySelectorAll('#proc-tbody tr');
    EXAMPLE_PROCESSES.forEach((p, i) => {
      if (!rows[i]) return;
      const inputs = rows[i].querySelectorAll('input');
      inputs[0].value = p.id; inputs[1].value = p.at; inputs[2].value = p.bt;
      if (hasPriority && inputs[3]) inputs[3].value = p.priority;
    });
  });
}

function setupRRPanel(container) {
  const tableEl = container.querySelector('#rr-proc-table');
  buildProcessTable(tableEl, false);

  container.querySelector('#rr-run').addEventListener('click', () => {
    try {
      const processes = parseProcessTable(tableEl.querySelector('#proc-tbody'), false);
      const q = parseInt(container.querySelector('#rr-quantum').value, 10);
      if (!q || q <= 0) throw new Error('Time quantum must be a positive integer.');
      const result = roundRobin(processes, q);
      renderOutput(container.querySelector('#rr-output'), result);
    } catch (e) {
      showError(container.querySelector('#rr-output'), e.message);
    }
  });

  container.querySelector('#rr-reset').addEventListener('click', () => {
    buildProcessTable(tableEl, false);
    container.querySelector('#rr-output').innerHTML = '';
    container.querySelector('#rr-quantum').value = '2';
  });

  container.querySelector('#rr-example').addEventListener('click', () => {
    buildProcessTable(tableEl, false);
    const rows = tableEl.querySelectorAll('#proc-tbody tr');
    EXAMPLE_PROCESSES.forEach((p, i) => {
      if (!rows[i]) return;
      const inputs = rows[i].querySelectorAll('input');
      inputs[0].value = p.id; inputs[1].value = p.at; inputs[2].value = p.bt;
    });
    container.querySelector('#rr-quantum').value = '2';
  });
}

function setupComparePanel(container) {
  const tableEl = container.querySelector('#cmp-proc-table');
  buildProcessTable(tableEl, true);

  container.querySelector('#cmp-run').addEventListener('click', () => {
    try {
      const processes = parseProcessTable(tableEl.querySelector('#proc-tbody'), true);
      const q = parseInt(container.querySelector('#cmp-quantum').value, 10) || 2;
      const results = {
        FCFS: fcfs(processes),
        SJF: sjf(processes),
        Priority: priorityScheduling(processes),
        [`RR (q=${q})`]: roundRobin(processes, q),
      };
      renderCompare(container.querySelector('#cmp-output'), results);
    } catch (e) {
      showError(container.querySelector('#cmp-output'), e.message);
    }
  });
}

function renderOutput(container, result) {
  if (!result.schedule.length) {
    container.innerHTML = '<div class="info-box amber">No results. Add processes and run.</div>';
    return;
  }
  container.innerHTML = '';
  playRunSound();

  const outCard = document.createElement('div');
  outCard.className = 'card';
  outCard.style.padding = 'var(--space-5)';
  outCard.innerHTML = `
    <!-- Summary Metrics Grid -->
    <div style="margin-bottom:var(--space-5);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
        <h3 class="section-title" style="margin:0;">Performance Telemetry</h3>
        <span style="font-size:var(--text-xs); color:var(--text-muted); font-family:var(--font-mono);">N=${result.schedule.length} Processes</span>
      </div>
      <div id="metrics-out"></div>
    </div>

    <div class="divider" style="margin-bottom:var(--space-5);"></div>

    <!-- Gantt Chart Timeline -->
    <div style="margin-bottom:var(--space-5);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
        <h3 class="section-title" style="margin:0;">Execution Timeline (Gantt Chart)</h3>
        <span style="font-size:var(--text-xs); color:var(--text-muted);">Span: T=0 to T=${result.gantt[result.gantt.length - 1]?.end || 0}</span>
      </div>
      <div class="gantt-wrap" id="gantt-inner"></div>
    </div>

    <div class="divider" style="margin-bottom:var(--space-5);"></div>

    <!-- 3D Execution Pipeline Visualizer -->
    <div style="margin-bottom:var(--space-5);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
        <div>
          <h3 class="section-title" style="margin:0;">Multiprogramming Pipeline Flow</h3>
          <p style="font-size:var(--text-xs); color:var(--text-muted); margin:3px 0 0 0;">Ready Queue (RAM) &rarr; CPU Core Socket &rarr; Terminated PCB Register</p>
        </div>
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <button class="btn btn-sm btn-secondary" id="pipeline-step-btn">Step Pipeline</button>
          <button class="btn btn-sm btn-primary" id="pipeline-play-btn">Auto-Play 3D</button>
          <button class="btn btn-sm btn-ghost" id="pipeline-reset-btn">Reset</button>
        </div>
      </div>
      <div id="cpu-pipeline-3d-wrap" style="height:230px; width:100%; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-primary); border:1px solid var(--border-default);"></div>
    </div>

    <div class="divider" style="margin-bottom:var(--space-5);"></div>

    <!-- Process Schedule Table -->
    <div>
      <h3 class="section-title" style="margin-bottom:var(--space-3);">Process Metrics Table</h3>
      <div id="sched-table"></div>
    </div>
  `;
  container.appendChild(outCard);

  renderMetrics(outCard.querySelector('#metrics-out'), result.metrics);
  renderGantt(outCard.querySelector('#gantt-inner'), result.gantt, result.gantt[result.gantt.length - 1]?.end);
  renderScheduleTable(outCard.querySelector('#sched-table'), result.schedule);

  const pipelineWrap = outCard.querySelector('#cpu-pipeline-3d-wrap');
  const pipeline3D = initCPUPipeline3D(pipelineWrap, result.schedule);

  let currentGanttIdx = 0;
  if (activeCpuPlayInterval) {
    clearInterval(activeCpuPlayInterval);
    activeCpuPlayInterval = null;
  }

  const stepPipeline = () => {
    if (!pipeline3D || !result.gantt || !result.gantt.length) return;
    if (currentGanttIdx >= result.gantt.length) {
      currentGanttIdx = 0;
      pipeline3D.reset();
    }
    const item = result.gantt[currentGanttIdx];
    if (item.pid !== 'IDLE') {
      const pIdx = result.schedule.findIndex(p => p.id === item.pid);
      if (pIdx !== -1) {
        pipeline3D.dispatchProcess(pIdx);
        playTick();
        setTimeout(() => {
          pipeline3D.terminateProcess(pIdx);
        }, 700);
      }
    }
    currentGanttIdx++;
  };

  outCard.querySelector('#pipeline-step-btn').addEventListener('click', stepPipeline);

  outCard.querySelector('#pipeline-play-btn').addEventListener('click', (e) => {
    if (activeCpuPlayInterval) {
      clearInterval(activeCpuPlayInterval);
      activeCpuPlayInterval = null;
      e.target.textContent = 'Auto-Play 3D';
    } else {
      e.target.textContent = 'Pause 3D';
      activeCpuPlayInterval = setInterval(() => {
        if (currentGanttIdx >= result.gantt.length) {
          clearInterval(activeCpuPlayInterval);
          activeCpuPlayInterval = null;
          e.target.textContent = 'Replay 3D';
          playSuccessSound();
        } else {
          stepPipeline();
        }
      }, 1100);
    }
  });

  outCard.querySelector('#pipeline-reset-btn').addEventListener('click', () => {
    if (activeCpuPlayInterval) {
      clearInterval(activeCpuPlayInterval);
      activeCpuPlayInterval = null;
      outCard.querySelector('#pipeline-play-btn').textContent = 'Auto-Play 3D';
    }
    currentGanttIdx = 0;
    if (pipeline3D) pipeline3D.reset();
  });
}

function renderCompare(container, results) {
  const keys = Object.keys(results);
  const metrics = ['avgTAT', 'avgWT', 'avgRT', 'cpuUtil'];
  const labels = { avgTAT: 'Avg TAT', avgWT: 'Avg WT', avgRT: 'Avg RT', cpuUtil: 'CPU Util %' };

  container.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-4)">
      <h3 class="section-title">Metrics Comparison</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Metric</th>${keys.map(k => `<th>${k}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${metrics.map(m => `
              <tr>
                <td class="td-label">${labels[m]}</td>
                ${keys.map(k => {
                  const val = results[k].metrics[m];
                  const best = Math.min(...keys.map(kk => results[kk].metrics[m] || Infinity));
                  const isBest = Math.abs(val - best) < 0.001;
                  return `<td style="${isBest ? 'color:var(--accent-green);font-weight:600' : ''}">${typeof val === 'number' ? val.toFixed(2) : '-'}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${keys.map(k => `
      <div class="card" style="margin-bottom:var(--space-4)">
        <h3 class="section-title">${k}: Gantt Chart</h3>
        <div class="gantt-wrap" id="cmp-gantt-${k.replace(/\s/g,'-')}"></div>
      </div>`).join('')}`;

  keys.forEach(k => {
    const div = container.querySelector(`#cmp-gantt-${k.replace(/\s/g,'-')}`);
    if (div && results[k].gantt.length) {
      renderGantt(div, results[k].gantt, results[k].gantt[results[k].gantt.length - 1]?.end);
    }
  });
}
