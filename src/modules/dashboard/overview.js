/**
 * OS Nexus : Overview / Dashboard
 */
import { navigate } from '../../app/router.js';
import { EXPERIMENTS } from '../../data/experiments.js';

export function renderOverview(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">OS Nexus <span style="color:var(--accent-teal)">Workbench</span></h1>
      <p class="page-subtitle">Interactive Operating System Workbench: Real-time simulation of scheduling, concurrency, virtual memory, and I/O subsystems</p>
    </div>

    <!-- Product Info Banner -->
    <div class="info-box" style="margin-bottom:var(--space-6)">
      <strong>Professional OS Simulator:</strong> OS Nexus is a modular, rule-based operating system simulator designed for exploring core systems concepts.
      All scheduling, synchronization, paging, and resource allocation calculations use deterministic algorithms without external dependencies.
    </div>

    <!-- Quick stats -->
    <div class="stat-grid" style="margin-bottom:var(--space-8)">
      <div class="stat-card"><div class="stat-label">Core Subsystems</div><div class="stat-value teal">7</div></div>
      <div class="stat-card"><div class="stat-label">OS Algorithms</div><div class="stat-value amber">12</div></div>
      <div class="stat-card"><div class="stat-label">Simulators</div><div class="stat-value">6</div></div>
      <div class="stat-card"><div class="stat-label">Viva Question Bank</div><div class="stat-value green">60+</div></div>
    </div>

    <!-- Module quick-access grid -->
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
      <h2 class="section-title" style="margin:0">System Simulators &amp; Labs</h2>
      <a href="#integrated" class="btn btn-primary btn-sm" id="btn-hero-launch-workbench">▶ Launch Integrated Workbench</a>
    </div>
    <div class="grid-3" style="margin-bottom:var(--space-8)" id="module-grid"></div>

    <!-- OS Subsystem diagram -->
    <h2 class="section-title">Operating System Subsystems Architecture</h2>
    <div class="card" style="margin-bottom:var(--space-8)">
      <div id="subsystem-diagram"></div>
    </div>

    <!-- Capabilities & Execution Roadmap -->
    <div class="grid-2" style="margin-bottom:var(--space-8)">
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">Simulator Capabilities</h3>
        <div class="impl-status" id="impl-status"></div>
      </div>
      <div class="card">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">Learning &amp; Execution Pathway</h3>
        <div id="roadmap"></div>
      </div>
    </div>

    <!-- Lab Manual & Experiments Reference mini -->
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
      <h2 class="section-title" style="margin:0">Curriculum &amp; Lab Manual Reference</h2>
      <a href="#catalogue" class="btn btn-secondary btn-sm" id="btn-view-all-experiments">View Full Lab Manual →</a>
    </div>
    <div class="grid-auto" id="exp-mini-grid"></div>
  `;

  renderModuleGrid(container.querySelector('#module-grid'));
  renderSubsystemDiagram(container.querySelector('#subsystem-diagram'));
  renderImplStatus(container.querySelector('#impl-status'));
  renderRoadmap(container.querySelector('#roadmap'));
  renderExpMini(container.querySelector('#exp-mini-grid'));

  container.querySelector('#btn-hero-launch-workbench')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('integrated');
  });

  container.querySelector('#btn-view-all-experiments')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('catalogue');
  });
}

const MODULES = [
  { icon: 'int', color: 'amber', title: 'Integrated Workbench', desc: 'Flagship end-to-end multiprogramming operating system simulation.', route: 'integrated', exps: 'Flagship' },
  { icon: 'cpu', color: 'teal', title: 'CPU Scheduling Lab', desc: 'FCFS, SJF, Priority, Round Robin scheduling with live Gantt charts.', route: 'cpu', exps: 'Scheduling' },
  { icon: 'conc', color: 'amber', title: 'Concurrency Lab', desc: 'Mutex, Semaphore, Producer-Consumer, Dining Philosophers.', route: 'concurrency', exps: 'Synchronization' },
  { icon: 'mem', color: 'blue', title: 'Memory Management', desc: 'FIFO, LRU, Optimal page replacement, Contiguous allocation & MMU paging.', route: 'memory', exps: 'Paging & Alloc' },
  { icon: 'disk', color: 'purple', title: 'Disk Scheduling', desc: 'FCFS and SSTF disk scheduling with cylinder head visualization.', route: 'disk', exps: 'I/O Scheduling' },
  { icon: 'res', color: 'green', title: 'Resource Allocation', desc: "Banker's Algorithm for deadlock avoidance and safety analysis.", route: 'resources', exps: 'Deadlocks' },
  { icon: 'fs', color: 'teal', title: 'Virtual File System', desc: 'Simulated file manager with CRUD, directory navigation and metadata.', route: 'filesystem', exps: 'Storage' },
  { icon: 'cat', color: 'blue', title: 'Lab Manual & Experiments', desc: 'Official curriculum reference with theory, algorithms, and C source code.', route: 'catalogue', exps: 'Curriculum' },
  { icon: 'viva', color: 'purple', title: 'Viva Voce & Reports', desc: 'Interactive oral exam trainer and printable lab manual report generator.', route: 'viva', exps: 'Preparation' },
];

const SVG_ICONS = {
  cpu: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5" y="5" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 1V3.5M12.5 1V3.5M7.5 16.5V19M12.5 16.5V19M1 7.5H3.5M1 12.5H3.5M16.5 7.5H19M16.5 12.5H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  conc: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 10H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  mem: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 5V15M10 5V15M13 5V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  disk: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
  res: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
  fs: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5.5C3 4.7 3.7 4 4.5 4H8L9.5 5.5H15.5C16.3 5.5 17 6.2 17 7V15C17 15.8 16.3 16.5 15.5 16.5H4.5C3.7 16.5 3 15.8 3 15V5.5Z" stroke="currentColor" stroke-width="1.5"/></svg>`,
  int: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 6V10L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  cat: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 8H13M7 11H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  viva: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3H17V13H12L10 16L8 13H3V3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 8H13M7 10.5H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function renderModuleGrid(el) {
  el.innerHTML = MODULES.map(m => `
    <a class="module-card" data-route="${m.route}" href="#${m.route}" role="button" tabindex="0">
      <div class="module-icon ${m.color}">${SVG_ICONS[m.icon] || ''}</div>
      <div class="module-title">${m.title}</div>
      <div class="module-desc">${m.desc}</div>
      <div class="module-exps">${m.exps}</div>
    </a>`).join('');

  el.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.route);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(el.dataset.route); }
    });
  });
}

function renderSubsystemDiagram(el) {
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-4);flex-wrap:wrap;padding:var(--space-4);">
      ${subsysBox('CPU Scheduler', 'teal', 'FCFS · SJF · RR · Priority')}
      <div style="color:var(--text-tertiary);font-size:1.2rem">⇄</div>
      ${subsysBox('Memory Manager', 'blue', 'Paging · FIFO · LRU · Optimal')}
      <div style="color:var(--text-tertiary);font-size:1.2rem">⇄</div>
      ${subsysBox('Disk Scheduler', 'purple', 'FCFS · SSTF')}
      <div style="color:var(--text-tertiary);font-size:1.2rem">⇄</div>
      ${subsysBox('Resource Manager', 'green', "Banker's Algorithm")}
      <div style="color:var(--text-tertiary);font-size:1.2rem">⇄</div>
      ${subsysBox('File System', 'amber', 'Virtual FS · CRUD · Search')}
    </div>
    <p style="text-align:center;color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-3)">
      Unified multi-subsystem operating architecture: Interactive &amp; Deterministic
    </p>`;
}

function subsysBox(title, color, desc) {
  const colors = { teal:'var(--accent-teal)', blue:'var(--accent-blue)', purple:'var(--accent-purple)', green:'var(--accent-green)', amber:'var(--accent-amber)' };
  const c = colors[color] || 'var(--accent-teal)';
  return `<div style="background:var(--bg-elevated);border:1px solid ${c}40;border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);text-align:center;min-width:130px;">
    <div style="font-weight:600;font-size:var(--text-sm);color:${c};margin-bottom:4px;">${title}</div>
    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${desc}</div>
  </div>`;
}

const IMPL_STATUS = [
  { label: 'Integrated Workbench Simulation', status: 'done' },
  { label: 'CPU Scheduling (FCFS, SJF, Priority, RR)', status: 'done' },
  { label: 'Gantt Chart Visualization', status: 'done' },
  { label: 'Page Replacement (FIFO, LRU, Optimal)', status: 'done' },
  { label: 'Contiguous Memory Allocation (First/Best/Worst Fit)', status: 'done' },
  { label: 'Hardware Paging Address Translation MMU', status: 'done' },
  { label: 'Disk Scheduling (FCFS, SSTF)', status: 'done' },
  { label: "Banker's Deadlock Avoidance Algorithm", status: 'done' },
  { label: 'Virtual File System', status: 'done' },
  { label: 'Concurrency Lab (Mutex, Semaphore)', status: 'done' },
  { label: 'Producer-Consumer Synchronization', status: 'done' },
  { label: 'Dining Philosophers Problem', status: 'done' },
  { label: 'Academic Lab Manual & Experiments Directory', status: 'done' },
  { label: 'Oral Exam (Viva Voce) & Report PDF Generator', status: 'done' },
];

function renderImplStatus(el) {
  el.innerHTML = IMPL_STATUS.map(s => `
    <div class="impl-row">
      <div class="impl-dot ${s.status}"></div>
      <span class="impl-name">${s.label}</span>
      <span class="impl-label">${s.status === 'done' ? '✓' : s.status === 'partial' ? '~' : '–'}</span>
    </div>`).join('');
}

function renderRoadmap(el) {
  const steps = [
    { n: '1', label: 'CPU Scheduling', desc: 'Process execution order with FCFS, SJF, Priority & Round Robin' },
    { n: '2', label: 'Process Synchronization', desc: 'Mutex locks, counting semaphores & concurrency primitives' },
    { n: '3', label: 'Deadlock Avoidance', desc: "Resource allocation safety via Banker's algorithm" },
    { n: '4', label: 'Virtual Memory & Paging', desc: 'Page replacement algorithms & hardware address translation' },
    { n: '5', label: 'Disk I/O Scheduling', desc: 'Secondary storage seek optimization with FCFS & SSTF' },
    { n: '6', label: 'Virtual File System', desc: 'In-memory directory hierarchy and file operations' },
    { n: '7', label: 'Integrated OS Workbench', desc: 'Unified end-to-end multiprogramming simulation' },
  ];
  el.innerHTML = steps.map((s, i) => `
    <div style="display:flex;gap:var(--space-3);align-items:flex-start;${i < steps.length - 1 ? 'margin-bottom:var(--space-3)' : ''}">
      <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-teal-glow);border:1px solid var(--accent-teal-dim);color:var(--accent-teal);font-size:var(--text-xs);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${s.n}</div>
      <div>
        <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">${s.label}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${s.desc}</div>
      </div>
    </div>`).join('');
}

function renderExpMini(el) {
  el.innerHTML = EXPERIMENTS.map(exp => `
    <a class="card card-link" data-expid="${exp.id}" href="#catalogue" style="display:flex;flex-direction:column;gap:var(--space-2)">
      <div class="exp-badge teal">Exp ${exp.id}</div>
      <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">${exp.title}</div>
      <div style="font-size:var(--text-xs);color:var(--text-tertiary);text-transform:capitalize">${exp.category}</div>
    </a>`).join('');

  el.querySelectorAll('[data-expid]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('catalogue', { expId: parseInt(el.dataset.expid) });
    });
  });
}
