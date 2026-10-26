# ⚡ OS Nexus — Interactive Operating System Lab & Simulation Workbench

[![Deploy to GitHub Pages](https://github.com/Savinay99/OS-Nexus/actions/workflows/deploy.yml/badge.svg)](https://github.com/Savinay99/OS-Nexus/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest Tests](https://img.shields.io/badge/Vitest-Passing-3178C6?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Visuals-black?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **OS Nexus** is an educational simulation suite and interactive workbench designed for computer science students, educators, and engineers exploring core Operating System concepts and algorithms.

---

## 🌟 Key Highlights & Modules

### 1. 🖥️ CPU Scheduling Lab
- **Algorithms Supported**:
  - **FCFS** (First Come First Serve)
  - **SJF** (Shortest Job First — Preemptive & Non-preemptive / SRTF)
  - **Priority Scheduling** (Preemptive & Non-preemptive)
  - **Round Robin** (Configurable Time Quantum)
- **Features**: Real-time interactive Gantt chart, step-by-step timeline playback, process state queues (Ready, Running, Terminated), and automatic metric calculation (Turnaround Time, Waiting Time, Response Time, Throughput, and CPU Utilization).

### 2. 🧠 Memory Management Lab
- **Page Replacement**:
  - **FIFO** (First-In First-Out) with Belady’s anomaly detection
  - **LRU** (Least Recently Used)
  - **Optimal** (Bélády's Optimal algorithm)
  - Frame-by-frame memory matrix visualizer with Hit/Fault counter and ratio analysis.
- **Contiguous Allocation Strategies**:
  - **First Fit**, **Best Fit**, and **Worst Fit** block partition simulation with internal/external fragmentation tracking.
- **Paging & Address Translation**:
  - Interactive Logical-to-Physical address translation using simulated Page Tables, Frame numbers, and offsets.

### 3. 💾 Disk Scheduling Lab
- **Algorithms**:
  - **FCFS**, **SSTF** (Shortest Seek Time First), **SCAN**, **C-SCAN**, and **LOOK**.
- **Features**: Visual disk cylinder track, head movement seek trace, and total head movement calculation.

### 4. 🔒 Deadlock & Concurrency Lab
- **Banker's Algorithm**:
  - Safe state verification with step-by-step vector/matrix tracing (`Available`, `Allocation`, `Max`, `Need`).
  - Interactive resource request validation.
- **Classical Synchronization Problems**:
  - Producer-Consumer (Bounded Buffer), Reader-Writer, Dining Philosophers, and Sleeping Barber with mutex/semaphore state visualizations.

### 5. 📁 File System Simulator
- Simulates File Allocation Tables (FAT), Inodes, Contiguous, Linked, and Indexed block allocation schemes.

### 6. 🎓 Viva Voce & Interview Prep
- Curated flashcards, conceptual questions, numerical practice problems, and viva checklists covering university curriculums and technical interview essentials.

### 7. 🌐 3D Visualizer & Modern UI
- Hardware-accelerated Three.js 3D subsystem visualization.
- GSAP smooth transitions and micro-animations.
- Full Light/Dark theme switching with responsive desktop and mobile support.

---

## 🛠️ Technology Stack

- **Framework / Bundler**: [Vite](https://vitejs.dev/)
- **Core Logic**: Vanilla JavaScript (ES Modules, functional algorithm core)
- **Styling**: Vanilla CSS3 (Custom design system, CSS Variables, glassmorphism, responsive flex/grid)
- **Animations & 3D**: [GSAP](https://greensock.com/gsap/) & [Three.js](https://threejs.org/)
- **Unit Testing**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions deploying automatically to GitHub Pages

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18+ or 20+ recommended)
- npm (comes with Node.js)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/Savinay99/OS-Nexus.git
cd OS-Nexus
npm install
```

### Development Server
Run the local Vite dev server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

### Running Tests
Run the comprehensive Vitest unit test suite:

```bash
npm test
```

For live watch mode while developing algorithms:

```bash
npm run test:watch
```

### Production Build
Build optimized production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📂 Project Structure

```
OS-Nexus/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── public/
│   ├── CNAME                   # Custom domain mapping
│   ├── favicon.svg             # Application favicon
│   └── icons.svg               # SVG icon definitions
├── src/
│   ├── algorithms/             # Pure, decoupled algorithm implementations
│   │   ├── bankers.js          # Banker's algorithm (safety & request)
│   │   ├── cpu.js              # CPU schedulers (FCFS, SJF, Priority, RR)
│   │   ├── disk.js             # Disk scheduling algorithms
│   │   └── memory.js           # Page replacement & memory allocation
│   ├── app/                    # State management & client-side router
│   ├── modules/                # Interactive UI views for each lab module
│   │   ├── cpu/                # CPU simulation lab view
│   │   ├── memory/             # Memory lab view
│   │   ├── disk/               # Disk lab view
│   │   ├── concurrency/        # Synchronization problems
│   │   ├── resources/          # Deadlock & Banker's UI
│   │   ├── filesystem/         # File systems lab
│   │   ├── catalogue/          # Algorithm reference library
│   │   └── viva/               # OS Quiz & Viva preparation
│   ├── main.js                 # App entry point
│   └── style.css               # Design tokens, variables & layout
├── tests/
│   └── algorithms.test.js      # Vitest algorithm verification suite
├── index.html                  # Main application shell
├── package.json
└── vite.config.js
```

---

## 🚢 Deployment & Custom Domain

This repository is pre-configured with a GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Every push to the `main` branch automatically runs the test suite, creates an optimized build, and deploys to GitHub Pages!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).