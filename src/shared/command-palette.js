/**
 * OS Nexus : Precision Command Palette (Raycast / Linear Architecture)
 * Reliable keyboard-driven navigation, command filtering, and accessible execution.
 */
import { navigate } from '../app/router.js';
import { toggleAudio, isAudioMuted, playTick } from './workstation-audio.js';
import { getState, setState } from '../app/state.js';
import { gsap } from 'gsap';

const COMMANDS = [
  // Core Navigation
  { id: 'nav-overview', title: 'Overview Dashboard', category: 'Navigation', icon: '🎛', desc: 'System overview and simulator access', action: () => navigate('overview') },
  { id: 'nav-integrated', title: 'Integrated OS Workbench', category: 'Simulators', icon: '⚡', desc: 'Multiprogramming pipeline: CPU, RAM, Disk, Banker', action: () => navigate('integrated') },
  { id: 'nav-cpu', title: 'CPU Scheduling Lab', category: 'Simulators', icon: '⏱', desc: 'FCFS, SJF, Priority, Round Robin scheduling', action: () => navigate('cpu') },
  { id: 'nav-concurrency', title: 'Concurrency & Synchronization Lab', category: 'Simulators', icon: '🔄', desc: 'Mutex, Semaphores, Producer-Consumer, Dining Philosophers', action: () => navigate('concurrency') },
  { id: 'nav-memory', title: 'Memory Management Lab', category: 'Simulators', icon: '💾', desc: 'FIFO, LRU, Optimal Paging, Contiguous Allocation', action: () => navigate('memory') },
  { id: 'nav-disk', title: 'Disk Scheduling Lab', category: 'Simulators', icon: '💽', desc: 'FCFS and SSTF secondary storage head seek visualization', action: () => navigate('disk') },
  { id: 'nav-resources', title: "Resource Allocation Lab (Banker's)", category: 'Simulators', icon: '🛡', desc: 'Deadlock avoidance, safety algorithm, allocation matrices', action: () => navigate('resources') },
  { id: 'nav-filesystem', title: 'Virtual File System Explorer', category: 'Simulators', icon: '📁', desc: 'In-browser simulated hierarchical file system', action: () => navigate('filesystem') },
  { id: 'nav-catalogue', title: 'Lab Manual & Experiments (All 12)', category: 'Curriculum', icon: '📖', desc: 'Official OS lab experiments, C code, and viva questions', action: () => navigate('catalogue') },
  { id: 'nav-viva', title: 'Viva Voce & Lab Report Generator', category: 'Academic', icon: '💬', desc: 'Flashcard oral examination trainer and printable reports', action: () => navigate('viva') },
  { id: 'nav-about', title: 'About OS Nexus & Formula Sheet', category: 'Academic', icon: 'ℹ', desc: 'Operating systems metrics, turnaround time formulas, architecture', action: () => navigate('about') },

  // Specific Experiments Fast Access
  { id: 'exp-1', title: 'Experiment 1: FCFS CPU Scheduling', category: 'Curriculum', icon: '1️⃣', desc: 'First-Come First-Served CPU scheduling algorithm', action: () => { navigate('cpu'); } },
  { id: 'exp-2', title: 'Experiment 2: SJF CPU Scheduling', category: 'Curriculum', icon: '2️⃣', desc: 'Shortest Job First CPU scheduling algorithm', action: () => { navigate('cpu'); } },
  { id: 'exp-3', title: 'Experiment 3: Priority CPU Scheduling', category: 'Curriculum', icon: '3️⃣', desc: 'Priority-based CPU scheduling algorithm', action: () => { navigate('cpu'); } },
  { id: 'exp-4', title: 'Experiment 4: Round Robin CPU Scheduling', category: 'Curriculum', icon: '4️⃣', desc: 'Preemptive time-quantum scheduling algorithm', action: () => { navigate('cpu'); } },
  { id: 'exp-6', title: 'Experiment 6: Producer-Consumer Problem', category: 'Curriculum', icon: '6️⃣', desc: 'Bounded-buffer synchronization using semaphores', action: () => { navigate('concurrency'); } },
  { id: 'exp-7', title: 'Experiment 7: FIFO Page Replacement', category: 'Curriculum', icon: '7️⃣', desc: 'First-In First-Out virtual memory page replacement', action: () => { navigate('memory'); } },
  { id: 'exp-8', title: 'Experiment 8: LRU Page Replacement', category: 'Curriculum', icon: '8️⃣', desc: 'Least Recently Used virtual memory page replacement', action: () => { navigate('memory'); } },
  { id: 'exp-9', title: 'Experiment 9: Optimal Page Replacement', category: 'Curriculum', icon: '9️⃣', desc: 'Optimal clairvoyant virtual memory page replacement', action: () => { navigate('memory'); } },
  { id: 'exp-10', title: 'Experiment 10: FCFS Disk Scheduling', category: 'Curriculum', icon: '🔟', desc: 'First-Come First-Served disk track seeking', action: () => { navigate('disk'); } },
  { id: 'exp-11', title: 'Experiment 11: SSTF Disk Scheduling', category: 'Curriculum', icon: '⚡', desc: 'Shortest Seek Time First disk head scheduling', action: () => { navigate('disk'); } },
  { id: 'exp-12', title: "Experiment 12: Banker's Algorithm", category: 'Curriculum', icon: '🛡', desc: 'Deadlock avoidance safety verification', action: () => { navigate('resources'); } },

  // System & Preference Actions
  {
    id: 'act-theme',
    title: 'Toggle Theme (Light / Dark Workstation)',
    category: 'Preferences',
    icon: '🌓',
    desc: 'Switch between refined graphite dark mode and crisp slate light mode',
    action: () => {
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      const next = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setState('theme', next);
    }
  },
  {
    id: 'act-audio',
    title: 'Toggle Audio Feedback Sound FX',
    category: 'Preferences',
    icon: '🔊',
    desc: 'Enable or mute synthesized Web Audio workstation chimes',
    action: () => {
      const muted = toggleAudio();
      const status = muted ? 'Audio muted.' : 'Audio enabled.';
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.background = 'var(--bg-elevated)';
      toast.style.color = 'var(--text-primary)';
      toast.style.border = '1px solid var(--border)';
      toast.style.padding = '8px 16px';
      toast.style.borderRadius = 'var(--radius)';
      toast.style.zIndex = '9999';
      toast.style.fontFamily = 'var(--font-mono)';
      toast.style.fontSize = '12px';
      toast.textContent = status;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    }
  },
  {
    id: 'act-print-record',
    title: 'Print University Lab Record',
    category: 'Academic',
    icon: '🖨',
    desc: 'Generate printable official OS laboratory practical record',
    action: () => {
      navigate('viva');
      setTimeout(() => {
        document.querySelector('.tab-btn[data-tab="tab-report-gen"]')?.click();
      }, 120);
    }
  }
];

let paletteBackdrop = null;
let selectedIndex = 0;
let filteredCommands = [...COMMANDS];
let isInitialized = false;

function isEditingText(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // If user is inside the command palette search input, it is not an external editor
    if (el.id === 'command-palette-input') return false;
    return true;
  }
  return !!el.isContentEditable;
}

export function initCommandPalette() {
  if (isInitialized) return;
  isInitialized = true;

  paletteBackdrop = document.createElement('div');
  paletteBackdrop.id = 'command-palette-backdrop';
  paletteBackdrop.className = 'command-palette-backdrop hidden';
  paletteBackdrop.setAttribute('aria-hidden', 'true');
  paletteBackdrop.innerHTML = `
    <div class="command-palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
      <div class="command-palette-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 11L14.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="text" id="command-palette-input" placeholder="Search modules, simulators, experiments, or actions…" autocomplete="off" spellcheck="false" />
        <span class="command-palette-badge">ESC</span>
      </div>
      <div id="command-palette-list" class="command-palette-list" role="listbox"></div>
      <div class="command-palette-footer">
        <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Select</span>
        <span><kbd>ESC</kbd> Close</span>
      </div>
    </div>
  `;

  document.body.appendChild(paletteBackdrop);

  const input = paletteBackdrop.querySelector('#command-palette-input');
  const list = paletteBackdrop.querySelector('#command-palette-list');

  function renderList() {
    if (filteredCommands.length === 0) {
      list.innerHTML = `
        <div class="command-palette-empty">No matching modules or commands found.</div>
      `;
      return;
    }

    list.innerHTML = filteredCommands.map((cmd, idx) => `
      <div class="command-item ${idx === selectedIndex ? 'selected' : ''}" data-index="${idx}" role="option" aria-selected="${idx === selectedIndex}">
        <span class="command-icon">${cmd.icon}</span>
        <div class="command-text">
          <span class="command-title">${cmd.title}</span>
          <span class="command-category">${cmd.category}${cmd.desc ? ` · ${cmd.desc}` : ''}</span>
        </div>
        <span class="command-action-hint">↵ Select</span>
      </div>
    `).join('');

    // Click handler for items
    list.querySelectorAll('.command-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        executeCommand(idx);
      });
    });

    const selectedEl = list.querySelector('.command-item.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  function executeCommand(idx) {
    const cmd = filteredCommands[idx];
    if (cmd && cmd.action) {
      playTick();
      closeCommandPalette();
      cmd.action();
    }
  }

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      filteredCommands = [...COMMANDS];
    } else {
      filteredCommands = COMMANDS.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.desc && c.desc.toLowerCase().includes(q))
      );
    }
    selectedIndex = 0;
    renderList();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        selectedIndex = (selectedIndex + 1) % filteredCommands.length;
        renderList();
        playTick();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
        renderList();
        playTick();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        executeCommand(selectedIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    }
  });

  // Clicking backdrop closes palette
  paletteBackdrop.addEventListener('click', (e) => {
    if (e.target === paletteBackdrop) {
      closeCommandPalette();
    }
  });

  // Global Single-Source Keyboard Shortcut Listener (Ctrl+K or Cmd+K)
  document.addEventListener('keydown', (e) => {
    // Escape closes open palette regardless of focus
    if (e.key === 'Escape') {
      if (paletteBackdrop && !paletteBackdrop.classList.contains('hidden')) {
        e.preventDefault();
        closeCommandPalette();
        return;
      }
    }

    // Ctrl+K / Cmd+K
    const isShortcut = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey);
    if (isShortcut) {
      // Do not trigger if user is typing in form inputs, textareas, or contenteditable
      if (isEditingText(document.activeElement)) {
        return;
      }

      e.preventDefault();
      toggleCommandPalette();
    }
  });
}

export function openCommandPalette() {
  if (!paletteBackdrop) initCommandPalette();
  filteredCommands = [...COMMANDS];
  selectedIndex = 0;
  paletteBackdrop.classList.remove('hidden');
  paletteBackdrop.setAttribute('aria-hidden', 'false');

  const modal = paletteBackdrop.querySelector('.command-palette-modal');
  if (modal) {
    gsap.fromTo(
      modal,
      { opacity: 0, scale: 0.96, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'power2.out', clearProps: 'transform' }
    );
  }

  const input = paletteBackdrop.querySelector('#command-palette-input');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 20);
  }

  const list = paletteBackdrop.querySelector('#command-palette-list');
  if (list) {
    list.innerHTML = filteredCommands.map((cmd, idx) => `
      <div class="command-item ${idx === selectedIndex ? 'selected' : ''}" data-index="${idx}" role="option" aria-selected="${idx === selectedIndex}">
        <span class="command-icon">${cmd.icon}</span>
        <div class="command-text">
          <span class="command-title">${cmd.title}</span>
          <span class="command-category">${cmd.category}${cmd.desc ? ` · ${cmd.desc}` : ''}</span>
        </div>
        <span class="command-action-hint">↵ Select</span>
      </div>
    `).join('');

    list.querySelectorAll('.command-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        const cmd = filteredCommands[idx];
        if (cmd && cmd.action) {
          playTick();
          closeCommandPalette();
          cmd.action();
        }
      });
    });
  }
}

export function closeCommandPalette() {
  if (!paletteBackdrop || paletteBackdrop.classList.contains('hidden')) return;
  const modal = paletteBackdrop.querySelector('.command-palette-modal');
  if (modal) {
    gsap.to(modal, {
      opacity: 0,
      scale: 0.97,
      y: -6,
      duration: 0.12,
      ease: 'power2.in',
      onComplete: () => {
        paletteBackdrop.classList.add('hidden');
        paletteBackdrop.setAttribute('aria-hidden', 'true');
        gsap.set(modal, { clearProps: 'all' });
      }
    });
  } else {
    paletteBackdrop.classList.add('hidden');
    paletteBackdrop.setAttribute('aria-hidden', 'true');
  }
}

export function toggleCommandPalette() {
  if (paletteBackdrop && !paletteBackdrop.classList.contains('hidden')) {
    closeCommandPalette();
  } else {
    openCommandPalette();
  }
}
