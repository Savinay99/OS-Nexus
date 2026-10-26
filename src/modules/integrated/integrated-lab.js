/**
 * OS Nexus: Integrated Operating System Workbench
 * End-to-end Multiprogrammed Kernel Simulation Workstation
 * Integrates CPU Scheduling, Contiguous Memory Management, Disk I/O Bus, and Banker's Deadlock Avoidance.
 */
import { escapeHtml, logEntry } from '../../shared/ui.js';
import { initCPUPipeline3D } from '../../shared/workstation-3d.js';
import { bankersAlgorithm } from '../../algorithms/bankers.js';
import { playTick, playRunSound, playSuccessSound, playWarningSound } from '../../shared/workstation-audio.js';
import { registerCleanup } from '../../app/router.js';

export function renderIntegratedLab(container) {
  // Simulator State
  let time = 0;
  let timerId = null;
  let speedMs = 700;
  let isRunning = false;

  // Workload Scenario
  const initialJobs = [
    { pid: 'P1', at: 0, bt: 6, remBt: 6, mem: 128, diskSector: 45, ioAtTick: 3, resReq: [1, 0, 0], maxDemand: [1, 1, 0], state: 'new', ct: null, tat: null, wt: null, colorKey: 'P1' },
    { pid: 'P2', at: 1, bt: 4, remBt: 4, mem: 64,  diskSector: 120, ioAtTick: 2, resReq: [0, 1, 0], maxDemand: [0, 1, 1], state: 'new', ct: null, tat: null, wt: null, colorKey: 'P2' },
    { pid: 'P3', at: 2, bt: 8, remBt: 8, mem: 256, diskSector: 15,  ioAtTick: 4, resReq: [1, 1, 0], maxDemand: [2, 1, 0], state: 'new', ct: null, tat: null, wt: null, colorKey: 'P3' },
    { pid: 'P4', at: 3, bt: 3, remBt: 3, mem: 64,  diskSector: 85,  ioAtTick: null, resReq: [0, 0, 1], maxDemand: [0, 1, 1], state: 'new', ct: null, tat: null, wt: null, colorKey: 'P4' },
  ];

  let jobs = JSON.parse(JSON.stringify(initialJobs));

  // Memory Partitions (Total: 512 KB)
  let memoryPartitions = [
    { id: 'M1', size: 64,  allocatedTo: null },
    { id: 'M2', size: 128, allocatedTo: null },
    { id: 'M3', size: 128, allocatedTo: null },
    { id: 'M4', size: 256, allocatedTo: null },
  ];

  // Disk State (Tracks 0 to 199)
  let diskHead = 50;
  let diskQueue = []; // pending sector numbers
  let totalHeadMovement = 0;

  // Banker's Available Resources [R1 (Mutex), R2 (Buffer), R3 (Printer)]
  let totalResources = [3, 2, 2];
  let availableResources = [3, 2, 2];

  // CPU Scheduler
  let schedulingPolicy = 'rr'; // 'rr', 'fcfs', 'sjf'
  let timeQuantum = 2;
  let currentQuantumTick = 0;
  let runningProcess = null;
  let readyQueue = [];
  let waitingQueue = [];
  let terminatedList = [];
  let ganttTrace = []; // [{ pid, start, end, color }]

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Integrated OS Workbench</h1>
      <p class="page-subtitle">Unified Multiprogrammed Kernel Workstation: Real-time coordination of CPU Scheduling, RAM Admission, Disk I/O Bus, and Banker's Deadlock Avoidance.</p>
    </div>

    <!-- Architectural Overview Note -->
    <div class="info-box" style="margin-bottom:var(--space-4)">
      <strong>Simulated Multiprogramming Lifecycle:</strong>
      Job Admission (RAM Partition) → Ready Queue Dispatch → CPU Execution → I/O Yield &amp; Disk Seek → Mutex Resource Grant → Process Termination &amp; Memory Reclamation.
    </div>

    <!-- 1. Kernel Architecture Pipeline Visualizer -->
    <div class="card" style="margin-bottom:var(--space-4); padding:var(--space-4);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
        <div>
          <h3 class="card-title" style="margin:0; font-family:var(--font-sans);">Multiprogramming Kernel Execution Pipeline</h3>
          <p style="font-size:var(--text-xs); color:var(--text-tertiary); margin:2px 0 0 0;">Physical Hardware Bays: Ready Queue (Left), Core Socket (Center), Disk Bus (Lower), Terminated Bay (Right)</p>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-2);">
          <span class="badge blue" id="int-pipeline-status" style="font-family:var(--font-mono); font-size:11px;">Core Status: Ready</span>
        </div>
      </div>
      <div id="int-pipeline-canvas-wrap" style="height:250px; width:100%; border-radius:var(--radius); overflow:hidden; background:var(--bg-primary); border:1px solid var(--border);"></div>
    </div>

    <!-- 2. Synchronized Execution Timeline (Gantt Chart) -->
    <div class="card" style="margin-bottom:var(--space-4); padding:var(--space-4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
        <h3 class="card-title" style="margin:0; font-size:var(--text-sm);">Synchronized CPU Execution Timeline</h3>
        <span style="font-size:var(--text-xs); color:var(--text-tertiary); font-family:var(--font-mono);" id="gantt-duration-label">Span: T=0 to T=0</span>
      </div>
      <div id="int-gantt-container" style="background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius); padding:var(--space-3); overflow-x:auto;">
        <div id="int-gantt-track" style="height:32px; display:flex; align-items:center; position:relative; min-width:100%;">
          <span style="font-size:var(--text-xs); color:var(--text-tertiary); font-family:var(--font-mono);">Execution timeline will record CPU cycles here...</span>
        </div>
        <div id="int-gantt-ticks" style="height:16px; margin-top:4px; display:flex; position:relative; font-size:10px; color:var(--text-tertiary); font-family:var(--font-mono);"></div>
      </div>
    </div>

    <!-- 3. Workstation Playback Controls -->
    <div class="card" style="margin-bottom:var(--space-4); padding:var(--space-4);">
      <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4);">
        <!-- Play / Step / Reset -->
        <div class="row" style="gap:var(--space-2); align-items:center;">
          <button class="btn btn-primary" id="int-btn-start">▶ Start / Resume</button>
          <button class="btn btn-secondary" id="int-btn-pause" disabled>⏸ Pause</button>
          <button class="btn btn-secondary" id="int-btn-step">⏭ Step Tick</button>
          <button class="btn btn-danger btn-sm" id="int-btn-reset">↺ Reset</button>
        </div>

        <!-- Simulation Options -->
        <div class="row" style="gap:var(--space-4); align-items:center; flex-wrap:wrap;">
          <div class="row" style="gap:var(--space-2); align-items:center;">
            <label for="int-cpu-policy" style="font-size:var(--text-xs); font-weight:600; color:var(--text-secondary);">CPU Policy:</label>
            <select id="int-cpu-policy" class="form-select" style="font-size:var(--text-xs); padding:4px 10px; width:auto; font-family:var(--font-mono);">
              <option value="rr" selected>Round Robin (Quantum=2)</option>
              <option value="fcfs">First Come First Served (FCFS)</option>
              <option value="sjf">Shortest Remaining Time (SRTF)</option>
            </select>
          </div>

          <div class="row" style="gap:var(--space-2); align-items:center;">
            <label for="int-speed-slider" style="font-size:var(--text-xs); font-weight:600; color:var(--text-secondary);">Cycle Speed:</label>
            <input type="range" id="int-speed-slider" min="200" max="1400" step="100" value="700" style="width:90px;" />
            <span id="int-speed-label" style="font-size:var(--text-xs); color:var(--text-tertiary); font-family:var(--font-mono); min-width:44px;">700ms</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Verified Simulated Metrics Overview (Real Simulation State) -->
    <div class="stat-grid" style="margin-bottom:var(--space-4);">
      <div class="stat-card">
        <div class="stat-label">Simulated System Clock</div>
        <div class="stat-value teal" id="metric-clock">T = 0</div>
        <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Discrete kernel timer ticks</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Simulated RAM Allocation</div>
        <div class="stat-value amber" id="metric-ram">0 / 512 KB (0%)</div>
        <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;" id="metric-ram-sub">4 Fixed Partitions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Simulated Disk Head</div>
        <div class="stat-value purple" id="metric-disk">Cylinder 50 (0 mv)</div>
        <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Cylinders 0 to 199</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Simulated Banker's Safety</div>
        <div class="stat-value green" id="metric-deadlock">SAFE</div>
        <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;" id="metric-deadlock-sub">Deadlock Free</div>
      </div>
    </div>

    <!-- 5. Compact Process State Panel (Outside Canvas) -->
    <div class="card" style="margin-bottom:var(--space-4); padding:var(--space-4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
        <h3 class="card-title" style="margin:0; font-size:var(--text-sm);">Process Control Block (PCB) Telemetry Panel</h3>
        <span style="font-size:var(--text-xs); color:var(--text-tertiary);">Live Process Status &amp; Performance Metrics</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Arrival (AT)</th>
              <th>Burst (BT)</th>
              <th>Remaining</th>
              <th>RAM Req</th>
              <th>Alloc Partition</th>
              <th>I/O At Tick</th>
              <th>Target Cyl</th>
              <th>Process State</th>
              <th>Metrics (CT / TAT / WT)</th>
            </tr>
          </thead>
          <tbody id="int-proc-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- 6. Memory Partitions, Disk Bus & Resource Grid -->
    <div class="grid-3" style="gap:var(--space-4); margin-bottom:var(--space-4);">
      <!-- Physical Memory Partitions -->
      <div class="card" style="padding:var(--space-4);">
        <h3 class="card-title" style="margin-bottom:var(--space-2); font-size:var(--text-sm);">Physical RAM Partitions (512 KB)</h3>
        <p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-bottom:var(--space-3);">Contiguous First-Fit Allocation</p>
        <div id="int-ram-partitions" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:var(--space-2);"></div>
      </div>

      <!-- Secondary Storage Disk Head -->
      <div class="card" style="padding:var(--space-4);">
        <h3 class="card-title" style="margin-bottom:var(--space-2); font-size:var(--text-sm);">Secondary Storage (Disk Bus)</h3>
        <p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-bottom:var(--space-2);">Tracks 0 to 199 Actuator Arm</p>
        <div style="background:var(--bg-primary); height:22px; border-radius:var(--radius); position:relative; border:1px solid var(--border); margin-bottom:var(--space-2);">
          <div id="disk-head-marker" style="position:absolute; top:0; bottom:0; width:4px; background:var(--accent-purple); transition:left 0.25s ease; left:25%;"></div>
        </div>
        <div style="font-size:var(--text-xs); color:var(--text-secondary); display:flex; justify-content:space-between; font-family:var(--font-mono);">
          <span>Queue: <strong id="disk-queue-display" style="color:var(--accent-purple);">None</strong></span>
          <span>Seek: <strong id="disk-movement-display">0</strong> cyl</span>
        </div>
      </div>

      <!-- Banker's Mutex Resource Pool -->
      <div class="card" style="padding:var(--space-4);">
        <h3 class="card-title" style="margin-bottom:var(--space-2); font-size:var(--text-sm);">Banker's Resource Availability</h3>
        <p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-bottom:var(--space-2);">Live Available / Total Vectors</p>
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <div style="flex:1; background:var(--bg-primary); padding:var(--space-2); border-radius:var(--radius); text-align:center; border:1px solid var(--border);">
            <div style="font-size:10px; color:var(--text-tertiary);">R1 (Mutex)</div>
            <div id="res-r1-val" style="font-weight:700; color:var(--accent-teal); font-family:var(--font-mono); font-size:var(--text-sm);">3 / 3</div>
          </div>
          <div style="flex:1; background:var(--bg-primary); padding:var(--space-2); border-radius:var(--radius); text-align:center; border:1px solid var(--border);">
            <div style="font-size:10px; color:var(--text-tertiary);">R2 (Buffer)</div>
            <div id="res-r2-val" style="font-weight:700; color:var(--accent-amber); font-family:var(--font-mono); font-size:var(--text-sm);">2 / 2</div>
          </div>
          <div style="flex:1; background:var(--bg-primary); padding:var(--space-2); border-radius:var(--radius); text-align:center; border:1px solid var(--border);">
            <div style="font-size:10px; color:var(--text-tertiary);">R3 (Printer)</div>
            <div id="res-r3-val" style="font-weight:700; color:var(--accent-emerald); font-family:var(--font-mono); font-size:var(--text-sm);">2 / 2</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. Kernel System Event Log -->
    <div class="card" style="padding:var(--space-4);">
      <div class="row" style="justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
        <h3 class="card-title" style="margin:0; font-size:var(--text-sm);">Operating System Event Stream</h3>
        <button class="btn btn-ghost btn-sm" id="btn-clear-int-log">Clear</button>
      </div>
      <div id="int-event-log" class="terminal-box" style="height:170px;">
        <div class="log-entry info">[T=0] Kernel initialized. Multiprogramming pipeline ready to schedule jobs.</div>
      </div>
    </div>
  `;

  // UI Element References
  const btnStart = container.querySelector('#int-btn-start');
  const btnStep = container.querySelector('#int-btn-step');
  const btnPause = container.querySelector('#int-btn-pause');
  const btnReset = container.querySelector('#int-btn-reset');
  const cpuPolicySelect = container.querySelector('#int-cpu-policy');
  const speedSlider = container.querySelector('#int-speed-slider');
  const speedLabel = container.querySelector('#int-speed-label');
  const eventLog = container.querySelector('#int-event-log');
  const pipelineStatus = container.querySelector('#int-pipeline-status');

  const pipelineWrap = container.querySelector('#int-pipeline-canvas-wrap');
  const intPipeline3D = initCPUPipeline3D(pipelineWrap, initialJobs);

  // Compute Live Deadlock Safety with Banker's Algorithm
  function evaluateBankersSafety() {
    // Allocation matrix for jobs: [jobIndex][resourceIndex]
    const allocation = jobs.map(j => {
      if (j.state === 'running' || j.state === 'waiting') {
        return [...j.resReq];
      }
      return [0, 0, 0];
    });

    const maximum = jobs.map(j => [...j.maxDemand]);

    try {
      const result = bankersAlgorithm(availableResources, allocation, maximum);
      return result;
    } catch (e) {
      return { safe: false, sequence: [] };
    }
  }

  function updateUI() {
    // 1. Clock Metric
    container.querySelector('#metric-clock').textContent = `T = ${time}`;

    // 2. RAM Partitions & Metric
    const ramContainer = container.querySelector('#int-ram-partitions');
    let totalUsedRam = 0;
    ramContainer.innerHTML = memoryPartitions.map(p => {
      if (p.allocatedTo) totalUsedRam += p.size;
      const isOccupied = !!p.allocatedTo;
      return `
        <div style="background:var(--bg-primary); border:1px solid ${isOccupied ? 'var(--accent-amber)' : 'var(--border)'}; border-radius:var(--radius); padding:6px; text-align:center;">
          <div style="font-size:10px; color:var(--text-tertiary); font-family:var(--font-mono);">${p.id} (${p.size}KB)</div>
          ${isOccupied
            ? `<div style="font-weight:700; color:var(--accent-amber); font-size:var(--text-xs); font-family:var(--font-mono);">${p.allocatedTo}</div>`
            : `<div style="font-size:10px; color:var(--text-tertiary);">Free</div>`}
        </div>
      `;
    }).join('');

    const ramPct = Math.round((totalUsedRam / 512) * 100);
    container.querySelector('#metric-ram').textContent = `${totalUsedRam} / 512 KB (${ramPct}%)`;
    container.querySelector('#metric-ram-sub').textContent = `${memoryPartitions.filter(p => p.allocatedTo).length} / 4 Partitions in Use`;

    // 3. Disk Metric
    container.querySelector('#metric-disk').textContent = `Cylinder ${diskHead} (${totalHeadMovement} mv)`;
    container.querySelector('#disk-head-marker').style.left = `${(diskHead / 199) * 100}%`;
    container.querySelector('#disk-queue-display').textContent = diskQueue.length > 0 ? diskQueue.join(', ') : 'None';
    container.querySelector('#disk-movement-display').textContent = totalHeadMovement;

    // 4. Banker's Deadlock Safety Metric (Dynamically computed)
    const safety = evaluateBankersSafety();
    const deadlockEl = container.querySelector('#metric-deadlock');
    const deadlockSubEl = container.querySelector('#metric-deadlock-sub');

    if (safety.safe) {
      deadlockEl.textContent = 'SAFE';
      deadlockEl.className = 'stat-value green';
      const seqStr = safety.sequence.map(idx => `P${idx + 1}`).join(' → ');
      deadlockSubEl.textContent = seqStr ? `Safe Seq: ${seqStr}` : 'Safe State';
    } else {
      deadlockEl.textContent = 'UNSAFE';
      deadlockEl.className = 'stat-value red';
      deadlockSubEl.textContent = 'Potential Deadlock Risk';
    }

    // 5. Resource Counts
    container.querySelector('#res-r1-val').textContent = `${availableResources[0]} / ${totalResources[0]}`;
    container.querySelector('#res-r2-val').textContent = `${availableResources[1]} / ${totalResources[1]}`;
    container.querySelector('#res-r3-val').textContent = `${availableResources[2]} / ${totalResources[2]}`;

    // 6. Pipeline Status Badge
    if (pipelineStatus) {
      if (runningProcess) {
        pipelineStatus.textContent = `Core Active: ${runningProcess.pid} (Rem: ${runningProcess.remBt}t)`;
        pipelineStatus.className = 'badge teal';
      } else if (jobs.every(j => j.state === 'terminated')) {
        pipelineStatus.textContent = 'Kernel Complete: All Jobs Terminated';
        pipelineStatus.className = 'badge green';
      } else {
        pipelineStatus.textContent = 'Core Idle: Waiting for Ready Queue';
        pipelineStatus.className = 'badge blue';
      }
    }

    // 7. Compact PCB Telemetry Table
    const tbody = container.querySelector('#int-proc-tbody');
    tbody.innerHTML = jobs.map(j => {
      const part = memoryPartitions.find(p => p.allocatedTo === j.pid);
      const stateBadge = {
        new: '<span class="status-badge gray">New</span>',
        ready: '<span class="status-badge blue">Ready</span>',
        running: '<span class="status-badge teal">Running</span>',
        waiting: '<span class="status-badge amber">Waiting (I/O)</span>',
        terminated: '<span class="status-badge green">Terminated</span>'
      }[j.state] || j.state;

      const metricsDisplay = j.state === 'terminated'
        ? `<span style="font-family:var(--font-mono); color:var(--accent-emerald);">CT=${j.ct} | TAT=${j.tat} | WT=${j.wt}</span>`
        : `<span style="color:var(--text-tertiary); font-size:11px;">Pending execution</span>`;

      return `
        <tr>
          <td class="td-label" style="font-family:var(--font-mono); font-weight:700;">${j.pid}</td>
          <td style="font-family:var(--font-mono);">${j.at}</td>
          <td style="font-family:var(--font-mono);">${j.bt}</td>
          <td style="font-family:var(--font-mono); font-weight:600;">${j.remBt}</td>
          <td style="font-family:var(--font-mono);">${j.mem} KB</td>
          <td style="font-family:var(--font-mono);">${part ? `<span style="color:var(--accent-amber);">${part.id}</span>` : '<span style="color:var(--text-tertiary);">-</span>'}</td>
          <td style="font-family:var(--font-mono);">${j.ioAtTick !== null ? `Tick ${j.ioAtTick}` : '<span style="color:var(--text-tertiary);">None</span>'}</td>
          <td style="font-family:var(--font-mono);">${j.diskSector !== null ? j.diskSector : '-'}</td>
          <td>${stateBadge}</td>
          <td>${metricsDisplay}</td>
        </tr>
      `;
    }).join('');

    // 8. Gantt Timeline Render
    const ganttEl = container.querySelector('#int-gantt-track');
    const ticksEl = container.querySelector('#int-gantt-ticks');
    container.querySelector('#gantt-duration-label').textContent = `Simulated Duration: T=0 to T=${time}`;

    if (ganttTrace.length > 0) {
      const totalSpan = Math.max(time, 1);
      ganttEl.innerHTML = ganttTrace.map(b => {
        const span = b.end - b.start;
        const widthPct = (span / totalSpan) * 100;
        const color = b.pid === 'IDLE' ? 'var(--bg-elevated)' : (
          b.pid === 'P1' ? 'var(--accent-cyan)' :
          b.pid === 'P2' ? 'var(--accent-amber)' :
          b.pid === 'P3' ? 'var(--accent-blue)' :
          b.pid === 'P4' ? 'var(--accent-purple)' : 'var(--accent-teal)'
        );
        const textColor = b.pid === 'IDLE' ? 'var(--text-tertiary)' : '#ffffff';

        return `
          <div style="background:${color}; color:${textColor}; width:${widthPct}%; height:100%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; font-family:var(--font-mono); border-right:1px solid rgba(0,0,0,0.3); overflow:hidden;" title="${b.pid}: T=${b.start} to T=${b.end}">
            ${span >= 1 ? b.pid : ''}
          </div>
        `;
      }).join('');

      // Render Time Scale Ticks
      const tickStep = Math.max(1, Math.ceil(totalSpan / 12));
      let tickMarkers = [];
      for (let t = 0; t <= totalSpan; t += tickStep) {
        const leftPct = (t / totalSpan) * 100;
        tickMarkers.push(`
          <div style="position:absolute; left:${leftPct}%; transform:translateX(-50%);">
            T=${t}
          </div>
        `);
      }
      ticksEl.innerHTML = tickMarkers.join('');
    } else {
      ganttEl.innerHTML = '<span style="font-size:var(--text-xs); color:var(--text-tertiary); font-family:var(--font-mono);">Execution timeline will record CPU cycles here...</span>';
      ticksEl.innerHTML = '';
    }

    // 9. Update the Kernel Pipeline Visualizer Canvas
    if (intPipeline3D) {
      intPipeline3D.updateState({
        time,
        runningProcess,
        readyQueue,
        waitingQueue,
        terminatedList,
        diskHead,
        policy: schedulingPolicy,
        quantum: { spent: currentQuantumTick, max: timeQuantum },
        jobs
      });
    }
  }

  // Simulation Step Tick
  function stepSimulation() {
    time++;

    // 1. Admission of New Jobs arriving at time T into RAM (First Fit)
    for (const job of jobs) {
      if (job.state === 'new' && job.at <= time) {
        const part = memoryPartitions.find(p => p.allocatedTo === null && p.size >= job.mem);
        if (part) {
          part.allocatedTo = job.pid;
          job.state = 'ready';
          readyQueue.push(job);
          logEntry(eventLog, 'info', `[T=${time}] Memory Manager allocated Partition ${part.id} (${part.size}KB) to ${job.pid}. Admitted to Ready Queue.`);
        } else {
          logEntry(eventLog, 'warning', `[T=${time}] ${job.pid} arrived at T=${job.at}, but no free RAM partition of size ${job.mem}KB. Waiting in New job pool.`);
        }
      }
    }

    // 2. Service Disk I/O for waiting processes
    if (waitingQueue.length > 0) {
      const servicedProc = waitingQueue.shift();
      const move = Math.abs(servicedProc.diskSector - diskHead);
      totalHeadMovement += move;
      diskHead = servicedProc.diskSector;
      diskQueue = diskQueue.filter(s => s !== servicedProc.diskSector);
      servicedProc.state = 'ready';
      readyQueue.push(servicedProc);
      logEntry(eventLog, 'success', `[T=${time}] Disk Scheduler serviced I/O at Cylinder ${diskHead} for ${servicedProc.pid} (${move} cyl seek). Process returned to Ready Queue.`);
    }

    // 3. CPU Scheduling Check
    schedulingPolicy = cpuPolicySelect.value;

    if (runningProcess) {
      runningProcess.remBt--;
      currentQuantumTick++;

      // Check if process triggered Disk I/O
      if (runningProcess.ioAtTick !== null && (runningProcess.bt - runningProcess.remBt) === runningProcess.ioAtTick && runningProcess.remBt > 0) {
        logEntry(eventLog, 'warning', `[T=${time}] ${runningProcess.pid} executed I/O system call. Yielded CPU to Disk Queue (Target Cylinder: ${runningProcess.diskSector}).`);
        runningProcess.state = 'waiting';
        diskQueue.push(runningProcess.diskSector);
        waitingQueue.push(runningProcess);
        runningProcess = null;
        currentQuantumTick = 0;
      }
      // Check if process completed
      else if (runningProcess.remBt === 0) {
        runningProcess.state = 'terminated';
        runningProcess.ct = time;
        runningProcess.tat = runningProcess.ct - runningProcess.at;
        runningProcess.wt = runningProcess.tat - runningProcess.bt;
        terminatedList.push(runningProcess);

        // Free RAM partition
        const part = memoryPartitions.find(p => p.allocatedTo === runningProcess.pid);
        if (part) part.allocatedTo = null;

        // Release mutex resources
        availableResources[0] = Math.min(totalResources[0], availableResources[0] + runningProcess.resReq[0]);
        availableResources[1] = Math.min(totalResources[1], availableResources[1] + runningProcess.resReq[1]);
        availableResources[2] = Math.min(totalResources[2], availableResources[2] + runningProcess.resReq[2]);

        logEntry(eventLog, 'success', `[T=${time}] ${runningProcess.pid} Terminated (CT=${runningProcess.ct}, TAT=${runningProcess.tat}, WT=${runningProcess.wt}). Partition ${part?.id || 'M?'} and resources reclaimed.`);
        runningProcess = null;
        currentQuantumTick = 0;
      }
      // Round Robin Quantum Expired
      else if (schedulingPolicy === 'rr' && currentQuantumTick >= timeQuantum) {
        logEntry(eventLog, 'info', `[T=${time}] ${runningProcess.pid} time quantum (${timeQuantum} ticks) expired. Preempted to tail of Ready Queue.`);
        runningProcess.state = 'ready';
        readyQueue.push(runningProcess);
        runningProcess = null;
        currentQuantumTick = 0;
      }
    }

    // 4. Dispatch CPU if idle
    if (!runningProcess && readyQueue.length > 0) {
      if (schedulingPolicy === 'sjf') {
        // Shortest Remaining Time First
        readyQueue.sort((a, b) => a.remBt - b.remBt);
      }
      runningProcess = readyQueue.shift();
      runningProcess.state = 'running';
      currentQuantumTick = 0;
      playTick();

      logEntry(eventLog, 'info', `[T=${time}] Dispatcher assigned CPU to ${runningProcess.pid} (Remaining Burst: ${runningProcess.remBt}t).`);
    }

    // 5. Record Gantt Block
    const currentPid = runningProcess ? runningProcess.pid : 'IDLE';
    const lastBlock = ganttTrace[ganttTrace.length - 1];
    if (lastBlock && lastBlock.pid === currentPid) {
      lastBlock.end = time;
    } else {
      ganttTrace.push({ pid: currentPid, start: time - 1, end: time });
    }

    updateUI();

    // 6. Check if simulation complete
    if (jobs.every(j => j.state === 'terminated')) {
      stopSimulation();
      playSuccessSound();
      logEntry(eventLog, 'success', `[T=${time}] ★ All processes have terminated successfully. Multiprogramming simulation completed.`);
    }
  }

  function startSimulation() {
    if (isRunning) return;
    isRunning = true;
    playRunSound();
    btnStart.disabled = true;
    btnPause.disabled = false;
    timerId = setInterval(stepSimulation, speedMs);
  }

  function stopSimulation() {
    isRunning = false;
    if (timerId) clearInterval(timerId);
    timerId = null;
    btnStart.disabled = false;
    btnPause.disabled = true;
  }

  function resetAll() {
    stopSimulation();
    time = 0;
    jobs = JSON.parse(JSON.stringify(initialJobs));
    memoryPartitions.forEach(p => p.allocatedTo = null);
    diskHead = 50;
    diskQueue = [];
    totalHeadMovement = 0;
    availableResources = [...totalResources];
    runningProcess = null;
    readyQueue = [];
    waitingQueue = [];
    terminatedList = [];
    ganttTrace = [];
    currentQuantumTick = 0;
    if (intPipeline3D) intPipeline3D.reset(initialJobs);
    eventLog.innerHTML = '<div class="log-entry info">[T=0] Workbench reset. All subsystems and process queues re-initialized.</div>';
    updateUI();
  }

  // Event Listeners
  btnStart.addEventListener('click', startSimulation);
  btnStep.addEventListener('click', stepSimulation);
  btnPause.addEventListener('click', stopSimulation);
  btnReset.addEventListener('click', resetAll);

  cpuPolicySelect.addEventListener('change', () => {
    schedulingPolicy = cpuPolicySelect.value;
    logEntry(eventLog, 'info', `[T=${time}] CPU Scheduling policy changed to: ${cpuPolicySelect.options[cpuPolicySelect.selectedIndex].text}`);
    updateUI();
  });

  speedSlider.addEventListener('input', (e) => {
    speedMs = parseInt(e.target.value, 10);
    speedLabel.textContent = `${speedMs}ms`;
    if (isRunning) {
      clearInterval(timerId);
      timerId = setInterval(stepSimulation, speedMs);
    }
  });

  container.querySelector('#btn-clear-int-log').addEventListener('click', () => {
    eventLog.innerHTML = '';
  });

  registerCleanup(() => {
    stopSimulation();
    if (intPipeline3D?.destroy) intPipeline3D.destroy();
  });

  updateUI();
}
