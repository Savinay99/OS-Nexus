/**
 * OS Nexus : About & Reference Module
 * Comprehensive documentation, academic syllabus mapping, and formula cheat sheet.
 */
import { escapeHtml } from '../../shared/ui.js';

export function renderAbout(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">About OS Nexus</h1>
      <p class="page-subtitle">Interactive Operating System Workbench: Architecture, Core Principles &amp; Formula Reference</p>
    </div>

    <!-- Educational Mission Notice -->
    <div class="card" style="margin-bottom:var(--space-6);border-left:4px solid var(--accent-teal)">
      <h2 class="card-title" style="margin-bottom:var(--space-2);color:var(--accent-teal)">Product Identity &amp; Educational Mission</h2>
      <p style="font-size:var(--text-sm);line-height:1.7;color:var(--text-secondary);margin-bottom:var(--space-3)">
        <strong>OS Nexus</strong> is an interactive educational operating system workbench built to visualize, simulate, and teach foundational operating system algorithms.
        It offers real-time execution models for process scheduling, concurrency primitives, virtual memory management, disk I/O, and deadlock avoidance, complete with full university curriculum documentation in the dedicated Lab Manual section.
      </p>
      <div class="grid-3" style="gap:var(--space-3);margin-top:var(--space-4)">
        <div style="background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div style="font-size:var(--text-xs);font-weight:700;color:var(--accent-teal);margin-bottom:2px">100% DETERMINISTIC</div>
          <div style="font-size:11px;color:var(--text-tertiary)">All algorithms, Gantt charts, and state transitions follow exact textbook mathematical rules.</div>
        </div>
        <div style="background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div style="font-size:var(--text-xs);font-weight:700;color:var(--accent-green);margin-bottom:2px">ZERO EXTERNAL APIS</div>
          <div style="font-size:11px;color:var(--text-tertiary)">Completely offline-capable and client-side. No AI chatbots, LLM tokens, or server trackers.</div>
        </div>
        <div style="background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div style="font-size:var(--text-xs);font-weight:700;color:var(--accent-amber);margin-bottom:2px">SAFE SIMULATED VFS</div>
          <div style="font-size:11px;color:var(--text-tertiary)">Virtual File System uses in-memory data structures inside LocalStorage. No real OS files are accessed.</div>
        </div>
      </div>
    </div>

    <!-- Formula Reference Sheet -->
    <h2 class="section-title">Operating Systems Formula &amp; Theory Cheat Sheet</h2>
    <div class="grid-2" style="gap:var(--space-4);margin-bottom:var(--space-6)">
      <!-- CPU Scheduling -->
      <div class="card">
        <h3 class="card-title" style="color:var(--accent-teal);margin-bottom:var(--space-3)">1. CPU Scheduling Metrics</h3>
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.8;background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div>• Turnaround Time (TAT) = Completion Time (CT) − Arrival Time (AT)</div>
          <div>• Waiting Time (WT)    = Turnaround Time (TAT) − Burst Time (BT)</div>
          <div>• Response Time (RT)   = First Run Start Time − Arrival Time (AT)</div>
          <div>• CPU Utilization (%)  = (Total Busy Time / Total Makespan) × 100%</div>
          <div>• Throughput           = Total Completed Processes / Total Time</div>
        </div>
      </div>

      <!-- Memory & Paging -->
      <div class="card">
        <h3 class="card-title" style="color:var(--accent-blue);margin-bottom:var(--space-3)">2. Virtual Memory &amp; Paging</h3>
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.8;background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div>• Page Number (p)      = ⌊ Logical Address / Page Size ⌋</div>
          <div>• Offset (d)           = Logical Address mod Page Size</div>
          <div>• Physical Address (PA)= (Frame Number × Page Size) + Offset</div>
          <div>• Page Hit Ratio       = Hits / Total Page References</div>
          <div>• Page Fault Ratio     = Faults / Total Page References = 1 − Hit Ratio</div>
        </div>
      </div>

      <!-- Disk Scheduling -->
      <div class="card">
        <h3 class="card-title" style="color:var(--accent-purple);margin-bottom:var(--space-3)">3. Disk Scheduling</h3>
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.8;background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div>• Total Head Movement  = ∑ | Track[i] − Track[i−1] |</div>
          <div>• FCFS Policy          = Requests serviced strictly in arrival order</div>
          <div>• SSTF Policy          = Minimum Seek Time First (min |Head − Req|)</div>
          <div>• Average Seek Time    = Total Head Movement / Number of Requests</div>
        </div>
      </div>

      <!-- Deadlock & Banker's -->
      <div class="card">
        <h3 class="card-title" style="color:var(--accent-green);margin-bottom:var(--space-3)">4. Banker's Deadlock Avoidance</h3>
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);line-height:1.8;background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">
          <div>• Need Matrix          = Max Matrix[i][j] − Allocation Matrix[i][j]</div>
          <div>• Safety Condition     = Need[i] ≤ Work (where Work = Available)</div>
          <div>• Work Update (if Safe)= Work = Work + Allocation[i]</div>
          <div>• Request Grant Check  = Request ≤ Need AND Request ≤ Available</div>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Guide -->
    <div class="card" style="margin-bottom:var(--space-6)">
      <h3 class="card-title" style="margin-bottom:var(--space-3)">Productivity Keyboard Shortcuts</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Shortcut</th><th>Action</th><th>Scope</th></tr>
          </thead>
          <tbody>
            <tr><td><kbd>/</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>Focus Search Bar in Navigation</td><td>Global</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Close Active Modal Dialog</td><td>Global</td></tr>
            <tr><td><kbd>Space</kbd></td><td>Flip Card / Step Simulation</td><td>Viva Flashcards / Workbench</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>P</kbd></td><td>Print / Save Lab Manual as PDF</td><td>Lab Report Generator</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- System Architecture -->
    <div class="card">
      <h3 class="card-title" style="margin-bottom:var(--space-2)">Architecture Specifications</h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
        Developed in pure ECMAScript (ES Modules) bundled via Vite. Designed according to Web Content Accessibility Guidelines (WCAG 2.1 AA)
        with semantic markup, ARIA roles, focus outlines, high-contrast dark/light tokens, and full responsive layout.
      </p>
    </div>
  `;
}
