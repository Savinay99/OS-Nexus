/**
 * OS Nexus: 3D Workstation Graphics Engine
 * Purposeful Three.js + GSAP 3D interactive visualizations for Operating Systems concepts.
 * Features:
 * 1. 3D CPU Execution Pipeline
 * 2. 3D Memory Architecture & Page Replacement
 * 3. 3D Magnetic Disk Platter & Actuator Arm
 * 4. 3D Banker's Resource Allocation Network
 * 5. 3D Dining Philosophers Table
 */
import * as THREE from 'three';
import { gsap } from 'gsap';

// Check WebGL availability
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
/**
 * 1. OS Multiprogramming Kernel Pipeline Visualizer
 * High-precision, educational operating system workstation pipeline.
 * Explicitly visualizes:
 * - READY QUEUE (RAM Admitted)
 * - CPU EXECUTION CORE (Active instruction countdown, registers, quantum ticks)
 * - WAITING / I/O QUEUE (Secondary storage disk seek bus)
 * - TERMINATED PROCESSES (Completed jobs with CT, TAT, WT and memory reclamation)
 * Smoothly animates Process Control Block (PCB) chips across hardware buses according to real simulation events.
 */
export function initCPUPipeline3D(container, initialProcesses = []) {
  if (!container) return null;
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let width = container.clientWidth || 800;
  let height = container.clientHeight || 240;

  function resize() {
    width = container.clientWidth || 800;
    height = container.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  resize();

  window.addEventListener('resize', resize);

  // Process Colors Palette (High contrast slate workstation)
  const PROC_COLORS = {
    P1: { border: '#0284c7', bg: '#0b1d30', badge: '#38bdf8', text: '#f0f9ff' },
    P2: { border: '#d97706', bg: '#2b1b08', badge: '#fbbf24', text: '#fffbeb' },
    P3: { border: '#2563eb', bg: '#0f172a', badge: '#60a5fa', text: '#eff6ff' },
    P4: { border: '#7c3aed', bg: '#1e1136', badge: '#a78bfa', text: '#f5f3ff' },
    DEFAULT: { border: '#0d9488', bg: '#0f2422', badge: '#2dd4bf', text: '#f0fdfa' }
  };

  // Internal process token objects with animated coordinates
  let processTokens = (initialProcesses.length ? initialProcesses : [
    { pid: 'P1', bt: 6, remBt: 6, mem: 128, state: 'new' },
    { pid: 'P2', bt: 4, remBt: 4, mem: 64,  state: 'new' },
    { pid: 'P3', bt: 8, remBt: 8, mem: 256, state: 'new' },
    { pid: 'P4', bt: 3, remBt: 3, mem: 64,  state: 'new' }
  ]).map((p, idx) => ({
    pid: p.pid || `P${idx+1}`,
    bt: p.bt || 4,
    remBt: p.remBt !== undefined ? p.remBt : p.bt || 4,
    mem: p.mem || 128,
    state: p.state || 'new',
    diskSector: p.diskSector || null,
    ct: p.ct || null,
    tat: p.tat || null,
    wt: p.wt || null,
    x: 40 + idx * 50,
    y: 80,
    targetX: 40 + idx * 50,
    targetY: 80,
    colorKey: p.pid || `P${idx+1}`
  }));

  // System Pipeline Telemetry
  let simTime = 0;
  let runningProcess = null;
  let currentQuantum = { spent: 0, max: 2 };
  let currentPolicy = 'rr';
  let diskHeadPos = 50;
  let busPulsePhase = 0;

  // Compute exact architectural layout boundaries
  function getLayout() {
    const pad = 10;
    const headerH = 26;
    const usableH = height - pad * 2;
    const bayY = pad + 18;
    const bayH = usableH - 22;

    // 4 Distinct Architectural Bays
    const bay1W = Math.max(160, Math.floor(width * 0.27));
    const bay2W = Math.max(160, Math.floor(width * 0.26));
    const bay3W = Math.max(150, Math.floor(width * 0.22));
    const bay4W = width - (pad * 2 + bay1W + bay2W + bay3W + 18);

    const bay1X = pad;
    const bay2X = bay1X + bay1W + 6;
    const bay3X = bay2X + bay2W + 6;
    const bay4X = bay3X + bay3W + 6;

    return {
      pad,
      headerH,
      bayY,
      bayH,
      bay1: { x: bay1X, y: bayY, w: bay1W, h: bayH, title: 'READY QUEUE (RAM)', sub: 'Admitted Processes' },
      bay2: { x: bay2X, y: bayY, w: bay2W, h: bayH, title: 'CPU EXECUTION CORE', sub: 'Instruction Execution' },
      bay3: { x: bay3X, y: bayY, w: bay3W, h: bayH, title: 'WAITING / I/O QUEUE', sub: 'Secondary Storage Bus' },
      bay4: { x: bay4X, y: bayY, w: bay4W, h: bayH, title: 'TERMINATED JOBS', sub: 'Reclaimed & Complete' }
    };
  }

  // Calculate target positions for every token according to real OS state
  function updateTargetPositions(layout) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Group tokens by state
    const readyTokens = processTokens.filter(p => p.state === 'ready');
    const runningToken = processTokens.find(p => p.state === 'running');
    const waitingTokens = processTokens.filter(p => p.state === 'waiting');
    const termTokens = processTokens.filter(p => p.state === 'terminated');
    const newTokens = processTokens.filter(p => p.state === 'new');

    // 1. Ready Queue Slots (Bay 1)
    readyTokens.forEach((t, slotIdx) => {
      const slotH = 34;
      const slotY = layout.bay1.y + 36 + slotIdx * (slotH + 6);
      t.targetX = layout.bay1.x + 10;
      t.targetY = Math.min(layout.bay1.y + layout.bay1.h - slotH - 4, slotY);
    });

    // 2. New pool (unadmitted or pre-arrival)
    newTokens.forEach((t, idx) => {
      t.targetX = layout.bay1.x + 10;
      t.targetY = layout.bay1.y + layout.bay1.h - 32;
    });

    // 3. CPU Core Socket (Bay 2 Center)
    if (runningToken) {
      runningToken.targetX = layout.bay2.x + Math.floor((layout.bay2.w - 110) / 2);
      runningToken.targetY = layout.bay2.y + Math.floor(layout.bay2.h / 2) - 16;
    }

    // 4. Waiting / I/O Queue (Bay 3)
    waitingTokens.forEach((t, waitIdx) => {
      const slotH = 34;
      t.targetX = layout.bay3.x + 10;
      t.targetY = layout.bay3.y + 40 + waitIdx * (slotH + 8);
    });

    // 5. Terminated Bay (Bay 4)
    termTokens.forEach((t, termIdx) => {
      const slotH = 34;
      t.targetX = layout.bay4.x + 8;
      t.targetY = layout.bay4.y + 36 + termIdx * (slotH + 6);
    });
  }

  // Draw rounded rectangle helper
  function roundRect(ctx, x, y, w, h, r = 4) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Draw hardware bus line with directional indicator
  function drawBus(ctx, fromX, fromY, toX, toY, color, label) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -busPulsePhase * 8;
    ctx.stroke();
    ctx.setLineDash([]);

    if (label) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2 - 4;
      ctx.fillStyle = color;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, midX, midY);
    }
    ctx.restore();
  }

  let reqId;
  function render() {
    reqId = requestAnimationFrame(render);
    busPulsePhase = (busPulsePhase + 0.04) % (Math.PI * 2);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const layout = getLayout();
    updateTargetPositions(layout);

    // Interpolate token positions smoothly toward targets (ease damping)
    for (const t of processTokens) {
      t.x += (t.targetX - t.x) * 0.22;
      t.y += (t.targetY - t.y) * 0.22;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Canvas Background
    ctx.fillStyle = isLight ? '#f8fafc' : '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Top Workstation Status Bar
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KERNEL MULTIPROGRAMMING PIPELINE ARCHITECTURE', layout.pad, 14);

    ctx.textAlign = 'right';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    const policyLabel = currentPolicy === 'rr' ? `Round Robin (Q=${currentQuantum.max})` : (currentPolicy === 'sjf' ? 'SRTF (Preemptive)' : 'FCFS');
    ctx.fillText(`SIM CLOCK: T=${simTime} | POLICY: ${policyLabel}`, width - layout.pad, 14);

    // Inter-Bay Hardware Bus Traces (Data Highways)
    const bayMidY = layout.bayY + layout.bayH / 2;
    const busColor = isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(30, 41, 59, 0.9)';
    const activeBusColor = isLight ? '#0d9488' : '#14b8a6';

    // 1. Dispatch Bus: Ready Queue -> CPU
    drawBus(ctx, layout.bay1.x + layout.bay1.w, bayMidY - 15, layout.bay2.x, bayMidY - 15,
      runningProcess ? activeBusColor : busColor, 'DISPATCH');

    // 2. I/O Interrupt Bus: CPU -> Waiting Queue
    drawBus(ctx, layout.bay2.x + layout.bay2.w, bayMidY + 20, layout.bay3.x, bayMidY + 20,
      busColor, 'I/O YIELD');

    // 3. Termination Bus: CPU -> Terminated Bay
    drawBus(ctx, layout.bay3.x + layout.bay3.w, bayMidY - 20, layout.bay4.x, bayMidY - 20,
      busColor, 'EXIT');

    // Render the 4 Architectural Bays
    const bays = [layout.bay1, layout.bay2, layout.bay3, layout.bay4];
    const bayThemes = [
      { border: isLight ? '#cbd5e1' : '#1e293b', header: isLight ? '#0284c7' : '#38bdf8', bg: isLight ? '#ffffff' : '#0c1322' },
      { border: isLight ? '#99f6e4' : '#115e59', header: isLight ? '#0f766e' : '#2dd4bf', bg: isLight ? '#f0fdfa' : '#09181f' },
      { border: isLight ? '#fde68a' : '#78350f', header: isLight ? '#b45309' : '#fbbf24', bg: isLight ? '#fffbeb' : '#1c150c' },
      { border: isLight ? '#bbf7d0' : '#064e3b', header: isLight ? '#047857' : '#34d399', bg: isLight ? '#f0fdf4' : '#0a1d17' }
    ];

    bays.forEach((b, idx) => {
      const theme = bayThemes[idx];

      // Bay Container
      roundRect(ctx, b.x, b.y, b.w, b.h, 6);
      ctx.fillStyle = theme.bg;
      ctx.fill();
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bay Header Bar
      ctx.fillStyle = theme.header;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(b.title, b.x + 8, b.y + 15);

      ctx.fillStyle = isLight ? '#64748b' : '#64748b';
      ctx.font = '9px "Inter", sans-serif';
      ctx.fillText(b.sub, b.x + 8, b.y + 27);

      // Bay Divider line
      ctx.beginPath();
      ctx.moveTo(b.x + 4, b.y + 31);
      ctx.lineTo(b.x + b.w - 4, b.y + 31);
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // -------------------------------------------------------------
    // Bay 1: Ready Queue Slots (RAM Admitted)
    // -------------------------------------------------------------
    for (let slot = 0; slot < 3; slot++) {
      const slotY = layout.bay1.y + 36 + slot * 40;
      const slotW = layout.bay1.w - 20;
      roundRect(ctx, layout.bay1.x + 10, slotY, slotW, 34, 4);
      ctx.fillStyle = isLight ? '#f1f5f9' : '#080d16';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#172033';
      ctx.stroke();

      ctx.fillStyle = isLight ? '#94a3b8' : '#334155';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Slot ${slot} ${slot === 0 ? '[Head]' : ''}`, layout.bay1.x + 16, slotY + 20);
    }

    // -------------------------------------------------------------
    // Bay 2: CPU Core Silicon Bay
    // -------------------------------------------------------------
    const cpuSocketW = layout.bay2.w - 24;
    const cpuSocketH = 76;
    const cpuSocketX = layout.bay2.x + 12;
    const cpuSocketY = layout.bay2.y + Math.floor((layout.bay2.h - cpuSocketH) / 2) + 6;

    // CPU Die Platform
    roundRect(ctx, cpuSocketX, cpuSocketY, cpuSocketW, cpuSocketH, 6);
    ctx.fillStyle = isLight ? '#f8fafc' : '#050c12';
    ctx.fill();
    ctx.strokeStyle = runningProcess ? (isLight ? '#0d9488' : '#14b8a6') : (isLight ? '#cbd5e1' : '#1e293b');
    ctx.lineWidth = runningProcess ? 1.5 : 1;
    ctx.stroke();

    // CPU Heatsink Pins decoration
    ctx.fillStyle = isLight ? 'rgba(13, 148, 136, 0.15)' : 'rgba(20, 184, 166, 0.1)';
    for (let pinX = cpuSocketX + 10; pinX < cpuSocketX + cpuSocketW - 10; pinX += 8) {
      ctx.fillRect(pinX, cpuSocketY + 4, 3, 3);
      ctx.fillRect(pinX, cpuSocketY + cpuSocketH - 7, 3, 3);
    }

    // Live CPU Telemetry & Registers
    if (runningProcess) {
      ctx.fillStyle = isLight ? '#0f766e' : '#2dd4bf';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ALU BUS: ACTIVE | PC: 0x0${simTime}`, cpuSocketX + 8, cpuSocketY + 16);

      // Quantum Ticker bar
      const qW = cpuSocketW - 16;
      const qProgress = Math.min(1, currentQuantum.spent / Math.max(1, currentQuantum.max));
      roundRect(ctx, cpuSocketX + 8, cpuSocketY + cpuSocketH - 12, qW, 4, 2);
      ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.fill();

      roundRect(ctx, cpuSocketX + 8, cpuSocketY + cpuSocketH - 12, qW * qProgress, 4, 2);
      ctx.fillStyle = isLight ? '#0d9488' : '#14b8a6';
      ctx.fill();
    } else {
      ctx.fillStyle = isLight ? '#94a3b8' : '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORE IDLE / AWAITING DISPATCH', cpuSocketX + cpuSocketW / 2, cpuSocketY + cpuSocketH / 2);
    }

    // -------------------------------------------------------------
    // Bay 3: Waiting / I/O Cylinder Track
    // -------------------------------------------------------------
    const trackY = layout.bay3.y + layout.bay3.h - 32;
    const trackW = layout.bay3.w - 20;
    const trackX = layout.bay3.x + 10;

    // Track axis line
    ctx.beginPath();
    ctx.moveTo(trackX, trackY);
    ctx.lineTo(trackX + trackW, trackY);
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isLight ? '#64748b' : '#64748b';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0', trackX, trackY + 12);
    ctx.textAlign = 'right';
    ctx.fillText('199 Cyl', trackX + trackW, trackY + 12);

    // Live Actuator Head Marker
    const headX = trackX + (diskHeadPos / 199) * trackW;
    ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(headX, trackY - 7);
    ctx.lineTo(headX - 4, trackY);
    ctx.lineTo(headX + 4, trackY);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillText(`▲ Cyl ${diskHeadPos}`, headX, trackY - 9);

    // -------------------------------------------------------------
    // Render Process Control Block (PCB) Chips
    // -------------------------------------------------------------
    for (const token of processTokens) {
      const colors = PROC_COLORS[token.colorKey] || PROC_COLORS.DEFAULT;
      const chipW = 106;
      const chipH = 32;

      roundRect(ctx, token.x, token.y, chipW, chipH, 5);
      ctx.fillStyle = isLight ? '#ffffff' : colors.bg;
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // PID Badge
      roundRect(ctx, token.x + 4, token.y + 4, 26, 24, 3);
      ctx.fillStyle = colors.border;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(token.pid, token.x + 17, token.y + 20);

      // Remaining Burst & State Info
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? '#0f172a' : colors.text;

      if (token.state === 'running') {
        ctx.fillText(`BURST: ${token.remBt}t`, token.x + 35, token.y + 14);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillStyle = isLight ? '#0f766e' : '#2dd4bf';
        ctx.fillText(`Executing...`, token.x + 35, token.y + 25);
      } else if (token.state === 'ready') {
        ctx.fillText(`Rem: ${token.remBt} | ${token.mem}K`, token.x + 35, token.y + 14);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
        ctx.fillText('In Ready Queue', token.x + 35, token.y + 25);
      } else if (token.state === 'waiting') {
        ctx.fillText(`I/O Cyl: ${token.diskSector || '?'}`, token.x + 35, token.y + 14);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillStyle = isLight ? '#b45309' : '#f59e0b';
        ctx.fillText('Disk Seek Wait', token.x + 35, token.y + 25);
      } else if (token.state === 'terminated') {
        ctx.fillText(`CT:${token.ct || '?'} TAT:${token.tat || '?'}`, token.x + 35, token.y + 14);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillStyle = isLight ? '#047857' : '#34d399';
        ctx.fillText(`WT: ${token.wt || 0} (Freed)`, token.x + 35, token.y + 25);
      } else {
        ctx.fillText(`New (${token.mem}KB)`, token.x + 35, token.y + 14);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillStyle = isLight ? '#64748b' : '#64748b';
        ctx.fillText(`Arrives T=${token.at || 0}`, token.x + 35, token.y + 25);
      }
    }
  }

  render();

  return {
    updateState(simState) {
      if (!simState) return;
      simTime = simState.time !== undefined ? simState.time : simTime;
      runningProcess = simState.runningProcess || null;
      diskHeadPos = simState.diskHead !== undefined ? simState.diskHead : diskHeadPos;
      currentPolicy = simState.policy || currentPolicy;
      if (simState.quantum) currentQuantum = simState.quantum;

      // Update token metadata
      if (simState.jobs) {
        simState.jobs.forEach(job => {
          const t = processTokens.find(p => p.pid === job.pid);
          if (t) {
            t.state = job.state;
            t.remBt = job.remBt;
            t.diskSector = job.diskSector;
            t.ct = job.ct;
            t.tat = job.tat;
            t.wt = job.wt;
          }
        });
      }
    },
    dispatchProcess(index) {
      const t = processTokens[index];
      if (t) t.state = 'running';
    },
    terminateProcess(index) {
      const t = processTokens[index];
      if (t) t.state = 'terminated';
    },
    reset(initialJobs = null) {
      simTime = 0;
      runningProcess = null;
      diskHeadPos = 50;
      currentQuantum = { spent: 0, max: 2 };

      if (initialJobs) {
        processTokens.forEach(t => {
          const match = initialJobs.find(j => j.pid === t.pid);
          if (match) {
            t.state = match.state || 'new';
            t.remBt = match.bt;
            t.ct = null;
            t.tat = null;
            t.wt = null;
          }
        });
      } else {
        processTokens.forEach(t => {
          t.state = 'new';
          t.remBt = t.bt;
          t.ct = null;
          t.tat = null;
          t.wt = null;
        });
      }
    },
    destroy() {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', resize);
      container.innerHTML = '';
    }
  };
}

/**
 * 2. High-Precision Physical Memory Frame Architecture Visualizer
 * State-driven hardware MMU & paging visualizer.
 * Explicitly displays:
 * - Active Page Reference Stream with real-time target pointer
 * - Address & Data Bus transmission to MMU
 * - Physical RAM Frame Sockets (Frame 0, Frame 1, Frame 2, ...) with physical address bounds
 * - Live Resident Pages with high-contrast distinct process/page chips
 * - Hit / Fault / Replacement state indicators with clear educational telemetry
 */
export function initMemoryCube3D(container, frameCount = 3, initialSteps = [], refString = []) {
  if (!container) return null;
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let width = container.clientWidth || 800;
  let height = container.clientHeight || 240;

  function resize() {
    width = container.clientWidth || 800;
    height = container.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  // Distinct Page Color Themes (High contrast, accessible, technical palette)
  const PAGE_COLORS = [
    { border: '#0284c7', bg: '#0b1d30', badge: '#38bdf8', text: '#f0f9ff' }, // P0: Cyan
    { border: '#d97706', bg: '#2b1b08', badge: '#fbbf24', text: '#fffbeb' }, // P1: Amber
    { border: '#059669', bg: '#092419', badge: '#34d399', text: '#f0fdf4' }, // P2: Emerald
    { border: '#7c3aed', bg: '#1e1136', badge: '#a78bfa', text: '#f5f3ff' }, // P3: Purple
    { border: '#2563eb', bg: '#0f172a', badge: '#60a5fa', text: '#eff6ff' }, // P4: Blue
    { border: '#ea580c', bg: '#2b1407', badge: '#fb923c', text: '#fff7ed' }, // P5: Orange
    { border: '#e11d48', bg: '#2c0d16', badge: '#fb7185', text: '#fff1f2' }, // P6: Rose
    { border: '#0d9488', bg: '#0f2422', badge: '#2dd4bf', text: '#f0fdfa' }, // P7: Teal
    { border: '#4f46e5', bg: '#131438', badge: '#818cf8', text: '#eef2ff' }, // P8: Indigo
  ];

  function getPageColor(p) {
    const idx = Math.abs(parseInt(p, 10) || 0) % PAGE_COLORS.length;
    return PAGE_COLORS[idx];
  }

  function roundRect(c, x, y, w, h, r = 4) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // Simulation State
  let totalFrames = frameCount;
  let steps = initialSteps || [];
  let refs = refString || [];
  let currentStepIndex = 0;
  let activeStep = steps.length ? steps[0] : null;
  let pulseTimer = 0;
  let lastAction = null;

  let residentPages = Array.from({ length: totalFrames }, (_, i) => {
    return activeStep && activeStep.frames && activeStep.frames[i] !== undefined ? activeStep.frames[i] : null;
  });

  let reqId;
  function render() {
    pulseTimer += 0.05;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Canvas Background
    ctx.fillStyle = isLight ? '#f8fafc' : '#080c14';
    ctx.fillRect(0, 0, width, height);

    const pad = 12;
    const innerW = width - pad * 2;

    // Header bar
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MEMORY MANAGEMENT UNIT (MMU) · PHYSICAL RAM FRAMES', pad, 16);

    ctx.textAlign = 'right';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.fillText(`PAGE SIZE: 4 KB | FRAMES: ${totalFrames} | BASE: 0x0000`, width - pad, 16);

    // Top Row: Page Reference Stream Track
    const streamY = 28;
    const streamH = 46;
    roundRect(ctx, pad, streamY, innerW, streamH, 6);
    ctx.fillStyle = isLight ? '#ffffff' : '#0e1626';
    ctx.fill();
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stream Title
    ctx.fillStyle = isLight ? '#64748b' : '#64748b';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PAGE REFERENCE STREAM:', pad + 10, streamY + 16);

    // Render Stream Chips
    const chipW = 28;
    const chipGap = 6;
    const streamStartX = pad + 155;
    const maxVisibleChips = Math.floor((innerW - 170) / (chipW + chipGap));
    const startChipIdx = Math.max(0, Math.min(refs.length - maxVisibleChips, currentStepIndex - Math.floor(maxVisibleChips / 2)));
    const endChipIdx = Math.min(refs.length, startChipIdx + maxVisibleChips);

    for (let rIdx = startChipIdx; rIdx < endChipIdx; rIdx++) {
      const pageVal = refs[rIdx];
      const chipX = streamStartX + (rIdx - startChipIdx) * (chipW + chipGap);
      const isCurrent = rIdx === currentStepIndex;

      roundRect(ctx, chipX, streamY + 8, chipW, 28, 4);
      if (isCurrent) {
        ctx.fillStyle = activeStep && activeStep.hit ? (isLight ? '#ccfbf1' : '#042f2e') : (isLight ? '#fef3c7' : '#2d1a04');
        ctx.fill();
        ctx.strokeStyle = activeStep && activeStep.hit ? (isLight ? '#0d9488' : '#14b8a6') : (isLight ? '#d97706' : '#f59e0b');
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (rIdx < currentStepIndex) {
        ctx.fillStyle = isLight ? '#f1f5f9' : '#080d16';
        ctx.fill();
        ctx.strokeStyle = isLight ? '#cbd5e1' : '#1e293b';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = isLight ? '#ffffff' : '#0b111e';
        ctx.fill();
        ctx.strokeStyle = isLight ? '#e2e8f0' : '#172033';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = isCurrent
        ? (activeStep && activeStep.hit ? (isLight ? '#0f766e' : '#2dd4bf') : (isLight ? '#b45309' : '#fbbf24'))
        : (isLight ? '#475569' : '#94a3b8');
      ctx.font = isCurrent ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(pageVal), chipX + chipW / 2, streamY + 25);
    }

    // MMU Translation Status Ribbon
    const ribbonY = streamY + streamH + 8;
    const ribbonH = 26;
    roundRect(ctx, pad, ribbonY, innerW, ribbonH, 4);
    ctx.fillStyle = isLight ? '#ffffff' : '#0d1524';
    ctx.fill();
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    if (activeStep) {
      if (activeStep.hit) {
        ctx.fillStyle = isLight ? '#0f766e' : '#10b981';
        ctx.fillText(`STATUS: PAGE HIT ✓ — Page ${activeStep.page} is resident in Physical RAM Frame cache.`, pad + 10, ribbonY + 17);
      } else {
        ctx.fillStyle = isLight ? '#b45309' : '#f59e0b';
        const replaceTxt = activeStep.replaced !== null && activeStep.replaced !== undefined
          ? `Page Fault: Evicted Page ${activeStep.replaced} to swap disk → Loaded Page ${activeStep.page} into RAM.`
          : `Cold Page Fault: Allocated Page ${activeStep.page} into unassigned frame.`;
        ctx.fillText(`STATUS: ${replaceTxt}`, pad + 10, ribbonY + 17);
      }
    } else {
      ctx.fillStyle = isLight ? '#64748b' : '#64748b';
      ctx.fillText('STATUS: Ready for reference execution. Click "Step Memory" or "Auto-Simulate".', pad + 10, ribbonY + 17);
    }

    // Physical RAM Frame Sockets
    const framesY = ribbonY + ribbonH + 10;
    const framesH = height - framesY - 24;
    const gap = 10;
    const frameW = Math.max(80, Math.floor((innerW - (totalFrames - 1) * gap) / totalFrames));

    for (let f = 0; f < totalFrames; f++) {
      const fx = pad + f * (frameW + gap);
      const residentPage = residentPages[f];
      const isTarget = activeStep && (
        (activeStep.hit && residentPage === activeStep.page) ||
        (!activeStep.hit && (
          (activeStep.replaced !== null && activeStep.replaced !== undefined && activeStep.frames[f] === activeStep.page) ||
          (activeStep.replaced == null && activeStep.frames[f] === activeStep.page)
        ))
      );

      // Frame Outer Box
      roundRect(ctx, fx, framesY, frameW, framesH, 6);
      ctx.fillStyle = isLight ? '#ffffff' : '#0c1322';
      ctx.fill();

      // Border with active pulse if target
      if (isTarget) {
        ctx.strokeStyle = activeStep.hit ? (isLight ? '#0d9488' : '#10b981') : (isLight ? '#d97706' : '#f59e0b');
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = isLight ? '#cbd5e1' : '#1e293b';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Frame Header Strip
      roundRect(ctx, fx, framesY, frameW, 24, 6);
      ctx.fillStyle = isLight ? '#f1f5f9' : '#121b2d';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FRAME ${f}`, fx + 8, framesY + 16);

      ctx.textAlign = 'right';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? '#64748b' : '#64748b';
      ctx.fillText(`0x${(f * 4).toString(16).toUpperCase()}000`, fx + frameW - 8, framesY + 16);

      // Frame Core Body: Resident Page Token
      const bodyH = framesH - 24;
      const bodyY = framesY + 24;

      if (residentPage !== null && residentPage !== undefined) {
        const pColor = getPageColor(residentPage);
        const cardPad = 8;
        const cardW = frameW - cardPad * 2;
        const cardH = bodyH - 28;
        const cardY = bodyY + 6;

        roundRect(ctx, fx + cardPad, cardY, cardW, cardH, 5);
        ctx.fillStyle = isLight ? '#ffffff' : pColor.bg;
        ctx.fill();
        ctx.strokeStyle = isLight ? pColor.border : pColor.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Page Number Heading
        ctx.fillStyle = isLight ? pColor.border : pColor.badge;
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PAGE ${residentPage}`, fx + frameW / 2, cardY + Math.floor(cardH / 2) + 2);

        // Subtext: Valid / resident flag
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.fillText('VALID=1 | 4096B', fx + frameW / 2, cardY + cardH - 6);

        // Footer Badge
        ctx.font = 'bold 8px "Inter", sans-serif';
        if (isTarget && activeStep) {
          if (activeStep.hit) {
            ctx.fillStyle = isLight ? '#0f766e' : '#10b981';
            ctx.fillText('PAGE HIT', fx + frameW / 2, framesY + framesH - 6);
          } else {
            ctx.fillStyle = isLight ? '#b45309' : '#f59e0b';
            ctx.fillText('ALLOCATED', fx + frameW / 2, framesY + framesH - 6);
          }
        } else {
          ctx.fillStyle = isLight ? '#94a3b8' : '#475569';
          ctx.fillText('RESIDENT', fx + frameW / 2, framesY + framesH - 6);
        }
      } else {
        // Empty Frame Slot
        ctx.fillStyle = isLight ? '#94a3b8' : '#334155';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ EMPTY FRAME ]', fx + frameW / 2, bodyY + Math.floor(bodyH / 2));
      }
    }

    // Bottom Telemetry Bar
    ctx.textAlign = 'left';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#64748b';
    const stepLabel = steps.length ? `STEP: ${currentStepIndex + 1} of ${steps.length}` : 'STEP: 0';
    ctx.fillText(stepLabel, pad, height - 6);

    ctx.textAlign = 'right';
    const hitStats = activeStep
      ? `CURRENT REF: Page ${activeStep.page} | ${activeStep.hit ? 'HIT' : 'FAULT'}`
      : 'SIMULATION IDLE';
    ctx.fillText(hitStats, width - pad, height - 6);

    reqId = requestAnimationFrame(render);
  }

  render();

  return {
    updateStep(stepData, stepIdx, totalSteps, refString) {
      if (!stepData) return;
      activeStep = stepData;
      currentStepIndex = stepIdx;
      if (refString) refs = refString;
      if (stepData.frames) {
        residentPages = Array.from({ length: totalFrames }, (_, i) => {
          return stepData.frames[i] !== undefined ? stepData.frames[i] : null;
        });
      }
      lastAction = stepData.hit ? 'hit' : 'fault';
    },
    triggerPageHit(frameIdx) {
      lastAction = 'hit';
    },
    triggerPageFault(frameIdx) {
      lastAction = 'fault';
    },
    setFrames(count, newSteps = [], newRefs = []) {
      totalFrames = count;
      steps = newSteps;
      refs = newRefs;
      currentStepIndex = 0;
      activeStep = steps.length ? steps[0] : null;
      residentPages = Array.from({ length: totalFrames }, (_, i) => {
        return activeStep && activeStep.frames && activeStep.frames[i] !== undefined ? activeStep.frames[i] : null;
      });
    },
    reset() {
      currentStepIndex = 0;
      activeStep = steps.length ? steps[0] : null;
      residentPages = Array.from({ length: totalFrames }, (_, i) => {
        return activeStep && activeStep.frames && activeStep.frames[i] !== undefined ? activeStep.frames[i] : null;
      });
      lastAction = null;
    },
    destroy() {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', resize);
      container.innerHTML = '';
    }
  };
}

/**
 * 3. 3D Disk Platter & Actuator Arm Scene
 */
export function initDiskPlatter3D(container) {
  if (!container || !isWebGLAvailable()) return null;
  container.innerHTML = '';

  const width = container.clientWidth || 500;
  const height = container.clientHeight || 240;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
  camera.position.set(0, 16, 20);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const spot = new THREE.SpotLight(0x2dd4bf, 1.8);
  spot.position.set(8, 20, 10);
  scene.add(spot);

  // Platter
  const platterGeo = new THREE.CylinderGeometry(7, 7, 0.3, 48);
  const platterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.1
  });
  const platter = new THREE.Mesh(platterGeo, platterMat);
  scene.add(platter);

  // Cylinder Tracks Rings
  [2.5, 4.2, 5.8].forEach(r => {
    const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide });
    const rMesh = new THREE.Mesh(ringGeo, ringMat);
    rMesh.rotation.x = Math.PI / 2;
    rMesh.position.y = 0.17;
    platter.add(rMesh);
  });

  // Actuator Arm
  const armPivot = new THREE.Group();
  armPivot.position.set(-8, 0.8, -4);
  scene.add(armPivot);

  const armGeo = new THREE.BoxGeometry(9, 0.25, 0.8);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
  const arm = new THREE.Mesh(armGeo, armMat);
  arm.position.x = 4.5;
  armPivot.add(arm);

  // Head Tip LED
  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(8.8, 0.2, 0);
  armPivot.add(head);

  function renderScene() {
    renderer.render(scene, camera);
  }
  renderScene();

  return {
    seekCylinder(cylinder, totalCylinders = 200) {
      const norm = Math.max(0, Math.min(1, cylinder / totalCylinders));
      const targetAngle = 0.2 + norm * 0.45;
      gsap.to(armPivot.rotation, {
        y: targetAngle,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: renderScene
      });
      gsap.to(headMat.color, {
        r: 1, g: 0.3, b: 0.1, duration: 0.1, yoyo: true, repeat: 1,
        onUpdate: renderScene
      });
    },
    destroy() {
      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    }
  };
}

/**
 * 4. 3D Banker's Resource Allocation Network Scene
 */
export function initResourceNetwork3D(container, processCount = 5, resourceCount = 3) {
  if (!container || !isWebGLAvailable()) return null;
  container.innerHTML = '';

  const width = container.clientWidth || 500;
  const height = container.clientHeight || 240;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x2dd4bf, 1.2);
  dirLight.position.set(5, 20, 10);
  scene.add(dirLight);

  // Group
  const networkGroup = new THREE.Group();
  scene.add(networkGroup);

  // Process Nodes (Spheres on Left / Inner Ring)
  const procNodes = [];
  const resNodes = [];

  for (let i = 0; i < processCount; i++) {
    const angle = (i / processCount) * Math.PI * 2;
    const geo = new THREE.SphereGeometry(1.2, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.cos(angle) * 7, 0, Math.sin(angle) * 7);
    networkGroup.add(mesh);
    procNodes.push(mesh);
  }

  // Resource Nodes (Cubes at Center / Inner Core)
  for (let j = 0; j < resourceCount; j++) {
    const angle = (j / resourceCount) * Math.PI * 2 + 0.5;
    const geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.cos(angle) * 2.5, 0.5, Math.sin(angle) * 2.5);
    networkGroup.add(mesh);
    resNodes.push(mesh);
  }

  function renderScene() {
    renderer.render(scene, camera);
  }
  renderScene();

  return {
    highlightSafeSequence(sequence = []) {
      sequence.forEach((pName, seqIdx) => {
        const pIdx = parseInt(pName.replace(/\D/g, ''), 10) || 0;
        if (procNodes[pIdx]) {
          setTimeout(() => {
            gsap.to(procNodes[pIdx].material.color, { r: 0.1, g: 0.9, b: 0.5, duration: 0.4, onUpdate: renderScene });
            gsap.to(procNodes[pIdx].position, { y: 2, duration: 0.3, yoyo: true, repeat: 1, onUpdate: renderScene });
          }, seqIdx * 400);
        }
      });
    },
    markUnsafe() {
      procNodes.forEach(mesh => {
        gsap.to(mesh.material.color, { r: 0.9, g: 0.2, b: 0.2, duration: 0.3, onUpdate: renderScene });
      });
    },
    resetColors() {
      procNodes.forEach(mesh => {
        gsap.to(mesh.material.color, { r: 0.23, g: 0.51, b: 0.96, duration: 0.3, onUpdate: renderScene });
      });
    },
    destroy() {
      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    }
  };
}

/**
 * 5. 3D Dining Philosophers Table Scene
 */
export function initPhilosophers3D(container) {
  if (!container || !isWebGLAvailable()) return null;
  container.innerHTML = '';

  const width = container.clientWidth || 500;
  const height = container.clientHeight || 240;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 16, 22);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0x2dd4bf, 1.4, 40);
  pointLight.position.set(0, 10, 5);
  scene.add(pointLight);

  // Table
  const tableGeo = new THREE.CylinderGeometry(7, 7, 0.4, 32);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.y = -0.2;
  scene.add(table);

  // 5 Philosophers (Spheres) & 5 Forks (Cylinders)
  const philMeshes = [];
  const forkMeshes = [];

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    // Philosopher
    const pGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.set(Math.cos(angle) * 8.5, 0.8, Math.sin(angle) * 8.5);
    scene.add(pMesh);
    philMeshes.push(pMesh);

    // Fork (between philosophers)
    const forkAngle = ((i + 0.5) / 5) * Math.PI * 2;
    const fGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16);
    const fMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.rotation.z = Math.PI / 2;
    fMesh.rotation.y = -forkAngle;
    fMesh.position.set(Math.cos(forkAngle) * 5, 0.2, Math.sin(forkAngle) * 5);
    scene.add(fMesh);
    forkMeshes.push(fMesh);
  }

  function renderScene() {
    renderer.render(scene, camera);
  }
  renderScene();

  return {
    updateState(philIndex, state) {
      if (!philMeshes[philIndex]) return;
      const mesh = philMeshes[philIndex];
      // state: 'THINKING' (slate), 'HUNGRY' (amber), 'EATING' (cyan/green)
      if (state === 'EATING') {
        gsap.to(mesh.material.color, { r: 0.1, g: 0.85, b: 0.5, duration: 0.3, onUpdate: renderScene });
        gsap.to(mesh.position, { y: 1.5, duration: 0.3, onUpdate: renderScene });
      } else if (state === 'HUNGRY') {
        gsap.to(mesh.material.color, { r: 0.95, g: 0.6, b: 0.1, duration: 0.3, onUpdate: renderScene });
        gsap.to(mesh.position, { y: 0.8, duration: 0.3, onUpdate: renderScene });
      } else {
        gsap.to(mesh.material.color, { r: 0.4, g: 0.45, b: 0.55, duration: 0.3, onUpdate: renderScene });
        gsap.to(mesh.position, { y: 0.8, duration: 0.3, onUpdate: renderScene });
      }
    },
    destroy() {
      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    }
  };
}
