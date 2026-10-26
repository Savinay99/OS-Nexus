/**
 * OS Nexus : Experiment Catalogue Module
 * Full searchable and filterable directory of all 12 OS laboratory experiments.
 */
import { EXPERIMENTS, CATEGORIES, getExperimentById } from '../../data/experiments.js';
import { navigate } from '../../app/router.js';
import { escapeHtml, showModal } from '../../shared/ui.js';

export function renderCatalogue(container, params = {}) {
  let selectedCategory = 'all';
  let searchQuery = '';

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Lab Manual &amp; Experiments</h1>
      <p class="page-subtitle">Curriculum Lab Experiments 1 through 12: Aims, Algorithms, ANSI C Solutions, and Viva Voce Preparation</p>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card" style="margin-bottom:var(--space-6)">
      <div class="row" style="gap:var(--space-4);flex-wrap:wrap;align-items:center;justify-content:space-between">
        <!-- Search input -->
        <div class="search-wrap" style="flex:1;min-width:260px">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <input id="cat-search-input" type="search" placeholder="Search by experiment title, algorithm, or concept…" aria-label="Search experiments" />
        </div>

        <!-- Category filter pills -->
        <div class="row" id="cat-filter-pills" style="gap:var(--space-2);flex-wrap:wrap">
          <button class="btn btn-primary btn-sm pill-btn active" data-category="all">All (12)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="cpu">CPU (2)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="concurrency">Concurrency (3)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="resources">Resources &amp; Deadlock (1)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="memory">Memory (3)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="disk">Disk (2)</button>
          <button class="btn btn-secondary btn-sm pill-btn" data-category="integrated">Integrated (1)</button>
        </div>
      </div>
    </div>

    <!-- Experiment cards list container -->
    <div id="cat-experiments-grid" class="grid-2" style="gap:var(--space-5)"></div>
  `;

  const searchInput = container.querySelector('#cat-search-input');
  const pills = container.querySelectorAll('.pill-btn');
  const grid = container.querySelector('#cat-experiments-grid');

  function renderList() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = EXPERIMENTS.filter(exp => {
      const matchCat = selectedCategory === 'all' || exp.category === selectedCategory;
      const matchSearch = !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.aim.toLowerCase().includes(q) ||
        exp.theory.toLowerCase().includes(q) ||
        `exp ${exp.id}`.includes(q) ||
        `experiment ${exp.id}`.includes(q);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No experiments match your search</div>
          <div class="empty-text">Try adjusting your search terms or selecting a different category.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(exp => {
      const catBadgeColor = {
        cpu: 'teal',
        concurrency: 'amber',
        resources: 'green',
        memory: 'blue',
        disk: 'purple',
        integrated: 'teal'
      }[exp.category] || 'teal';

      return `
        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;height:100%">
          <div>
            <div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3)">
              <span class="exp-badge ${catBadgeColor}">Experiment ${exp.id}</span>
              <span class="tag" style="text-transform:capitalize">${exp.category}</span>
            </div>
            <h3 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--space-2);color:var(--text-primary)">
              ${escapeHtml(exp.title)}
            </h3>
            <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-4)">
              ${escapeHtml(exp.aim)}
            </p>
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-4)">
              <span>⏱ <strong>Time:</strong> ${escapeHtml(exp.complexity?.time || 'O(n)')}</span>
              <span>💾 <strong>Space:</strong> ${escapeHtml(exp.complexity?.space || 'O(n)')}</span>
              <span>💬 <strong>Viva:</strong> ${exp.vivaQA?.length || 0} questions</span>
            </div>
          </div>

          <div class="row" style="gap:var(--space-3);padding-top:var(--space-4);border-top:1px solid var(--border)">
            <button class="btn btn-secondary btn-sm exp-detail-btn" data-id="${exp.id}" style="flex:1">
              📖 Syllabus &amp; Code
            </button>
            <button class="btn btn-primary btn-sm exp-launch-btn" data-route="${exp.route}" data-tab="${exp.tab || ''}" style="flex:1">
              ▶ Launch Lab
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    grid.querySelectorAll('.exp-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openExperimentModal(parseInt(btn.dataset.id, 10));
      });
    });

    grid.querySelectorAll('.exp-launch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigate(btn.dataset.route, btn.dataset.tab ? { tab: btn.dataset.tab } : {});
      });
    });
  }

  // Filter pills click
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => {
        p.classList.remove('active', 'btn-primary');
        p.classList.add('btn-secondary');
      });
      pill.classList.add('active', 'btn-primary');
      pill.classList.remove('btn-secondary');
      selectedCategory = pill.dataset.category;
      renderList();
    });
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderList();
  });

  // Initial render
  renderList();

  // If params.expId was provided (e.g. from overview dashboard), open that experiment's modal immediately!
  if (params.expId) {
    setTimeout(() => {
      openExperimentModal(parseInt(params.expId, 10));
    }, 100);
  }
}

/**
 * Open detailed modal for an experiment
 */
function openExperimentModal(expId) {
  const exp = getExperimentById(expId);
  if (!exp) return;

  const bodyHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);max-height:70vh;overflow-y:auto;padding-right:var(--space-2)">
      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-1)">Aim</h4>
        <p style="font-size:var(--text-sm);color:var(--text-primary);line-height:1.6">${escapeHtml(exp.aim)}</p>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-2)">Learning Objectives</h4>
        <ul style="padding-left:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
          ${exp.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-1)">Theoretical Background</h4>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius)">${escapeHtml(exp.theory)}</div>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-2)">Algorithm Steps</h4>
        <ol style="padding-left:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
          ${exp.algorithm.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
        </ol>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-1)">Standard ANSI C Implementation</h4>
        <div class="c-code">
          <div class="c-code-header">
            <span>exp${exp.id}_solution.c</span>
            <button class="btn btn-ghost btn-sm" id="modal-copy-code">Copy C Code</button>
          </div>
          <pre><code>${escapeHtml(exp.cCode)}</code></pre>
        </div>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-amber);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-1)">Common Lab Pitfalls &amp; Mistakes</h4>
        <ul style="padding-left:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
          ${(exp.commonMistakes || []).map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>

      <div>
        <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--accent-teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-2)">Viva Voce Questions (${exp.vivaQA?.length || 0})</h4>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${(exp.vivaQA || []).map((v, i) => `
            <div style="background:var(--bg-elevated);padding:var(--space-3);border-radius:var(--radius);border-left:3px solid var(--accent-teal)">
              <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:4px;color:var(--text-primary)">Q${i + 1}: ${escapeHtml(v.q)}</div>
              <div style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5">${escapeHtml(v.a)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  showModal(`Experiment ${exp.id}: ${exp.title}`, bodyHTML, [
    {
      label: 'Copy C Code',
      class: 'btn-secondary',
      handler: () => {
        navigator.clipboard?.writeText(exp.cCode);
      }
    },
    {
      label: 'Launch Interactive Lab',
      class: 'btn-primary',
      handler: () => {
        navigate(exp.route, exp.tab ? { tab: exp.tab } : {});
      }
    }
  ]);

  document.getElementById('modal-copy-code')?.addEventListener('click', (e) => {
    navigator.clipboard?.writeText(exp.cCode).then(() => {
      e.target.textContent = 'Copied!';
      setTimeout(() => { e.target.textContent = 'Copy C Code'; }, 1500);
    });
  });
}
