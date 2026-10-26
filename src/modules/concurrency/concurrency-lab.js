/**
 * OS Nexus: Concurrency Lab (Experiments 3, 4, 5)
 * Mutex/Semaphore, Producer-Consumer, Dining Philosophers
 * All simulations are deterministic and educational only.
 */
import { showError, renderVivaQA, renderCCode, renderTheoryAccordion, setupTabs, logEntry } from '../../shared/ui.js';
import { EXPERIMENTS } from '../../data/experiments.js';
import { initPhilosophers3D } from '../../shared/workstation-3d.js';
import { playTick, playRunSound, playSuccessSound, playFaultAlert } from '../../shared/workstation-audio.js';
import { registerCleanup } from '../../app/router.js';

export function renderConcurrencyLab(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Concurrency Lab</h1>
      <p class="page-subtitle">Mutex Locks, Counting Semaphores, Producer-Consumer Buffer, and Dining Philosophers Synchronization</p>
    </div>
    <div class="info-box amber" style="margin-bottom:var(--space-4)">
      <strong>Simulation Disclaimer:</strong> These are step-driven deterministic educational simulations, not real OS thread schedulers.
      They demonstrate the logic and states of synchronization primitives without actual concurrent execution.
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="tab-mutex" role="tab">Mutex &amp; Semaphore</button>
      <button class="tab-btn" data-tab="tab-prodcon" role="tab">Producer-Consumer</button>
      <button class="tab-btn" data-tab="tab-dining" role="tab">Dining Philosophers</button>
      <button class="tab-btn" data-tab="tab-conc-theory" role="tab">Theory &amp; Code</button>
    </div>

    <!-- Mutex Tab -->
    <div class="tab-panel active" id="tab-mutex" role="tabpanel">
      <div class="grid-2" style="gap:var(--space-4)">
        <div class="card">
          <h2 class="card-title" style="margin-bottom:var(--space-4)">Binary Semaphore / Mutex Demo</h2>
          <div class="form-group" style="margin-bottom:var(--space-4)">
            <label class="form-label" for="mutex-threads">Number of Threads</label>
            <input id="mutex-threads" class="form-input" type="number" value="3" min="2" max="6" style="max-width:120px"/>
          </div>
          <div class="row" style="gap:var(--space-3);margin-bottom:var(--space-4)">
            <button class="btn btn-primary" id="mutex-run">▶ Simulate</button>
            <button class="btn btn-secondary" id="mutex-reset">Reset</button>
          </div>

          <div id="mutex-state" style="margin-bottom:var(--space-4)"></div>
          <div id="mutex-log" class="event-log" style="min-height:120px"></div>
        </div>

        <div class="card">
          <h2 class="card-title" style="margin-bottom:var(--space-3)">Counting Semaphore Demo</h2>
          <p class="card-subtitle" style="margin-bottom:var(--space-4)">Allows up to N threads to access a resource simultaneously.</p>
          <div class="form-group" style="margin-bottom:var(--space-3)">
            <label class="form-label" for="sem-value">Semaphore Value (N)</label>
            <input id="sem-value" class="form-input" type="number" value="3" min="1" max="8" style="max-width:120px"/>
          </div>
          <div class="form-group" style="margin-bottom:var(--space-4)">
            <label class="form-label" for="sem-threads">Threads Requesting</label>
            <input id="sem-threads" class="form-input" type="number" value="5" min="1" max="10" style="max-width:120px"/>
          </div>
          <div class="row" style="gap:var(--space-3);margin-bottom:var(--space-4)">
            <button class="btn btn-primary" id="sem-run">▶ Simulate</button>
            <button class="btn btn-secondary" id="sem-reset">Reset</button>
          </div>
          <div id="sem-state" style="margin-bottom:var(--space-4)"></div>
          <div id="sem-log" class="event-log" style="min-height:120px"></div>
        </div>
      </div>
    </div>

    <!-- Producer-Consumer Tab -->
    <div class="tab-panel" id="tab-prodcon" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-4)">Bounded Buffer: Producer-Consumer</h2>
        <div class="grid-2" style="gap:var(--space-4);margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label" for="pc-capacity">Buffer Capacity</label>
            <input id="pc-capacity" class="form-input" type="number" value="5" min="1" max="12" style="max-width:120px"/>
          </div>
        </div>
        <div class="row" style="gap:var(--space-3);margin-bottom:var(--space-4)">
          <button class="btn btn-primary" id="pc-produce">+ Produce</button>
          <button class="btn btn-amber" id="pc-consume">− Consume</button>
          <button class="btn btn-secondary" id="pc-reset">Reset Buffer</button>
        </div>
        <h3 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2)">Buffer State</h3>
        <div id="pc-buffer-vis"></div>
        <div id="pc-semaphores" style="margin:var(--space-4) 0"></div>
      </div>
      <div id="pc-log" class="event-log" style="min-height:160px"></div>
    </div>

    <!-- Dining Philosophers Tab -->
    <div class="tab-panel" id="tab-dining" role="tabpanel">
      <div class="card">
        <h2 class="card-title" style="margin-bottom:var(--space-2)">Dining Philosophers</h2>
        <p class="card-subtitle" style="margin-bottom:var(--space-4)">5 philosophers, 5 forks. Safe strategy: Philosopher 4 picks right fork first (breaks circular wait).</p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
          <div>
            <h3 class="section-title" style="margin:0;">3D Dining Philosophers Table</h3>
            <p style="font-size:var(--text-xs); color:var(--text-muted); margin:3px 0 0 0;">Interactive WebGL Table: Blue (Thinking), Amber (Hungry), Green (Eating with acquired forks)</p>
          </div>
        </div>
        <div id="dining-3d-wrap" style="height:230px; width:100%; border-radius:var(--radius-md); overflow:hidden; background:#090d16; border:1px solid var(--border-default); margin-bottom:var(--space-4);"></div>

        <div class="row" style="gap:var(--space-3);margin-bottom:var(--space-4)">
          <button class="btn btn-primary" id="dining-step">Step →</button>
          <button class="btn btn-amber" id="dining-auto">Auto Play</button>
          <button class="btn btn-secondary" id="dining-reset">Reset</button>
          <button class="btn btn-danger" id="dining-deadlock">Show Deadlock Risk</button>
        </div>
        <div class="grid-2" style="gap:var(--space-6)">
          <div>
            <div id="dining-table"></div>
          </div>
          <div>
            <h3 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Philosopher States</h3>
            <div id="dining-states" style="margin-bottom:var(--space-4)"></div>
            <div id="dining-log" class="event-log" style="min-height:160px"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Theory -->
    <div class="tab-panel" id="tab-conc-theory" role="tabpanel">
      <div class="grid-3">
        ${[3,4,5].map(i => `
          <div class="card">
            <div class="exp-badge teal" style="margin-bottom:var(--space-3)">Exp ${i}</div>
            <div id="conc-theory-${i}"></div>
            <div id="conc-viva-${i}" style="margin-top:var(--space-4)"></div>
          </div>`).join('')}
      </div>
      <div class="card" style="margin-top:var(--space-4)">
        <h3 class="card-title" style="margin-bottom:var(--space-4)">C Source Code: Semaphore</h3>
        <div id="conc-ccode"></div>
      </div>
    </div>
  `;

  setupMutexSim(container);
  setupSemaphoreSim(container);
  setupProducerConsumer(container);
  setupDiningPhilosophers(container);

  [3,4,5].forEach(i => {
    const exp = EXPERIMENTS[i - 1];
    renderTheoryAccordion(container.querySelector(`#conc-theory-${i}`), exp);
    renderVivaQA(container.querySelector(`#conc-viva-${i}`), exp.vivaQA);
  });
  renderCCode(container.querySelector('#conc-ccode'), EXPERIMENTS[2].cCode, 'semaphore.c');
  setupTabs(container);
}

/* ─── Mutex Simulation ─── */
function setupMutexSim(container) {
  let simInterval = null;

  registerCleanup(() => {
    if (simInterval) clearInterval(simInterval);
  });

  function simulate() {
    clearInterval(simInterval);
    const n = parseInt(container.querySelector('#mutex-threads').value, 10) || 3;
    const log = container.querySelector('#mutex-log');
    log.innerHTML = '';
    const stateEl = container.querySelector('#mutex-state');

    const threads = Array.from({ length: n }, (_, i) => ({ id: i, state: 'waiting' }));
    let mutexHeld = -1;
    let mutexQueue = [...threads.map(t => t.id)];
    let step = 0;

    const states = ['Waiting', 'Acquiring', 'In Critical Section', 'Releasing', 'Done'];

    simInterval = setInterval(() => {
      if (step >= n * 4) { clearInterval(simInterval); return; }

      if (mutexHeld === -1 && mutexQueue.length > 0) {
        const tid = mutexQueue.shift();
        mutexHeld = tid;
        threads[tid].state = 'running';
        logEntry(log, 'success', `Thread ${tid}: acquired mutex: entering critical section`);
      } else if (mutexHeld !== -1) {
        const tid = mutexHeld;
        threads[tid].state = 'done';
        logEntry(log, 'info', `Thread ${tid}: releasing mutex: exiting critical section`);
        mutexHeld = -1;
      }

      stateEl.innerHTML = `
        <div class="row" style="flex-wrap:wrap;gap:var(--space-2)">
          ${threads.map(t => `<span class="badge badge-${t.state === 'running' ? 'running' : t.state === 'done' ? 'terminated' : 'waiting'}">T${t.id}: ${t.state}</span>`).join('')}
        </div>
        <div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)">mutex = ${mutexHeld === -1 ? '1 (free)' : '0 (held by T' + mutexHeld + ')'}</div>`;
      step++;
    }, 800);
  }

  container.querySelector('#mutex-run').addEventListener('click', simulate);
  container.querySelector('#mutex-reset').addEventListener('click', () => {
    clearInterval(simInterval);
    container.querySelector('#mutex-log').innerHTML = '';
    container.querySelector('#mutex-state').innerHTML = '';
  });
}

/* ─── Counting Semaphore ─── */
function setupSemaphoreSim(container) {
  container.querySelector('#sem-run').addEventListener('click', () => {
    const N = parseInt(container.querySelector('#sem-value').value, 10) || 3;
    const T = parseInt(container.querySelector('#sem-threads').value, 10) || 5;
    const log = container.querySelector('#sem-log');
    const stateEl = container.querySelector('#sem-state');
    log.innerHTML = '';
    let semVal = N;
    const waiting = [];
    const active = [];

    logEntry(log, 'info', `Semaphore initialized to ${N}. ${T} threads requesting access.`);

    for (let i = 0; i < T; i++) {
      setTimeout(() => {
        if (semVal > 0) {
          semVal--;
          active.push(i);
          logEntry(log, 'success', `Thread ${i}: wait() → semaphore=${semVal}: access granted`);
        } else {
          waiting.push(i);
          logEntry(log, 'warn', `Thread ${i}: wait() → semaphore=0: BLOCKED`);
        }
        updateSemState();
      }, i * 300);

      setTimeout(() => {
        const idx = active.indexOf(i);
        if (idx !== -1) {
          active.splice(idx, 1);
          semVal++;
          if (waiting.length > 0) {
            const wt = waiting.shift();
            active.push(wt);
            semVal--;
            logEntry(log, 'success', `Thread ${wt}: signal() woke it up (semaphore=${semVal})`);
          }
          logEntry(log, 'info', `Thread ${i}: signal() → semaphore=${semVal}`);
          updateSemState();
        }
      }, (T + i) * 300);
    }

    function updateSemState() {
      stateEl.innerHTML = `
        <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-2)">
          <span style="font-size:var(--text-sm);color:var(--text-secondary)">Semaphore: <strong style="color:var(--accent-teal);font-family:var(--font-mono)">${semVal}</strong></span>
          <span style="font-size:var(--text-sm);color:var(--text-secondary)">Active: <strong style="color:var(--accent-green)">${active.length}</strong></span>
          <span style="font-size:var(--text-sm);color:var(--text-secondary)">Waiting: <strong style="color:var(--accent-amber)">${waiting.length}</strong></span>
        </div>`;
    }
  });

  container.querySelector('#sem-reset').addEventListener('click', () => {
    container.querySelector('#sem-log').innerHTML = '';
    container.querySelector('#sem-state').innerHTML = '';
  });
}

/* ─── Producer-Consumer ─── */
function setupProducerConsumer(container) {
  let buffer = [];
  let capacity = 5;
  let itemCount = 0;
  const log = container.querySelector('#pc-log');

  function getCapacity() { return parseInt(container.querySelector('#pc-capacity').value, 10) || 5; }
  function render() {
    capacity = getCapacity();
    const vis = container.querySelector('#pc-buffer-vis');
    vis.innerHTML = `<div class="buffer-wrap">
      ${Array.from({ length: capacity }, (_, i) => `
        <div class="buffer-slot ${i < buffer.length ? 'filled' : ''}" title="Slot ${i}">
          ${i < buffer.length ? buffer[i] : '-'}
        </div>`).join('')}
    </div>`;

    const full = buffer.length >= capacity;
    const empty = buffer.length === 0;
    container.querySelector('#pc-produce').disabled = full;
    container.querySelector('#pc-consume').disabled = empty;

    container.querySelector('#pc-semaphores').innerHTML = `
      <div style="display:flex;gap:var(--space-6);flex-wrap:wrap">
        <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">empty (slots free)</span><br/><span style="font-family:var(--font-mono);color:var(--accent-teal);font-size:var(--text-xl);font-weight:700">${capacity - buffer.length}</span></div>
        <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">full (items in buffer)</span><br/><span style="font-family:var(--font-mono);color:var(--accent-amber);font-size:var(--text-xl);font-weight:700">${buffer.length}</span></div>
        <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">mutex</span><br/><span style="font-family:var(--font-mono);color:var(--text-secondary);font-size:var(--text-xl);font-weight:700">1</span></div>
      </div>`;
  }

  container.querySelector('#pc-produce').addEventListener('click', () => {
    capacity = getCapacity();
    if (buffer.length >= capacity) { logEntry(log, 'warn', 'Producer: wait(empty) → buffer FULL, producer blocked'); return; }
    itemCount++;
    buffer.push(itemCount);
    logEntry(log, 'success', `Producer: produced item ${itemCount} → buffer[${buffer.length - 1}] = ${itemCount}`);
    render();
  });

  container.querySelector('#pc-consume').addEventListener('click', () => {
    if (buffer.length === 0) { logEntry(log, 'warn', 'Consumer: wait(full) → buffer EMPTY, consumer blocked'); return; }
    const item = buffer.shift();
    logEntry(log, 'info', `Consumer: consumed item ${item} → buffer size now ${buffer.length}`);
    render();
  });

  container.querySelector('#pc-reset').addEventListener('click', () => {
    buffer = []; itemCount = 0;
    log.innerHTML = '';
    render();
  });

  render();
}

/* ─── Dining Philosophers ─── */
function setupDiningPhilosophers(container) {
  const N = 5;
  const THINK = 'thinking', HUNGRY = 'hungry', EAT = 'eating';
  let states = Array(N).fill(THINK);
  let forks = Array(N).fill(false); // false = available
  let autoTimer = null;
  let stepIdx = 0;

  const dining3DWrap = container.querySelector('#dining-3d-wrap');
  const phil3D = initPhilosophers3D(dining3DWrap);

  registerCleanup(() => {
    if (autoTimer) clearInterval(autoTimer);
    if (phil3D?.destroy) phil3D.destroy();
  });

  // Sequence: 0 hungry→eat, 1 hungry→eat, 0 done, 1 done, 2 hungry→eat, ...
  const sequence = [
    { phil: 0, action: 'hungry' }, { phil: 1, action: 'hungry' },
    { phil: 0, action: 'eat' },   { phil: 2, action: 'hungry' },
    { phil: 0, action: 'done' },  { phil: 1, action: 'eat' },
    { phil: 3, action: 'hungry' }, { phil: 1, action: 'done' },
    { phil: 2, action: 'eat' },   { phil: 4, action: 'hungry' },
    { phil: 2, action: 'done' },  { phil: 3, action: 'eat' },
    { phil: 3, action: 'done' },  { phil: 4, action: 'eat' },
    { phil: 4, action: 'done' },
  ];

  function renderTable() {
    const el = container.querySelector('#dining-table');
    const cx = 150, cy = 150, r = 110, pr = 28;
    const positions = Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    const forkPositions = Array.from({ length: N }, (_, i) => {
      const angle = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
      const fr = 68;
      return { x: cx + fr * Math.cos(angle), y: cy + fr * Math.sin(angle) };
    });

    const colorMap = { thinking: '#60a5fa', hungry: '#f59e0b', eating: '#4ade80' };

    el.innerHTML = `
      <svg width="300" height="300" viewBox="0 0 300 300" style="display:block;margin:0 auto">
        <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4,3"/>
        ${forkPositions.map((fp, i) => `
          <rect x="${fp.x - 3}" y="${fp.y - 14}" width="6" height="28" rx="3"
            fill="${forks[i] ? '#f59e0b' : 'var(--border)'}" opacity="0.9"
            transform="rotate(${(i + 0.5) * 72 - 90}, ${fp.x}, ${fp.y})"
            title="Fork ${i}: ${forks[i] ? 'in use' : 'free'}"/>
        `).join('')}
        ${positions.map((p, i) => `
          <circle cx="${p.x}" cy="${p.y}" r="${pr}" fill="${colorMap[states[i]]}22" stroke="${colorMap[states[i]]}" stroke-width="2"/>
          <text x="${p.x}" y="${p.y - 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${colorMap[states[i]]}">P${i}</text>
          <text x="${p.x}" y="${p.y + 9}" text-anchor="middle" font-size="8" fill="var(--text-secondary)">${states[i]}</text>
        `).join('')}
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="10" fill="var(--text-tertiary)">Table</text>
      </svg>`;

    container.querySelector('#dining-states').innerHTML = `
      <div class="impl-status">
        ${states.map((s, i) => `<div class="impl-row">
          <div class="impl-dot ${s === 'eating' ? 'done' : s === 'hungry' ? 'partial' : 'pending'}"></div>
          <span class="impl-name">Philosopher ${i}</span>
          <span class="badge badge-${s === 'eating' ? 'running' : s === 'hungry' ? 'waiting' : 'ready'}">${s}</span>
        </div>`).join('')}
      </div>`;
  }

  function doStep() {
    if (stepIdx >= sequence.length) { stepIdx = 0; }
    const { phil, action } = sequence[stepIdx++];
    const log = container.querySelector('#dining-log');
    const leftFork = phil;
    const rightFork = (phil + 1) % N;
    const safeRight = phil === N - 1 ? leftFork : rightFork;
    const safeLeft = phil === N - 1 ? rightFork : leftFork;

    if (action === 'hungry') {
      states[phil] = HUNGRY;
      if (phil3D) phil3D.updateState(phil, 'HUNGRY');
      playTick();
      logEntry(log, 'warn', `P${phil}: HUNGRY: trying to pick up forks ${safeLeft} and ${safeRight}`);
    } else if (action === 'eat') {
      forks[safeLeft] = true; forks[safeRight] = true;
      states[phil] = EAT;
      if (phil3D) phil3D.updateState(phil, 'EATING');
      playSuccessSound();
      logEntry(log, 'success', `P${phil}: EATING: holding forks ${safeLeft} and ${safeRight}`);
    } else if (action === 'done') {
      forks[safeLeft] = false; forks[safeRight] = false;
      states[phil] = THINK;
      if (phil3D) phil3D.updateState(phil, 'THINKING');
      logEntry(log, 'info', `P${phil}: DONE: released forks ${safeLeft} and ${safeRight}, back to thinking`);
    }
    renderTable();
  }

  container.querySelector('#dining-step').addEventListener('click', doStep);

  container.querySelector('#dining-auto').addEventListener('click', () => {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; container.querySelector('#dining-auto').textContent = 'Auto Play'; }
    else {
      autoTimer = setInterval(() => {
        if (stepIdx >= sequence.length) { clearInterval(autoTimer); autoTimer = null; container.querySelector('#dining-auto').textContent = 'Auto Play'; return; }
        doStep();
      }, 900);
      container.querySelector('#dining-auto').textContent = '⏹ Stop';
    }
  });

  container.querySelector('#dining-reset').addEventListener('click', () => {
    clearInterval(autoTimer); autoTimer = null;
    container.querySelector('#dining-auto').textContent = 'Auto Play';
    states = Array(N).fill(THINK);
    forks = Array(N).fill(false);
    stepIdx = 0;
    container.querySelector('#dining-log').innerHTML = '';
    container.querySelector('#dining-auto').textContent = 'Auto Play';
    if (phil3D) {
      states.forEach((_, i) => phil3D.updateState(i, 'THINKING'));
    }
    renderTable();
  });

  container.querySelector('#dining-deadlock').addEventListener('click', () => {
    const log = container.querySelector('#dining-log');
    states = Array(N).fill(HUNGRY);
    forks = [true, true, true, true, true];
    if (phil3D) {
      states.forEach((_, i) => phil3D.updateState(i, 'HUNGRY'));
      playFaultAlert();
    }
    logEntry(log, 'error', 'DEADLOCK SCENARIO: All philosophers picked up their left fork simultaneously!');
    logEntry(log, 'error', 'Circular Wait: P0 waits for fork 1 (held by P1) → P1 waits for fork 2 → ... → P4 waits for fork 0 (held by P0)');
    logEntry(log, 'warn', 'Solution: Asymmetric acquisition: P4 picks RIGHT fork first to break circular wait.');
    renderTable();
  });

  renderTable();
}
