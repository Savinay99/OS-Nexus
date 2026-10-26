/**
 * OS Nexus : Shared UI Utilities
 */
import { animateTabSwitch } from './animations.js';
import { playTick } from './workstation-audio.js';
import { gsap } from 'gsap';

/** Render a Gantt chart into a container element */
export function renderGantt(container, gantt, totalTime) {
  if (!gantt || gantt.length === 0) { container.innerHTML = '<p class="text-sm" style="color:var(--text-tertiary)">No Gantt data.</p>'; return; }

  const span = totalTime || gantt[gantt.length - 1].end;
  const html = `
    <div class="gantt-chart">
      <div class="gantt-row">
        <div class="gantt-label"></div>
        <div class="gantt-track" style="position:relative;height:40px;overflow:visible;">
          ${gantt.map(b => {
            const left  = (b.start / span) * 100;
            const width = ((b.end - b.start) / span) * 100;
            const cls   = b.pid === 'IDLE' ? 'gantt-idle' : `p${b.color ?? 0}`;
            const label = b.pid === 'IDLE' ? 'idle' : b.pid;
            return `<div class="gantt-block ${cls}" style="left:${left}%;width:${width}%;border-radius:3px;"
                      title="${b.pid}: ${b.start}–${b.end}" aria-label="${label} from ${b.start} to ${b.end}">
                      ${width > 4 ? label : ''}
                    </div>`;
          }).join('')}
        </div>
      </div>
      <div class="gantt-axis">
        ${getAxisTicks(gantt, span).map(t => `<span class="gantt-tick" style="left:${(t / span) * 100}%">${t}</span>`).join('')}
      </div>
    </div>`;
  container.innerHTML = html;
}

function getAxisTicks(gantt, span) {
  const ticks = new Set();
  for (const b of gantt) { ticks.add(b.start); ticks.add(b.end); }
  return [...ticks].sort((a, b) => a - b);
}

/** Render a results table for CPU scheduling */
export function renderScheduleTable(container, schedule) {
  if (!schedule || schedule.length === 0) { container.innerHTML = ''; return; }
  const rows = schedule.map(p => `
    <tr>
      <td class="td-label">${p.id}</td>
      <td>${p.at}</td>
      <td>${p.bt}</td>
      ${p.priority != null ? `<td>${p.priority}</td>` : ''}
      <td>${p.start}</td>
      <td>${p.ct}</td>
      <td>${p.tat}</td>
      <td>${p.wt}</td>
      <td>${p.rt}</td>
    </tr>`).join('');

  const hasPriority = schedule[0]?.priority != null;
  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Process</th><th>AT</th><th>BT</th>
            ${hasPriority ? '<th>Priority</th>' : ''}
            <th>Start</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/** Render stat cards for scheduling metrics */
export function renderMetrics(container, metrics) {
  if (!metrics || !metrics.n) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Avg TAT</div>
        <div class="stat-value teal">${metrics.avgTAT.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg WT</div>
        <div class="stat-value amber">${metrics.avgWT.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg RT</div>
        <div class="stat-value">${metrics.avgRT.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">CPU Util</div>
        <div class="stat-value green">${metrics.cpuUtil.toFixed(1)}%</div>
      </div>
    </div>`;
}

/** Show modal */
export function showModal(title, bodyHTML, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const actionsEl = document.getElementById('modal-actions');
  actionsEl.innerHTML = '';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.className = `btn ${a.cls || 'btn-secondary'}`;
    btn.textContent = a.label;
    btn.addEventListener('click', () => { hideModal(); a.fn?.(); });
    actionsEl.appendChild(btn);
  }
  overlay.classList.remove('hidden');
  const box = overlay.querySelector('.modal-box');
  if (box) {
    gsap.fromTo(
      box,
      { opacity: 0, scale: 0.95, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'power2.out', clearProps: 'transform' }
    );
  }
  overlay.querySelector('.modal-close')?.focus();
}

export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  const box = overlay.querySelector('.modal-box');
  if (box) {
    gsap.to(box, {
      opacity: 0,
      scale: 0.96,
      y: -6,
      duration: 0.12,
      ease: 'power2.in',
      onComplete: () => {
        overlay.classList.add('hidden');
        gsap.set(box, { clearProps: 'all' });
      }
    });
  } else {
    overlay.classList.add('hidden');
  }
}

/** Parse a page reference string like "7,0,1,2,0,3" */
export function parseRefString(input) {
  if (!input || !input.trim()) throw new Error('Page reference string is empty.');
  return input.split(/[\s,]+/).filter(Boolean).map(s => {
    const n = parseInt(s, 10);
    if (isNaN(n) || n < 0) throw new Error(`Invalid page number: "${s}"`);
    return n;
  });
}

/** Validate and parse process table from DOM rows */
export function parseProcessTable(tableBody, hasPriority = false) {
  const rows = tableBody.querySelectorAll('tr');
  if (rows.length === 0) throw new Error('No processes defined.');
  const processes = [];
  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    const id  = inputs[0]?.value.trim() || 'P?';
    const at  = parseInt(inputs[1]?.value, 10);
    const bt  = parseInt(inputs[2]?.value, 10);
    const pri = hasPriority ? parseInt(inputs[3]?.value, 10) : undefined;

    if (isNaN(at) || at < 0) throw new Error(`Process ${id}: invalid arrival time.`);
    if (isNaN(bt) || bt <= 0) throw new Error(`Process ${id}: burst time must be > 0.`);
    if (hasPriority && isNaN(pri)) throw new Error(`Process ${id}: invalid priority.`);

    processes.push({ id, at, bt, ...(hasPriority ? { priority: pri } : {}) });
  }
  return processes;
}

/** Format time as fixed 2 decimal */
export function fmt2(n) { return typeof n === 'number' ? n.toFixed(2) : '-'; }

/** Render page replacement step table */
export function renderPageTable(container, steps, frames) {
  if (!steps || steps.length === 0) { container.innerHTML = ''; return; }
  const cols = Array.from({ length: frames }, (_, i) => `F${i + 1}`);
  const header = `<tr><th>Ref</th>${cols.map(c => `<th class="center">${c}</th>`).join('')}<th class="center">Result</th></tr>`;
  const bodyRows = steps.map(s => {
    const frameCells = cols.map((_, fi) => {
      const val = s.frames[fi] !== undefined ? s.frames[fi] : '';
      return `<td class="center mono">${val !== '' ? val : '-'}</td>`;
    }).join('');
    const result = s.hit ? '<span class="badge badge-running">HIT</span>' : '<span class="badge badge-blocked">FAULT</span>';
    return `<tr><td class="center mono">${s.page}</td>${frameCells}<td class="center">${result}</td></tr>`;
  }).join('');

  container.innerHTML = `<div class="table-wrap"><table><thead>${header}</thead><tbody>${bodyRows}</tbody></table></div>`;
}

/** Show an error message in a container */
export function showError(container, msg) {
  container.innerHTML = `<div class="info-box red"><strong>Error:</strong> ${escapeHtml(msg)}</div>`;
}

/** Escape HTML for safe display */
export function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Add an entry to a log element */
export function logEntry(logEl, type, msg) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="log-time">[${time}]</span><span class="log-${type}">${escapeHtml(msg)}</span>`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

/** Build a process input table with add/remove rows */
export function buildProcessTable(container, hasPriority = false, initialRows = 4) {
  const thPriority = hasPriority ? '<th class="center" style="width:120px;">Priority</th>' : '';
  container.innerHTML = `
    <div class="process-table-card">
      <table class="process-table">
        <thead>
          <tr>
            <th style="width:100px;">PID</th>
            <th class="center" style="width:150px;">Arrival Time (ms)</th>
            <th class="center" style="width:150px;">Burst Time (ms)</th>
            ${thPriority}
            <th class="center" style="width:50px;"></th>
          </tr>
        </thead>
        <tbody id="proc-tbody"></tbody>
      </table>
    </div>
    <div style="margin-top:var(--space-3); margin-bottom:var(--space-2);">
      <button type="button" class="btn btn-secondary btn-sm" id="add-proc-btn">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-right:4px;" aria-hidden="true"><path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add Process
      </button>
    </div>`;

  const tbody = container.querySelector('#proc-tbody');
  const defaultData = [
    { id: 'P1', at: 0, bt: 5, pr: 2 },
    { id: 'P2', at: 1, bt: 3, pr: 1 },
    { id: 'P3', at: 2, bt: 8, pr: 3 },
    { id: 'P4', at: 3, bt: 6, pr: 2 },
  ];

  for (let i = 0; i < initialRows; i++) {
    const d = defaultData[i] || { id: `P${i + 1}`, at: 0, bt: 1, pr: 1 };
    addProcessRow(tbody, d.id, d.at, d.bt, hasPriority ? d.pr : null);
  }

  container.querySelector('#add-proc-btn').addEventListener('click', () => {
    const n = tbody.rows.length + 1;
    addProcessRow(tbody, `P${n}`, 0, 1, hasPriority ? 1 : null);
  });
}

function addProcessRow(tbody, id, at, bt, priority) {
  const tr = document.createElement('tr');
  const priCell = priority !== null
    ? `<td class="center"><input type="number" class="proc-input" value="${priority}" min="1" max="10" aria-label="Priority" /></td>`
    : '';
  tr.innerHTML = `
    <td><input type="text" class="proc-input proc-id" value="${id}" maxlength="6" aria-label="Process ID" /></td>
    <td class="center"><input type="number" class="proc-input" value="${at}" min="0" aria-label="Arrival Time" /></td>
    <td class="center"><input type="number" class="proc-input" value="${bt}" min="1" aria-label="Burst Time" /></td>
    ${priCell}
    <td class="center">
      <button type="button" class="del-btn" aria-label="Remove process" title="Remove process">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </td>`;
  tbody.appendChild(tr);
  tr.querySelector('.del-btn').addEventListener('click', () => {
    if (tbody.querySelectorAll('tr').length > 1) {
      tr.remove();
    }
  });
}

/** Build a viva Q&A section */
export function renderVivaQA(container, vivaQA) {
  container.innerHTML = vivaQA.map(({ q, a }) => `
    <div class="viva-item">
      <p class="viva-q">${escapeHtml(q)}</p>
      <p class="viva-a">${escapeHtml(a)}</p>
    </div>`).join('');
}

/** Build a C code block */
export function renderCCode(container, code, filename = 'algorithm.c') {
  container.innerHTML = `
    <div class="c-code">
      <div class="c-code-header">
        <span>${escapeHtml(filename)}</span>
        <button class="btn btn-ghost btn-sm" id="copy-code-btn">Copy</button>
      </div>
      <pre><code>${escapeHtml(code)}</code></pre>
    </div>`;
  container.querySelector('#copy-code-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(code).then(() => {
      const btn = container.querySelector('#copy-code-btn');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 1500); }
    });
  });
}

/** Render theory accordion */
export function renderTheoryAccordion(container, exp) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-1)">
      ${accordionItem('Aim', `<p>${escapeHtml(exp.aim)}</p>`)}
      ${accordionItem('Theory', `<p style="white-space:pre-wrap">${escapeHtml(exp.theory)}</p>`)}
      ${accordionItem('Algorithm Steps', `<ol style="padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2)">${exp.algorithm.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`)}
      ${exp.complexity ? accordionItem('Complexity', `<p>Time: <code>${exp.complexity.time}</code></p><p>Space: <code>${exp.complexity.space}</code></p>`) : ''}
    </div>`;

  container.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.nextElementSibling.classList.toggle('open', !expanded);
    });
  });
}

function accordionItem(title, content) {
  return `
    <div class="accordion-item">
      <button type="button" class="accordion-trigger" aria-expanded="false">
        ${escapeHtml(title)}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="accordion-content">${content}</div>
    </div>`;
}

/** Tabs setup */
export function setupTabs(container) {
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.tab;
      const wasActive = btn.classList.contains('active');
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      container.querySelectorAll('.tab-panel').forEach(p => {
        const isActive = p.id === panelId;
        p.classList.toggle('active', isActive);
        if (isActive && !wasActive) {
          animateTabSwitch(p);
        }
      });
      if (!wasActive) playTick();
    });
  });
  // Activate active or first tab
  const activeBtn = container.querySelector('.tab-btn.active') || container.querySelector('.tab-btn');
  if (activeBtn) activeBtn.click();
}
