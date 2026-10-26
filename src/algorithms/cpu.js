/**
 * OS Nexus : CPU Scheduling Algorithms
 * All algorithms are deterministic and tested independently of the DOM.
 */

/**
 * First Come First Served (FCFS) scheduling.
 * Non-preemptive. Ties in arrival time resolved by order in array.
 * @param {Array<{id:string, at:number, bt:number, priority?:number}>} processes
 * @returns {{ schedule: Array, gantt: Array, metrics: Object }}
 */
export function fcfs(processes) {
  if (!processes || processes.length === 0) return emptyResult();
  const procs = processes.map((p, i) => ({ ...p, idx: i }));
  procs.sort((a, b) => a.at - b.at || a.idx - b.idx);

  const schedule = [];
  const gantt = [];
  let time = 0;

  for (const p of procs) {
    if (time < p.at) {
      gantt.push({ pid: 'IDLE', start: time, end: p.at });
      time = p.at;
    }
    const start = time;
    time += p.bt;
    schedule.push({ ...p, start, ct: time, tat: time - p.at, wt: time - p.at - p.bt, rt: start - p.at });
    gantt.push({ pid: p.id, start, end: time, color: p.idx % 8 });
  }

  return { schedule, gantt, metrics: calcMetrics(schedule) };
}

/**
 * Shortest Job First (SJF) : Non-preemptive.
 */
export function sjf(processes) {
  if (!processes || processes.length === 0) return emptyResult();
  const procs = processes.map((p, i) => ({ ...p, idx: i, done: false }));
  const schedule = [];
  const gantt = [];
  let time = 0;
  let remaining = procs.length;

  while (remaining > 0) {
    const available = procs.filter(p => !p.done && p.at <= time);
    if (available.length === 0) {
      const nextAT = Math.min(...procs.filter(p => !p.done).map(p => p.at));
      gantt.push({ pid: 'IDLE', start: time, end: nextAT });
      time = nextAT;
      continue;
    }
    // Pick shortest burst; tie-break by arrival, then original order
    available.sort((a, b) => a.bt - b.bt || a.at - b.at || a.idx - b.idx);
    const p = available[0];
    const start = time;
    time += p.bt;
    p.done = true;
    remaining--;
    schedule.push({ ...p, start, ct: time, tat: time - p.at, wt: time - p.at - p.bt, rt: start - p.at });
    gantt.push({ pid: p.id, start, end: time, color: p.idx % 8 });
  }

  return { schedule, gantt, metrics: calcMetrics(schedule) };
}

/**
 * Priority Scheduling : Non-preemptive.
 * Lower priority number = higher priority.
 */
export function priorityScheduling(processes) {
  if (!processes || processes.length === 0) return emptyResult();
  const procs = processes.map((p, i) => ({ ...p, idx: i, done: false }));
  const schedule = [];
  const gantt = [];
  let time = 0;
  let remaining = procs.length;

  while (remaining > 0) {
    const available = procs.filter(p => !p.done && p.at <= time);
    if (available.length === 0) {
      const nextAT = Math.min(...procs.filter(p => !p.done).map(p => p.at));
      gantt.push({ pid: 'IDLE', start: time, end: nextAT });
      time = nextAT;
      continue;
    }
    available.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.at - b.at || a.idx - b.idx);
    const p = available[0];
    const start = time;
    time += p.bt;
    p.done = true;
    remaining--;
    schedule.push({ ...p, start, ct: time, tat: time - p.at, wt: time - p.at - p.bt, rt: start - p.at });
    gantt.push({ pid: p.id, start, end: time, color: p.idx % 8 });
  }

  return { schedule, gantt, metrics: calcMetrics(schedule) };
}

/**
 * Round Robin : Preemptive.
 * @param {Array} processes
 * @param {number} quantum : time quantum (must be > 0)
 */
export function roundRobin(processes, quantum) {
  if (!processes || processes.length === 0) return emptyResult();
  if (!quantum || quantum <= 0) throw new Error('Time quantum must be a positive integer.');

  const procs = processes.map((p, i) => ({ ...p, idx: i, remaining: p.bt, firstRun: -1 }));
  const schedule = [];
  const gantt = [];
  const queue = [];
  const arrivedSet = new Set();
  let time = 0;

  // Sort by arrival time to seed initial ready queue
  const sorted = [...procs].sort((a, b) => a.at - b.at || a.idx - b.idx);

  // Enqueue processes that arrive at time 0
  for (const p of sorted) {
    if (p.at <= time && !arrivedSet.has(p.id)) { queue.push(p); arrivedSet.add(p.id); }
  }

  let safetyCounter = 0;
  while (queue.length > 0 || procs.some(p => p.remaining > 0 && !arrivedSet.has(p.id))) {
    if (safetyCounter++ > 100000) break; // Safety guard

    if (queue.length === 0) {
      const nextAT = Math.min(...procs.filter(p => !arrivedSet.has(p.id) && p.remaining > 0).map(p => p.at));
      gantt.push({ pid: 'IDLE', start: time, end: nextAT });
      time = nextAT;
      for (const p of sorted) {
        if (p.at <= time && !arrivedSet.has(p.id)) { queue.push(p); arrivedSet.add(p.id); }
      }
      continue;
    }

    const p = queue.shift();
    if (p.firstRun === -1) p.firstRun = time;

    const exec = Math.min(quantum, p.remaining);
    gantt.push({ pid: p.id, start: time, end: time + exec, color: p.idx % 8 });
    time += exec;
    p.remaining -= exec;

    // Enqueue newly arrived processes before re-queuing current
    for (const np of sorted) {
      if (np.at <= time && !arrivedSet.has(np.id)) { queue.push(np); arrivedSet.add(np.id); }
    }

    if (p.remaining > 0) {
      queue.push(p);
    } else {
      schedule.push({ ...p, start: p.firstRun, ct: time, tat: time - p.at, wt: time - p.at - p.bt, rt: p.firstRun - p.at });
    }
  }

  return { schedule, gantt, metrics: calcMetrics(schedule) };
}

function calcMetrics(schedule) {
  const n = schedule.length;
  if (n === 0) return {};
  const avgTAT = schedule.reduce((s, p) => s + p.tat, 0) / n;
  const avgWT  = schedule.reduce((s, p) => s + p.wt, 0) / n;
  const avgRT  = schedule.reduce((s, p) => s + p.rt, 0) / n;
  const totalTime = Math.max(...schedule.map(p => p.ct)) - Math.min(...schedule.map(p => p.at));
  const busyTime = schedule.reduce((s, p) => s + p.bt, 0);
  const cpuUtil = totalTime > 0 ? (busyTime / totalTime) * 100 : 100;
  return { avgTAT, avgWT, avgRT, cpuUtil, n };
}

function emptyResult() {
  return { schedule: [], gantt: [], metrics: {} };
}
