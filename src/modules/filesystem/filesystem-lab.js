/**
 * OS Nexus : Virtual File System (in-memory, no actual OS calls)
 */
import { escapeHtml, logEntry, showError } from '../../shared/ui.js';

const FS_KEY = 'osnexus_vfs';

function loadVFS() {
  try {
    const d = localStorage.getItem(FS_KEY);
    return d ? JSON.parse(d) : defaultVFS();
  } catch { return defaultVFS(); }
}

function saveVFS(vfs) {
  try { localStorage.setItem(FS_KEY, JSON.stringify(vfs)); } catch (_) { }
}

function defaultVFS() {
  return {
    root: {
      name: '/',
      type: 'dir',
      children: {
        'home': {
          name: 'home', type: 'dir', children: {
            'student': {
              name: 'student', type: 'dir', children: {
                'notes.txt': { name: 'notes.txt', type: 'file', size: 128, content: 'OS Notes: FCFS, SJF, Priority, Round Robin. Memory: FIFO, LRU, Optimal.', created: Date.now(), modified: Date.now() },
                'report.md': { name: 'report.md', type: 'file', size: 512, content: '# Lab Report\n## Experiment 1: FCFS Scheduling\nResults and observations...', created: Date.now(), modified: Date.now() },
              }
            }
          }
        },
        'etc': {
          name: 'etc', type: 'dir', children: {
            'config.conf': { name: 'config.conf', type: 'file', size: 64, content: 'max_processes=256\ntime_quantum=2\npage_frames=4', created: Date.now(), modified: Date.now() }
          }
        },
        'tmp': { name: 'tmp', type: 'dir', children: {} }
      }
    },
    currentPath: ['root'],
  };
}

export function renderFilesystem(container) {
  let vfs = loadVFS();
  let selectedFile = null;
  let searchQuery = '';

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Virtual File System</h1>
      <p class="page-subtitle">Simulated in-memory filesystem: CRUD operations, directory navigation, metadata inspection</p>
    </div>
    <div class="info-box amber" style="margin-bottom:var(--space-4)">
      This is a simulated Virtual File System running in your browser's LocalStorage. No real OS files are read or written.
    </div>

    <div class="grid-col-1-2" style="display:grid;grid-template-columns:260px 1fr;gap:var(--space-4)">
      <!-- Left: Tree Panel -->
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="card">
          <div class="row-between" style="margin-bottom:var(--space-3)">
            <h3 class="card-title" style="margin-bottom:0">File Tree</h3>
            <button class="btn btn-primary btn-sm" id="vfs-new-file">+ File</button>
          </div>
          <div class="form-group" style="margin-bottom:var(--space-3)">
            <input id="vfs-search" class="form-input" type="search" placeholder="Search files…" value="${searchQuery}" aria-label="Search files"/>
          </div>
          <div id="vfs-tree" style="max-height:400px;overflow-y:auto"></div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom:var(--space-3)">Directory Actions</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            <button class="btn btn-ghost btn-sm" id="vfs-new-dir">+ New Directory</button>
            <button class="btn btn-ghost btn-sm" id="vfs-reset-fs">Reset Filesystem</button>
          </div>
        </div>
      </div>

      <!-- Right: Editor + Metadata Panel -->
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="card" id="vfs-editor-card">
          <div id="vfs-editor-placeholder" style="color:var(--text-tertiary);font-size:var(--text-sm);text-align:center;padding:var(--space-8) 0">
            Select a file from the tree to view and edit its contents.
          </div>
          <div id="vfs-editor" style="display:none"></div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom:var(--space-3)">Filesystem Log</h3>
          <div id="vfs-log" class="event-log" style="min-height:100px"></div>
        </div>
      </div>
    </div>
  `;

  function getNodeAt(path) {
    let node = vfs.root;
    for (let i = 1; i < path.length; i++) {
      node = node.children?.[path[i]];
      if (!node) return null;
    }
    return node;
  }

  function renderTree() {
    const el = container.querySelector('#vfs-tree');
    el.innerHTML = '';
    renderNode(el, vfs.root, ['root'], 0);
  }

  function matchesSearch(node) {
    if (!searchQuery) return true;
    return node.name.toLowerCase().includes(searchQuery.toLowerCase());
  }

  function renderNode(parentEl, node, path, depth) {
    if (depth > 0 && !matchesSearch(node) && node.type !== 'dir') return;
    const div = document.createElement('div');
    div.style.paddingLeft = `${depth * 16}px`;
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '6px';
    div.style.padding = `3px 4px 3px ${depth * 16 + 4}px`;
    div.style.borderRadius = 'var(--radius-sm)';
    div.style.cursor = 'pointer';
    div.style.fontSize = 'var(--text-sm)';
    div.style.color = node.type === 'dir' ? 'var(--accent-teal)' : 'var(--text-primary)';

    const icon = node.type === 'dir' ? '📁' : '📄';
    div.innerHTML = `<span style="font-size:12px">${icon}</span><span>${escapeHtml(node.name)}</span>`;

    if (selectedFile && path.join('/') === selectedFile.join('/')) {
      div.style.background = 'var(--accent-teal-glow)';
    }

    div.addEventListener('click', () => {
      if (node.type === 'file') openFile(path, node);
    });

    parentEl.appendChild(div);

    if (node.type === 'dir' && node.children) {
      for (const child of Object.values(node.children)) {
        renderNode(parentEl, child, [...path, child.name], depth + 1);
      }
    }
  }

  function openFile(path, node) {
    selectedFile = path;
    const editorPlaceholder = container.querySelector('#vfs-editor-placeholder');
    const editorEl = container.querySelector('#vfs-editor');
    editorPlaceholder.style.display = 'none';
    editorEl.style.display = 'block';

    const sizeKB = ((node.size || node.content?.length || 0) / 1024).toFixed(2);
    editorEl.innerHTML = `
      <div class="row-between" style="margin-bottom:var(--space-4)">
        <div>
          <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary)">${escapeHtml(node.name)}</h3>
          <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px">
            Size: ${node.content?.length || 0} bytes | Created: ${new Date(node.created).toLocaleDateString()} | Modified: ${new Date(node.modified).toLocaleDateString()}
          </div>
        </div>
        <div class="row" style="gap:var(--space-2)">
          <button class="btn btn-primary btn-sm" id="vfs-save-btn">Save</button>
          <button class="btn btn-danger btn-sm" id="vfs-delete-btn">Delete</button>
        </div>
      </div>
      <textarea id="vfs-content-editor" style="width:100%;min-height:200px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-3);font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-primary);resize:vertical;outline:none;" spellcheck="false">${escapeHtml(node.content || '')}</textarea>`;

    container.querySelector('#vfs-save-btn').addEventListener('click', () => {
      const newContent = container.querySelector('#vfs-content-editor').value;
      const fileNode = getNodeAt(path);
      if (fileNode) {
        fileNode.content = newContent;
        fileNode.size = newContent.length;
        fileNode.modified = Date.now();
        saveVFS(vfs);
        logEntry(container.querySelector('#vfs-log'), 'success', `Saved ${node.name} (${newContent.length} bytes)`);
        renderTree();
      }
    });

    container.querySelector('#vfs-delete-btn').addEventListener('click', () => {
      const parentPath = path.slice(0, -1);
      const parentNode = getNodeAt(parentPath);
      if (parentNode?.children?.[node.name]) {
        delete parentNode.children[node.name];
        saveVFS(vfs);
        logEntry(container.querySelector('#vfs-log'), 'warn', `Deleted ${node.name}`);
        editorEl.style.display = 'none';
        editorPlaceholder.style.display = 'block';
        selectedFile = null;
        renderTree();
      }
    });

    renderTree();
  }

  // New file
  container.querySelector('#vfs-new-file').addEventListener('click', () => {
    const name = prompt('Enter file name (e.g. myfile.txt):');
    if (!name) return;
    const currentDir = getNodeAt(vfs.currentPath);
    if (!currentDir?.children) return;
    if (currentDir.children[name]) { alert('A file with that name already exists.'); return; }
    currentDir.children[name] = { name, type: 'file', size: 0, content: '', created: Date.now(), modified: Date.now() };
    saveVFS(vfs);
    logEntry(container.querySelector('#vfs-log'), 'success', `Created file ${name}`);
    renderTree();
    openFile([...vfs.currentPath, name], currentDir.children[name]);
  });

  // New dir
  container.querySelector('#vfs-new-dir').addEventListener('click', () => {
    const name = prompt('Enter directory name:');
    if (!name) return;
    const currentDir = getNodeAt(vfs.currentPath);
    if (!currentDir?.children) return;
    if (currentDir.children[name]) { alert('A directory with that name already exists.'); return; }
    currentDir.children[name] = { name, type: 'dir', children: {} };
    saveVFS(vfs);
    logEntry(container.querySelector('#vfs-log'), 'success', `Created directory ${name}`);
    renderTree();
  });

  // Reset FS
  container.querySelector('#vfs-reset-fs').addEventListener('click', () => {
    if (!confirm('Reset the virtual filesystem to defaults? All changes will be lost.')) return;
    vfs = defaultVFS();
    saveVFS(vfs);
    selectedFile = null;
    container.querySelector('#vfs-editor').style.display = 'none';
    container.querySelector('#vfs-editor-placeholder').style.display = 'block';
    logEntry(container.querySelector('#vfs-log'), 'info', 'Filesystem reset to defaults.');
    renderTree();
  });

  // Search
  container.querySelector('#vfs-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTree();
  });

  renderTree();
  logEntry(container.querySelector('#vfs-log'), 'info', 'Virtual File System initialized (in-memory, LocalStorage).');
}
