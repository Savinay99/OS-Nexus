/**
 * OS Nexus : Lab Reports & Viva Voce Module
 * Interactive Flashcard & Quiz Trainer + Printable Academic Lab Manual Generator
 */
import { EXPERIMENTS, getExperimentById } from '../../data/experiments.js';
import { escapeHtml, setupTabs } from '../../shared/ui.js';

export function renderVivaLab(container) {
  // Aggregate all viva questions
  const allQuestions = [];
  EXPERIMENTS.forEach(exp => {
    (exp.vivaQA || []).forEach((item, idx) => {
      allQuestions.push({
        id: `${exp.id}-${idx}`,
        expId: exp.id,
        expTitle: exp.title,
        category: exp.category,
        q: item.q,
        a: item.a
      });
    });
  });

  // Load mastered state from localStorage
  let masteredIds = new Set();
  try {
    const saved = localStorage.getItem('osnexus_mastered_viva');
    if (saved) masteredIds = new Set(JSON.parse(saved));
  } catch (_) { }

  let currentCategory = 'all';
  let cardIndex = 0;
  let showAnswer = false;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Lab Reports &amp; Viva Voce</h1>
      <p class="page-subtitle">Interactive Oral Examination Trainer (60+ Viva Questions) &amp; Printable Academic Lab Manual Generator</p>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="tab-flashcards" role="tab">🎴 Viva Flashcards</button>
      <button class="tab-btn" data-tab="tab-all-questions" role="tab">📋 Question Bank</button>
      <button class="tab-btn" data-tab="tab-report-gen" role="tab">📄 Lab Report Generator</button>
    </div>

    <!-- FLASHCARD TRAINER TAB -->
    <div class="tab-panel active" id="tab-flashcards" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-4)">
          <div class="row" style="gap:var(--space-2);align-items:center">
            <label for="viva-cat-filter" style="font-size:var(--text-xs);font-weight:600;color:var(--text-secondary)">Filter Topic:</label>
            <select id="viva-cat-filter" class="form-select" style="font-size:var(--text-xs);padding:4px 8px;width:auto">
              <option value="all">All Topics (${allQuestions.length} Questions)</option>
              <option value="cpu">CPU Scheduling</option>
              <option value="concurrency">Concurrency &amp; Synchronization</option>
              <option value="resources">Deadlocks &amp; Banker's</option>
              <option value="memory">Virtual Memory &amp; Paging</option>
              <option value="disk">Disk Scheduling</option>
            </select>
          </div>

          <div style="font-size:var(--text-xs);color:var(--text-secondary)">
            Mastered: <strong id="mastered-count" style="color:var(--accent-green)">0</strong> / <span id="total-filtered-count">${allQuestions.length}</span>
          </div>
        </div>

        <!-- Flashcard Box -->
        <div id="flashcard-container" style="min-height:260px;background:var(--bg-elevated);border:2px dashed var(--border);border-radius:var(--radius-lg);padding:var(--space-6);display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;transition:border-color var(--transition)">
          <div>
            <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
              <span id="card-badge" class="exp-badge teal">Exp 1</span>
              <span id="card-index-indicator" style="font-size:var(--text-xs);color:var(--text-tertiary)">1 / 60</span>
            </div>
            <h3 id="card-question" style="font-size:var(--text-lg);font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:var(--space-4)">
              Loading question...
            </h3>
          </div>

          <div id="card-answer-wrapper" style="border-top:1px solid var(--border);padding-top:var(--space-4);display:none">
            <div style="font-size:var(--text-xs);font-weight:700;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">
              Model Answer / Explanation:
            </div>
            <p id="card-answer" style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
            </p>
          </div>

          <div id="card-prompt" style="text-align:center;color:var(--text-tertiary);font-size:var(--text-xs);padding:var(--space-2) 0">
            👆 Click card or press Space to reveal answer
          </div>
        </div>

        <!-- Flashcard Controls -->
        <div class="row" style="justify-content:space-between;align-items:center;margin-top:var(--space-4);flex-wrap:wrap;gap:var(--space-3)">
          <div class="row" style="gap:var(--space-2)">
            <button class="btn btn-secondary btn-sm" id="btn-prev-card">← Previous</button>
            <button class="btn btn-secondary btn-sm" id="btn-next-card">Next →</button>
            <button class="btn btn-ghost btn-sm" id="btn-shuffle-card">🔀 Shuffle</button>
          </div>

          <div class="row" style="gap:var(--space-2)">
            <button class="btn btn-ghost btn-sm" id="btn-toggle-answer">👁 Toggle Answer</button>
            <button class="btn btn-secondary btn-sm" id="btn-master-card">★ Mark as Mastered</button>
          </div>
        </div>
      </div>
    </div>

    <!-- QUESTION BANK ACCORDION TAB -->
    <div class="tab-panel" id="tab-all-questions" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="row" style="gap:var(--space-4);align-items:center;margin-bottom:var(--space-4)">
          <div class="search-wrap" style="flex:1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 9.5L12 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            <input type="search" id="viva-search-bank" placeholder="Search across all viva questions and answers…" />
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-expand-all">Expand All</button>
          <button class="btn btn-ghost btn-sm" id="btn-collapse-all">Collapse All</button>
        </div>

        <div id="viva-bank-list" style="display:flex;flex-direction:column;gap:var(--space-2)"></div>
      </div>
    </div>

    <!-- LAB REPORT GENERATOR TAB -->
    <div class="tab-panel" id="tab-report-gen" role="tabpanel">
      <div class="card" style="margin-bottom:var(--space-4)">
        <h2 class="card-title" style="margin-bottom:var(--space-2)">Academic Lab Report Generator</h2>
        <p class="form-hint" style="margin-bottom:var(--space-4)">
          Generate standard university lab documentation with Aim, Theory, Algorithm, ANSI C Source Code, Test Cases, and Evaluation Rubric ready to print or export as PDF.
        </p>

        <div class="grid-3" style="gap:var(--space-3);margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label required" for="report-exp-select">Select Experiment</label>
            <select id="report-exp-select" class="form-select">
              ${EXPERIMENTS.map(e => `<option value="${e.id}">Exp ${e.id}: ${escapeHtml(e.title)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="report-student-name">Student Full Name</label>
            <input id="report-student-name" class="form-input" type="text" value="Jane Doe" placeholder="e.g. John Smith" />
          </div>
          <div class="form-group">
            <label class="form-label" for="report-roll-no">Roll No / University Reg No</label>
            <input id="report-roll-no" class="form-input" type="text" value="2024-CS-101" placeholder="e.g. 21CS042" />
          </div>
          <div class="form-group">
            <label class="form-label" for="report-batch">Batch / Section</label>
            <input id="report-batch" class="form-input" type="text" value="CSE-A / Batch 2" />
          </div>
          <div class="form-group">
            <label class="form-label" for="report-course">Course Code &amp; Title</label>
            <input id="report-course" class="form-input" type="text" value="CS304: Operating Systems Laboratory" />
          </div>
          <div class="form-group">
            <label class="form-label" for="report-date">Date of Submission</label>
            <input id="report-date" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="row" style="gap:var(--space-3)">
          <button class="btn btn-primary" id="btn-print-report">🖨 Print / Export PDF Lab Record</button>
          <button class="btn btn-secondary" id="btn-refresh-preview">Refresh Preview</button>
        </div>
      </div>

      <!-- Printable Lab Report Document Preview -->
      <div id="printable-report-area" class="card" style="background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;padding:var(--space-8);font-family:serif;line-height:1.6">
      </div>
    </div>
  `;

  // Setup Flashcards
  let filteredQuestions = [...allQuestions];

  function getFilteredList() {
    if (currentCategory === 'all') return [...allQuestions];
    return allQuestions.filter(q => q.category === currentCategory);
  }

  function updateFlashcard() {
    filteredQuestions = getFilteredList();
    if (filteredQuestions.length === 0) return;

    if (cardIndex < 0) cardIndex = filteredQuestions.length - 1;
    if (cardIndex >= filteredQuestions.length) cardIndex = 0;

    const item = filteredQuestions[cardIndex];
    const isMastered = masteredIds.has(item.id);

    container.querySelector('#card-badge').textContent = `Exp ${item.expId} · ${item.category}`;
    container.querySelector('#card-index-indicator').textContent = `${cardIndex + 1} / ${filteredQuestions.length}`;
    container.querySelector('#card-question').textContent = item.q;
    container.querySelector('#card-answer').textContent = item.a;

    const ansWrapper = container.querySelector('#card-answer-wrapper');
    const promptEl = container.querySelector('#card-prompt');
    const masterBtn = container.querySelector('#btn-master-card');

    ansWrapper.style.display = showAnswer ? 'block' : 'none';
    promptEl.style.display = showAnswer ? 'none' : 'block';

    masterBtn.textContent = isMastered ? '★ Mastered' : '☆ Mark as Mastered';
    masterBtn.classList.toggle('btn-primary', isMastered);
    masterBtn.classList.toggle('btn-secondary', !isMastered);

    container.querySelector('#mastered-count').textContent = masteredIds.size;
    container.querySelector('#total-filtered-count').textContent = filteredQuestions.length;
  }

  // Flashcard events
  const cardBox = container.querySelector('#flashcard-container');
  cardBox.addEventListener('click', () => {
    showAnswer = !showAnswer;
    updateFlashcard();
  });

  container.querySelector('#btn-toggle-answer').addEventListener('click', () => {
    showAnswer = !showAnswer;
    updateFlashcard();
  });

  container.querySelector('#btn-next-card').addEventListener('click', () => {
    cardIndex++;
    showAnswer = false;
    updateFlashcard();
  });

  container.querySelector('#btn-prev-card').addEventListener('click', () => {
    cardIndex--;
    showAnswer = false;
    updateFlashcard();
  });

  container.querySelector('#btn-shuffle-card').addEventListener('click', () => {
    cardIndex = Math.floor(Math.random() * filteredQuestions.length);
    showAnswer = false;
    updateFlashcard();
  });

  container.querySelector('#btn-master-card').addEventListener('click', () => {
    const item = filteredQuestions[cardIndex];
    if (masteredIds.has(item.id)) {
      masteredIds.delete(item.id);
    } else {
      masteredIds.add(item.id);
    }
    try {
      localStorage.setItem('osnexus_mastered_viva', JSON.stringify([...masteredIds]));
    } catch (_) { }
    updateFlashcard();
  });

  container.querySelector('#viva-cat-filter').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    cardIndex = 0;
    showAnswer = false;
    updateFlashcard();
  });

  // Setup Question Bank
  const bankList = container.querySelector('#viva-bank-list');
  const bankSearch = container.querySelector('#viva-search-bank');

  function renderBank(search = '') {
    const q = search.toLowerCase().trim();
    const matches = allQuestions.filter(item => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));

    bankList.innerHTML = matches.map(item => `
      <details class="accordion-item" style="background:var(--bg-elevated);border-radius:var(--radius);border:1px solid var(--border);padding:var(--space-3)">
        <summary style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center">
          <span><span class="exp-badge teal" style="margin-right:var(--space-2);font-size:10px">Exp ${item.expId}</span> ${escapeHtml(item.q)}</span>
          <span style="font-size:10px;color:var(--text-tertiary)">▼</span>
        </summary>
        <div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border);font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
          ${escapeHtml(item.a)}
        </div>
      </details>
    `).join('');
  }

  bankSearch.addEventListener('input', (e) => renderBank(e.target.value));
  container.querySelector('#btn-expand-all').addEventListener('click', () => {
    bankList.querySelectorAll('details').forEach(d => d.open = true);
  });
  container.querySelector('#btn-collapse-all').addEventListener('click', () => {
    bankList.querySelectorAll('details').forEach(d => d.open = false);
  });

  // Setup Lab Report Generator Preview
  function renderReportPreview() {
    const expId = parseInt(container.querySelector('#report-exp-select').value, 10);
    const exp = getExperimentById(expId);
    if (!exp) return;

    const studentName = container.querySelector('#report-student-name').value || 'Student Name';
    const rollNo = container.querySelector('#report-roll-no').value || 'Roll Number';
    const batch = container.querySelector('#report-batch').value || 'Batch';
    const course = container.querySelector('#report-course').value || 'OS Laboratory';
    const date = container.querySelector('#report-date').value || new Date().toISOString().split('T')[0];

    const previewArea = container.querySelector('#printable-report-area');
    previewArea.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:bold;margin:0 0 4px 0;letter-spacing:0.05em;text-transform:uppercase;color:#0f172a">
          Department of Computer Science &amp; Engineering
        </h2>
        <h3 style="font-size:16px;font-weight:600;margin:0 0 8px 0;color:#334155">${escapeHtml(course)}</h3>
        <h1 style="font-size:22px;font-weight:bold;margin:12px 0 0 0;color:#0f172a;text-decoration:underline">
          EXPERIMENT RECORD ${exp.id}: ${escapeHtml(exp.title.toUpperCase())}
        </h1>
      </div>

      <table style="width:100%;margin-bottom:24px;border-collapse:collapse;font-size:14px;color:#1e293b">
        <tr>
          <td style="padding:4px 8px;font-weight:bold;width:20%">Student Name:</td>
          <td style="padding:4px 8px;border-bottom:1px dotted #64748b;width:30%">${escapeHtml(studentName)}</td>
          <td style="padding:4px 8px;font-weight:bold;width:20%">Roll / Reg No:</td>
          <td style="padding:4px 8px;border-bottom:1px dotted #64748b;width:30%">${escapeHtml(rollNo)}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;font-weight:bold">Batch &amp; Section:</td>
          <td style="padding:4px 8px;border-bottom:1px dotted #64748b">${escapeHtml(batch)}</td>
          <td style="padding:4px 8px;font-weight:bold">Date Performed:</td>
          <td style="padding:4px 8px;border-bottom:1px dotted #64748b">${escapeHtml(date)}</td>
        </tr>
      </table>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          1. Aim of the Experiment
        </h3>
        <p style="margin:0;font-size:14px;color:#334155">${escapeHtml(exp.aim)}</p>
      </section>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          2. Learning Objectives
        </h3>
        <ul style="margin:0;padding-left:24px;font-size:14px;color:#334155">
          ${exp.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      </section>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          3. Theoretical Background &amp; Mathematical Model
        </h3>
        <div style="font-size:14px;color:#334155;white-space:pre-wrap;line-height:1.6">${escapeHtml(exp.theory)}</div>
      </section>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          4. Step-by-Step Algorithm
        </h3>
        <ol style="margin:0;padding-left:24px;font-size:14px;color:#334155">
          ${exp.algorithm.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
        </ol>
      </section>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          5. ANSI C Source Code Implementation
        </h3>
        <pre style="background:#f8fafc;color:#0f172a;border:1px solid #cbd5e1;padding:12px;border-radius:4px;font-family:monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap"><code>${escapeHtml(exp.cCode)}</code></pre>
      </section>

      <section style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          6. Input Verification &amp; Sample Execution Output
        </h3>
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;padding:10px;font-size:13px;margin-bottom:8px">
          <strong>Input Data:</strong> ${escapeHtml(exp.sampleInput || 'Standard sample parameters.')}
        </div>
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;padding:10px;font-size:13px">
          <strong>Program Output / Metrics:</strong> ${escapeHtml(exp.sampleOutput || 'Execution completed successfully.')}
        </div>
      </section>

      <section style="margin-bottom:30px">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:6px;color:#0f172a;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
          7. Result &amp; Inference
        </h3>
        <p style="margin:0;font-size:14px;color:#334155">
          The ${escapeHtml(exp.title)} algorithm was successfully implemented, simulated, and verified in ANSI C.
          Theoretical performance characteristics and computational complexities (Time: ${escapeHtml(exp.complexity?.time || 'O(n)')}, Space: ${escapeHtml(exp.complexity?.space || 'O(n)')}) were validated against simulated traces.
        </p>
      </section>

      <!-- Faculty Signature & Evaluation Rubric -->
      <div style="border-top:2px solid #0f172a;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <table style="border:1px solid #cbd5e1;border-collapse:collapse;font-size:12px">
            <tr>
              <th style="border:1px solid #cbd5e1;padding:4px 8px;background:#f8fafc">Evaluation Criteria</th>
              <th style="border:1px solid #cbd5e1;padding:4px 8px;background:#f8fafc">Max Marks</th>
              <th style="border:1px solid #cbd5e1;padding:4px 8px;background:#f8fafc">Awarded</th>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:4px 8px">Algorithm &amp; C Code</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:center">10</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px"></td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:4px 8px">Viva Voce</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:center">5</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px"></td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1;padding:4px 8px">Lab Record &amp; Timeliness</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:center">5</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px"></td>
            </tr>
            <tr style="font-weight:bold">
              <td style="border:1px solid #cbd5e1;padding:4px 8px">Total Marks</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:center">20</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px"></td>
            </tr>
          </table>
        </div>
        <div style="text-align:center">
          <div style="width:200px;border-bottom:1px solid #0f172a;margin-bottom:8px"></div>
          <div style="font-size:14px;font-weight:bold">Faculty / Lab In-Charge Signature</div>
        </div>
      </div>
    `;
  }

  container.querySelector('#report-exp-select').addEventListener('change', renderReportPreview);
  container.querySelector('#btn-refresh-preview').addEventListener('click', renderReportPreview);
  container.querySelector('#btn-print-report').addEventListener('click', () => {
    window.print();
  });

  // Initial loads
  updateFlashcard();
  renderBank();
  renderReportPreview();
  setupTabs(container);
}
