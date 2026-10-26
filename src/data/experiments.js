/**
 * OS Nexus: Centralized Experiment Data Module
 * Single source of truth for all 12 experiments.
 */

export const EXPERIMENTS = [
  {
    id: 1,
    title: 'CPU Scheduling: FCFS & SJF',
    category: 'cpu',
    route: 'cpu',
    tab: 'fcfs',
    aim: 'Implement and analyze First Come First Served (FCFS) and Shortest Job First (SJF) CPU scheduling algorithms.',
    objectives: [
      'Understand non-preemptive scheduling strategies.',
      'Calculate completion time, turnaround time, and waiting time.',
      'Visualize CPU execution through Gantt charts.',
      'Compare performance of FCFS and SJF on the same process set.',
    ],
    theory: `FCFS is the simplest scheduling algorithm. Processes are executed in order of arrival. It is non-preemptive and easy to implement, but suffers from the convoy effect where short processes wait behind long ones.

SJF selects the process with the shortest burst time from the ready queue. Non-preemptive SJF provides the minimum average waiting time among all non-preemptive algorithms for a given set of processes.`,
    algorithm: [
      'Sort processes by arrival time (FCFS) or burst time (SJF).',
      'Maintain a current time pointer.',
      'If no process is ready, advance time to next arrival (CPU idle).',
      'Execute the selected process to completion.',
      'Record start, completion, turnaround, and waiting times.',
      'Repeat until all processes complete.',
    ],
    complexity: { time: 'O(n²) for SJF selection, O(n log n) for FCFS sort', space: 'O(n)' },
    cCode: `#include <stdio.h>

// FCFS Scheduling
void fcfs(int pid[], int at[], int bt[], int n) {
    int ct[n], tat[n], wt[n];
    int time = 0;
    
    // Assume sorted by arrival time
    for (int i = 0; i < n; i++) {
        if (time < at[i]) time = at[i];  // CPU idle
        ct[i]  = time + bt[i];
        tat[i] = ct[i] - at[i];
        wt[i]  = tat[i] - bt[i];
        time   = ct[i];
    }
    
    printf("PID\\tAT\\tBT\\tCT\\tTAT\\tWT\\n");
    float avgWT = 0, avgTAT = 0;
    for (int i = 0; i < n; i++) {
        printf("P%d\\t%d\\t%d\\t%d\\t%d\\t%d\\n",
               pid[i], at[i], bt[i], ct[i], tat[i], wt[i]);
        avgWT  += wt[i];
        avgTAT += tat[i];
    }
    printf("Avg WT: %.2f  Avg TAT: %.2f\\n",
           avgWT / n, avgTAT / n);
}

int main() {
    int n;
    printf("Enter number of processes: ");
    scanf("%d", &n);
    int pid[n], at[n], bt[n];
    for (int i = 0; i < n; i++) {
        pid[i] = i + 1;
        printf("Enter Arrival Time and Burst Time for P%d: ", i+1);
        scanf("%d %d", &at[i], &bt[i]);
    }
    fcfs(pid, at, bt, n);
    return 0;
}`,
    sampleInput: '4 processes: P1(AT=0,BT=5), P2(AT=1,BT=3), P3(AT=2,BT=8), P4(AT=3,BT=6)',
    sampleOutput: 'P1→CT=5,TAT=5,WT=0 | P2→CT=8,TAT=7,WT=4 | P3→CT=16,TAT=14,WT=6 | P4→CT=22,TAT=19,WT=13 | Avg WT=5.75, Avg TAT=11.25',
    commonMistakes: [
      'Not handling CPU idle time between processes.',
      'Confusing TAT = CT − AT with TAT = BT + WT.',
      'Not sorting by arrival time before running FCFS.',
      'Ignoring tie-breaking policy in SJF.',
    ],
    vivaQA: [
      { q: 'What is the convoy effect in FCFS?', a: 'When many short processes are delayed behind a long-running process, causing inefficiency. Short jobs wait while the CPU is busy with a long job.' },
      { q: 'Why does SJF give minimum average waiting time?', a: 'By always selecting the shortest job, SJF minimizes the time each subsequent process waits, provably achieving optimal average waiting time among non-preemptive algorithms.' },
      { q: 'What is the difference between preemptive and non-preemptive SJF?', a: 'Non-preemptive SJF runs a process to completion once started. Preemptive SJF (SRTF) can interrupt a running process if a new process with shorter remaining time arrives.' },
      { q: 'What happens in FCFS when all processes arrive at the same time?', a: 'The execution order depends on the queue order. Waiting time varies but total makespan remains the same.' },
      { q: 'What is starvation in SJF and how can it be prevented?', a: 'Long processes may never execute if short processes keep arriving. Aging (gradually increasing priority of waiting processes) prevents starvation.' },
    ],
  },
  {
    id: 2,
    title: 'CPU Scheduling: Priority & Round Robin',
    category: 'cpu',
    route: 'cpu',
    tab: 'priority',
    aim: 'Implement Priority Scheduling and Round Robin (RR) CPU scheduling algorithms.',
    objectives: [
      'Understand priority-based and time-sharing scheduling.',
      'Implement correct Round Robin queue management with re-enqueuing.',
      'Observe the effect of time quantum on Round Robin performance.',
      'Calculate response time and compare with FCFS/SJF.',
    ],
    theory: `Priority Scheduling assigns each process a priority number. The CPU is allocated to the process with the highest priority (lowest number in min-priority convention). Equal-priority processes are scheduled FCFS.

Round Robin is a preemptive algorithm designed for time-sharing. Each process gets a fixed time quantum. After the quantum expires, the process is preempted and placed at the back of the ready queue. Smaller quanta improve response time but increase context switches.`,
    algorithm: [
      'For Priority: Sort ready processes by priority; break ties by arrival time.',
      'Execute highest priority process until completion (non-preemptive).',
      'For Round Robin: Maintain a circular ready queue.',
      'Execute current process for min(remaining burst, quantum) time units.',
      'Enqueue newly arrived processes, then re-enqueue if not complete.',
      'Record first execution time as response time.',
    ],
    complexity: { time: 'O(n²)', space: 'O(n)' },
    cCode: `#include <stdio.h>

// Round Robin Scheduling
void roundRobin(int pid[], int at[], int bt[], int n, int quantum) {
    int rem[n], ct[n], tat[n], wt[n], rt[n];
    int firstRun[n];
    for (int i = 0; i < n; i++) { rem[i] = bt[i]; firstRun[i] = -1; }
    
    int queue[1000], front = 0, rear = 0;
    int done = 0, time = 0;
    
    // Enqueue initial process
    queue[rear++] = 0;
    
    while (done < n) {
        if (front == rear) { time++; continue; }
        int i = queue[front++];
        if (firstRun[i] == -1) firstRun[i] = time;
        
        int exec = (rem[i] < quantum) ? rem[i] : quantum;
        time += exec;
        rem[i] -= exec;
        
        // Enqueue newly arrived
        for (int j = 0; j < n; j++)
            if (j != i && at[j] <= time && rem[j] > 0 && firstRun[j] == -1)
                queue[rear++] = j;
        
        if (rem[i] == 0) {
            ct[i] = time;
            tat[i] = ct[i] - at[i];
            wt[i] = tat[i] - bt[i];
            rt[i] = firstRun[i] - at[i];
            done++;
        } else {
            queue[rear++] = i;
        }
    }
    // Print results...
}`,
    sampleInput: '4 processes: P1(AT=0,BT=5), P2(AT=1,BT=3), P3(AT=2,BT=1), P4(AT=3,BT=2) | Quantum=2',
    sampleOutput: 'Gantt: P1(0-2) P2(2-4) P3(4-5) P4(5-7) P1(7-10) P2(10-11) | Avg WT≈2.75, Avg TAT≈5.0',
    commonMistakes: [
      'Re-enqueuing unfinished process before newly arrived processes.',
      'Not initializing remaining burst time correctly.',
      'Forgetting to track first run time for response time calculation.',
    ],
    vivaQA: [
      { q: 'What is the effect of a very small time quantum in Round Robin?', a: 'It leads to increased context switch overhead and degrades to a high-overhead FCFS-like behavior where processes take many rounds to complete.' },
      { q: 'What is the effect of a very large time quantum in Round Robin?', a: 'Round Robin degrades to FCFS since most processes complete within one quantum.' },
      { q: 'What is starvation in Priority Scheduling?', a: 'Low-priority processes may wait indefinitely if high-priority processes keep arriving. Aging (gradually increasing priority of waiting processes) prevents this.' },
      { q: 'How is response time defined?', a: 'Response time = time from process submission to the time it first gets the CPU = Start Time − Arrival Time.' },
      { q: 'Why does Round Robin have better response times than FCFS?', a: 'Each process gets the CPU in turn within a bounded time, so no process waits excessively before first getting the CPU.' },
    ],
  },
  {
    id: 3,
    title: 'Process Synchronization: Mutex & Semaphore',
    category: 'concurrency',
    route: 'concurrency',
    tab: 'mutex',
    aim: 'Understand and demonstrate mutual exclusion using Mutex and Semaphore primitives.',
    objectives: [
      'Define critical section and mutual exclusion.',
      'Compare binary semaphore with mutex.',
      'Visualize acquire/release operations and waiting queues.',
      'Demonstrate race conditions in unsynchronized access.',
    ],
    theory: `A mutex (mutual exclusion lock) allows only one thread to hold the lock at a time. A thread that fails to acquire a locked mutex blocks until the lock is released. A semaphore is a generalized signaling mechanism. A binary semaphore (value 0 or 1) behaves like a mutex. A counting semaphore allows up to N concurrent accesses to a shared resource.`,
    algorithm: [
      'Thread calls acquire()/wait(): if resource free, lock it; else block.',
      'Thread enters critical section and performs operations.',
      'Thread calls release()/signal(): unlock and wake one waiting thread.',
    ],
    complexity: { time: 'O(1) per operation', space: 'O(n) for waiting queue' },
    cCode: `#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>

sem_t mutex;
int shared = 0;

void* increment(void* arg) {
    sem_wait(&mutex);        // Acquire
    int temp = shared;       // Critical section
    temp++;
    shared = temp;
    printf("Thread %ld: shared = %d\\n", (long)arg, shared);
    sem_post(&mutex);        // Release
    return NULL;
}

int main() {
    sem_init(&mutex, 0, 1);  // Binary semaphore
    pthread_t t1, t2;
    pthread_create(&t1, NULL, increment, (void*)1);
    pthread_create(&t2, NULL, increment, (void*)2);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("Final shared value: %d\\n", shared);
    sem_destroy(&mutex);
    return 0;
}`,
    sampleInput: '2 threads, 1 shared counter, binary semaphore = 1',
    sampleOutput: 'Final shared value: 2 (correct, no race condition)',
    commonMistakes: [
      'Forgetting to initialize the semaphore before use.',
      'Missing sem_post() call which causes deadlock.',
      'Using a mutex that does not support recursive locking.',
    ],
    vivaQA: [
      { q: 'What is the critical section problem?', a: 'Ensuring that only one process at a time executes code that accesses shared resources, satisfying mutual exclusion, progress, and bounded waiting.' },
      { q: 'What is the difference between mutex and semaphore?', a: 'A mutex is exclusively owned by the thread that locked it and must be unlocked by the same thread. A semaphore does not have ownership; any thread can signal it.' },
      { q: 'What are the three requirements for a solution to the critical section problem?', a: '(1) Mutual Exclusion, (2) Progress (no indefinite postponement when section is free), (3) Bounded Waiting (finite wait before entry).' },
      { q: 'What is a race condition?', a: 'A situation where the outcome depends on the relative timing of threads accessing shared data without synchronization, leading to inconsistent results.' },
      { q: 'What is a binary semaphore?', a: 'A semaphore whose value is restricted to 0 or 1. It functions as a lock: wait() decrements to 0 (lock), signal() increments back to 1 (unlock).' },
    ],
  },
  {
    id: 4,
    title: 'Producer–Consumer using Semaphore',
    category: 'concurrency',
    route: 'concurrency',
    tab: 'producer',
    aim: 'Implement the bounded-buffer Producer–Consumer problem using semaphores.',
    objectives: [
      'Model bounded buffer with fixed capacity.',
      'Use counting semaphores (empty, full) and a mutex.',
      'Prevent producer overflow and consumer underflow.',
      'Visualize buffer state changes step by step.',
    ],
    theory: `The Producer–Consumer (bounded buffer) problem uses three semaphores: mutex (binary, protects buffer access), empty (counting, initialized to buffer size, decremented by producer), full (counting, initialized to 0, incremented by producer, decremented by consumer). This ensures producers block when the buffer is full and consumers block when it is empty.`,
    algorithm: [
      'Producer: wait(empty), wait(mutex), add item, signal(mutex), signal(full).',
      'Consumer: wait(full), wait(mutex), remove item, signal(mutex), signal(empty).',
      'Buffer is circular; use head and tail pointers.',
    ],
    complexity: { time: 'O(1) per produce/consume', space: 'O(capacity)' },
    cCode: `#include <stdio.h>
#include <semaphore.h>
#include <pthread.h>
#define BUFFER_SIZE 5

int buffer[BUFFER_SIZE];
int in = 0, out = 0;
sem_t mutex, empty, full;

void produce(int item) {
    sem_wait(&empty);
    sem_wait(&mutex);
    buffer[in] = item;
    in = (in + 1) % BUFFER_SIZE;
    printf("Produced: %d\\n", item);
    sem_post(&mutex);
    sem_post(&full);
}

void consume() {
    sem_wait(&full);
    sem_wait(&mutex);
    int item = buffer[out];
    out = (out + 1) % BUFFER_SIZE;
    printf("Consumed: %d\\n", item);
    sem_post(&mutex);
    sem_post(&empty);
}`,
    sampleInput: 'Buffer size = 5, produce 7 items, consume 5 items',
    sampleOutput: 'Producer blocks when buffer is full. Consumer blocks when buffer is empty.',
    commonMistakes: [
      'Swapping the order of wait(mutex) and wait(empty/full) causes deadlock.',
      'Not using circular buffer indexing.',
      'Initializing semaphores with wrong values.',
    ],
    vivaQA: [
      { q: 'Why are three semaphores needed in the bounded buffer problem?', a: 'mutex for mutual exclusion on buffer access, empty to count available slots (producer waits when 0), full to count filled slots (consumer waits when 0).' },
      { q: 'What happens if a producer calls wait(mutex) before wait(empty)?', a: 'Deadlock: producer holds mutex and waits for empty slot; consumer needs mutex to consume and signal empty (neither can proceed).' },
      { q: 'What is the difference between counting and binary semaphore?', a: 'Binary semaphore ranges 0-1. Counting semaphore ranges 0-N, enabling multiple simultaneous accesses up to N.' },
      { q: 'What is a bounded buffer?', a: 'A fixed-size shared memory region where producers store items and consumers retrieve them. Capacity is finite.' },
      { q: 'How does this solution prevent race conditions on the buffer?', a: 'The mutex semaphore ensures only one thread (producer or consumer) modifies the buffer at a time.' },
    ],
  },
  {
    id: 5,
    title: 'Dining Philosophers using Semaphore',
    category: 'concurrency',
    route: 'concurrency',
    tab: 'dining',
    aim: 'Solve the Dining Philosophers problem using semaphores to prevent deadlock.',
    objectives: [
      'Visualize the classic dining philosophers scenario.',
      'Demonstrate how naive resource acquisition leads to deadlock.',
      'Implement a safe semaphore-based solution.',
      'Understand deadlock conditions and prevention strategies.',
    ],
    theory: `Five philosophers sit at a round table. Between each pair is one fork (5 total). A philosopher needs both adjacent forks to eat. Naive acquisition (each picks up left fork, then waits for right) leads to deadlock. Safe solutions include: allowing at most 4 philosophers simultaneously, or requiring odd-numbered philosophers to pick right fork first.`,
    algorithm: [
      'Each fork is a binary semaphore, initialized to 1.',
      'Philosopher i picks up fork i (left), then fork (i+1) % 5 (right).',
      'Safe strategy: philosopher 4 picks right fork first (breaks circular wait).',
      'After eating, philosopher puts down both forks.',
    ],
    complexity: { time: 'O(1) per philosopher action', space: 'O(n) for n philosophers' },
    cCode: `#include <stdio.h>
#include <semaphore.h>
#include <pthread.h>
#define N 5

sem_t fork_sem[N];

void philosopher(int i) {
    int left = i, right = (i + 1) % N;
    // Safe: philosopher 4 picks right first
    if (i == N - 1) { int tmp = left; left = right; right = tmp; }
    
    printf("Philosopher %d thinking\\n", i);
    sem_wait(&fork_sem[left]);
    printf("Philosopher %d picked fork %d\\n", i, left);
    sem_wait(&fork_sem[right]);
    printf("Philosopher %d eating\\n", i);
    sem_post(&fork_sem[right]);
    sem_post(&fork_sem[left]);
}`,
    sampleInput: '5 philosophers, 5 forks, sequential simulation',
    sampleOutput: 'No deadlock with asymmetric fork acquisition strategy.',
    commonMistakes: [
      'All philosophers picking left fork first causes deadlock.',
      'Not releasing forks after eating.',
      'Incorrect fork numbering (off-by-one).',
    ],
    vivaQA: [
      { q: 'What are the four necessary conditions for deadlock?', a: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. All four must hold simultaneously for deadlock to occur.' },
      { q: 'How does the asymmetric solution prevent deadlock in Dining Philosophers?', a: 'By having one philosopher pick forks in the opposite order, the circular wait condition is broken.' },
      { q: 'What is livelock?', a: 'A situation where processes keep changing state in response to each other but make no progress (similar to deadlock but with continuous state changes.' },
      { q: 'What is the difference between deadlock prevention and deadlock avoidance?', a: 'Prevention eliminates one of the four necessary conditions by design. Avoidance dynamically checks system state (e.g., Banker\'s Algorithm) to ensure safe allocation.' },
      { q: 'Can this simulation represent real OS thread behavior?', a: 'No: this is a deterministic educational simulation. Real OS scheduling is non-deterministic and involves actual kernel threads.' },
    ],
  },
  {
    id: 6,
    title: "Banker's Algorithm",
    category: 'resources',
    route: 'resources',
    tab: 'bankers',
    aim: "Apply Banker's Algorithm to determine safe states and prevent deadlock in resource allocation.",
    objectives: [
      'Compute the Need matrix from Maximum and Allocation matrices.',
      'Run the safety algorithm to find a safe execution sequence.',
      'Simulate resource requests and check if granting them is safe.',
      'Recognize unsafe states without a valid safe sequence.',
    ],
    theory: `Banker's Algorithm is a deadlock avoidance algorithm. It simulates resource allocation to ensure the system remains in a safe state. A state is safe if there exists a sequence of processes such that each process can eventually obtain all needed resources and complete, releasing resources for subsequent processes.`,
    algorithm: [
      'Compute Need[i][j] = Maximum[i][j] − Allocation[i][j].',
      'Set Work = Available, Finish[i] = false for all i.',
      'Find i such that Finish[i] = false and Need[i] ≤ Work.',
      'Set Work = Work + Allocation[i], Finish[i] = true, add i to sequence.',
      'Repeat step 3 until no such i exists.',
      'If all Finish[i] = true, state is safe; else unsafe.',
    ],
    complexity: { time: 'O(n² × m)', space: 'O(n × m)' },
    cCode: `#include <stdio.h>

void safetyAlgorithm(int n, int m, int avail[], int alloc[][10], int need[][10]) {
    int work[m], finish[n];
    int seq[n], seqIdx = 0;
    for (int j = 0; j < m; j++) work[j] = avail[j];
    for (int i = 0; i < n; i++) finish[i] = 0;
    
    int found;
    do {
        found = 0;
        for (int i = 0; i < n; i++) {
            if (finish[i]) continue;
            int canAlloc = 1;
            for (int j = 0; j < m; j++)
                if (need[i][j] > work[j]) { canAlloc = 0; break; }
            if (canAlloc) {
                for (int j = 0; j < m; j++) work[j] += alloc[i][j];
                finish[i] = 1;
                seq[seqIdx++] = i;
                found = 1;
            }
        }
    } while (found);
    
    int safe = 1;
    for (int i = 0; i < n; i++) if (!finish[i]) { safe = 0; break; }
    
    if (safe) {
        printf("Safe state! Sequence: ");
        for (int k = 0; k < seqIdx; k++) printf("P%d ", seq[k]);
    } else {
        printf("Unsafe state: deadlock possible!");
    }
}`,
    sampleInput: '5 processes, 3 resources. Available=[3,3,2]. Allocation and Maximum matrices provided.',
    sampleOutput: 'Safe sequence: P1 → P3 → P4 → P0 → P2',
    commonMistakes: [
      'Confusing Need = Maximum − Allocation with Need = Allocation − Maximum.',
      'Not resetting Work and Finish arrays between iterations.',
      'Claiming a safe sequence exists without verifying all Finish[i] = true.',
    ],
    vivaQA: [
      { q: "What is a safe state in Banker's Algorithm?", a: 'A state where there exists at least one safe sequence (an ordering of all processes such that each can complete using available resources released by its predecessors.' },
      { q: 'What is the Need matrix?', a: 'Need[i][j] = Maximum[i][j] − Allocation[i][j]. It represents additional resources process i may still request.' },
      { q: "What does Banker's Algorithm guarantee?", a: 'That the system never enters a deadlock state, provided all resource requests are checked before granting and processes declare their maximum needs upfront.' },
      { q: 'What are the limitations of the Banker\'s Algorithm?', a: 'Requires processes to declare maximum resource needs in advance, which is not always practical. Also conservative (may reject safe requests.' },
      { q: 'Is every unsafe state a deadlock?', a: 'No. An unsafe state means deadlock is possible, not certain. It depends on future requests by processes.' },
    ],
  },
  {
    id: 7,
    title: 'Page Replacement: FIFO',
    category: 'memory',
    route: 'memory',
    tab: 'fifo',
    aim: 'Implement First-In First-Out (FIFO) page replacement and calculate page fault rate.',
    objectives: [
      'Understand virtual memory and paging concepts.',
      'Implement FIFO page replacement correctly.',
      'Count page hits and page faults.',
      'Observe Belady\'s anomaly in FIFO.',
    ],
    theory: `FIFO page replacement replaces the page that has been in memory the longest. It is easy to implement using a queue. However, it suffers from Belady's anomaly: increasing the number of frames can sometimes increase page faults. The working set of a process determines the ideal frame count.`,
    algorithm: [
      'Maintain a queue of pages in memory (FIFO order).',
      'For each page reference: if page is in frames → HIT.',
      'If page is not in frames → FAULT.',
      'If frames are full, remove the front of the queue (oldest page).',
      'Add new page to the back of the queue.',
    ],
    complexity: { time: 'O(n × f)', space: 'O(f)' },
    cCode: `#include <stdio.h>
#define MAX_FRAMES 10

int frames[MAX_FRAMES], queue[1000];
int front = 0, rear = 0;

int inFrames(int page, int nf) {
    for (int i = 0; i < nf; i++) if (frames[i] == page) return 1;
    return 0;
}

void fifo(int pages[], int n, int nFrames) {
    int hits = 0, faults = 0;
    for (int i = 0; i < nFrames; i++) frames[i] = -1;
    int count = 0;
    
    for (int i = 0; i < n; i++) {
        if (inFrames(pages[i], nFrames)) {
            hits++; printf("Page %d: HIT\\n", pages[i]);
        } else {
            faults++;
            if (count < nFrames) { frames[count++] = pages[i]; queue[rear++] = count - 1; }
            else {
                int replaceIdx = queue[front++];
                frames[replaceIdx] = pages[i];
                queue[rear++] = replaceIdx;
            }
            printf("Page %d: FAULT\\n", pages[i]);
        }
    }
    printf("Hits: %d  Faults: %d\\n", hits, faults);
}`,
    sampleInput: 'Reference String: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0 | Frames: 3',
    sampleOutput: '12 faults, 4 hits',
    commonMistakes: [
      'Counting a page reference as a fault even when the page is already in frames (cache hit).',
      'Not using a circular or tracked FIFO queue properly.',
      'Confusing FIFO queue index with frame slot index.',
    ],
    vivaQA: [
      { q: "What is Belady's anomaly?", a: "FIFO exhibits Belady's anomaly: increasing the number of page frames can sometimes increase the number of page faults. This is counterintuitive and not exhibited by LRU or Optimal." },
      { q: 'What is a page fault?', a: 'A page fault occurs when a referenced page is not in physical memory (frames). The OS must load it from disk, which is expensive.' },
      { q: 'What is thrashing?', a: 'Thrashing occurs when a process spends more time handling page faults than executing: the working set is larger than available frames.' },
      { q: 'What is the working set of a process?', a: 'The set of pages a process is actively using in a given time window. Allocating at least the working set size in frames prevents excessive faulting.' },
      { q: 'Why is FIFO not always optimal?', a: 'FIFO evicts the oldest page regardless of whether it will be needed soon. A page loaded long ago may still be frequently accessed, making its eviction harmful.' },
    ],
  },
  {
    id: 8,
    title: 'Page Replacement: LRU',
    category: 'memory',
    route: 'memory',
    tab: 'lru',
    aim: 'Implement Least Recently Used (LRU) page replacement algorithm.',
    objectives: [
      'Understand the principle of temporal locality.',
      'Track last-use timestamps for each page in frames.',
      'Compare LRU performance with FIFO and Optimal.',
      'Recognize that LRU does not suffer from Belady\'s anomaly.',
    ],
    theory: `LRU replaces the page that has not been used for the longest time. It is based on the principle of temporal locality: recently accessed pages are likely to be accessed again soon. LRU never exhibits Belady's anomaly and typically performs better than FIFO, though it is harder to implement in hardware.`,
    algorithm: [
      'For each page reference: if page in frames → HIT, update last-use timestamp.',
      'If page not in frames and frames not full → add page.',
      'If frames full → evict page with smallest (oldest) last-use timestamp.',
      'Add new page and set its timestamp to current time.',
    ],
    complexity: { time: 'O(n × f)', space: 'O(f)' },
    cCode: `#include <stdio.h>
#define MAX_FRAMES 10

int frames[MAX_FRAMES], lastUsed[MAX_FRAMES];

void lru(int pages[], int n, int nFrames) {
    int hits = 0, faults = 0, count = 0;
    for (int i = 0; i < nFrames; i++) { frames[i] = -1; lastUsed[i] = -1; }
    
    for (int t = 0; t < n; t++) {
        int hit = 0;
        for (int f = 0; f < nFrames; f++) {
            if (frames[f] == pages[t]) {
                hit = 1; hits++; lastUsed[f] = t; break;
            }
        }
        if (!hit) {
            faults++;
            int slot = (count < nFrames) ? count++ : lruFrame(nFrames);
            frames[slot] = pages[t];
            lastUsed[slot] = t;
        }
    }
    printf("Hits: %d  Faults: %d\\n", hits, faults);
}

int lruFrame(int nf) {
    int lruIdx = 0;
    for (int i = 1; i < nf; i++) if (lastUsed[i] < lastUsed[lruIdx]) lruIdx = i;
    return lruIdx;
}`,
    sampleInput: 'Reference String: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0 | Frames: 3',
    sampleOutput: 'Typically fewer faults than FIFO for the same reference string.',
    commonMistakes: [
      'Updating the last-used counter even on a page fault (should update on hit and on newly loaded pages).',
      'Not scanning all frames to find the LRU victim.',
    ],
    vivaQA: [
      { q: 'What principle does LRU exploit?', a: 'Temporal locality: pages that have been used recently are likely to be used again soon.' },
      { q: "Does LRU exhibit Belady's anomaly?", a: 'No. LRU is a stack algorithm: adding more frames never increases fault count.' },
      { q: 'How is LRU implemented in hardware?', a: 'Using special reference bits or a hardware counter that records the time of last access for each page frame.' },
      { q: 'What is the approximation of LRU used in real OS?', a: 'The Clock (second chance) algorithm uses a reference bit. On fault, sweep through frames; clear reference bit if set; evict if already clear.' },
      { q: 'Compare LRU and Optimal algorithms.', a: 'Optimal achieves the minimum possible page faults but requires future knowledge (not implementable in practice). LRU approximates Optimal using past access history.' },
    ],
  },
  {
    id: 9,
    title: 'Page Replacement: Optimal',
    category: 'memory',
    route: 'memory',
    tab: 'optimal',
    aim: 'Implement the Optimal page replacement algorithm as a theoretical benchmark.',
    objectives: [
      'Understand the theoretical minimum page fault rate.',
      'Implement forward-looking page replacement.',
      'Use Optimal as a benchmark for FIFO and LRU comparison.',
      'Recognize why Optimal cannot be implemented in practice.',
    ],
    theory: `Optimal page replacement replaces the page that will not be used for the longest time in the future. It requires knowledge of the entire future reference string, making it impractical but valuable as a theoretical lower bound for page fault comparison. Also called OPT or Bélády's Optimal Algorithm.`,
    algorithm: [
      'For each page reference: if in frames → HIT.',
      'If not in frames and frames not full → add page.',
      'If frames full → look ahead in reference string.',
      'Find the frame whose page will be used farthest in the future (or never again).',
      'Evict that page; load the new page.',
    ],
    complexity: { time: 'O(n × f)', space: 'O(f + n)' },
    cCode: `#include <stdio.h>

int nextUse(int pages[], int start, int n, int page) {
    for (int i = start; i < n; i++) if (pages[i] == page) return i;
    return n; // Never used again: evict this
}

void optimal(int pages[], int n, int nFrames) {
    int frames[nFrames], count = 0, hits = 0, faults = 0;
    for (int i = 0; i < nFrames; i++) frames[i] = -1;
    
    for (int i = 0; i < n; i++) {
        int hit = 0;
        for (int f = 0; f < nFrames; f++) if (frames[f] == pages[i]) { hit = 1; break; }
        if (hit) { hits++; continue; }
        faults++;
        if (count < nFrames) { frames[count++] = pages[i]; continue; }
        // Find frame with farthest next use
        int farthest = -1, evictFrame = 0;
        for (int f = 0; f < nFrames; f++) {
            int nu = nextUse(pages, i + 1, n, frames[f]);
            if (nu > farthest) { farthest = nu; evictFrame = f; }
        }
        frames[evictFrame] = pages[i];
    }
    printf("Hits: %d  Faults: %d\\n", hits, faults);
}`,
    sampleInput: 'Reference String: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0 | Frames: 3',
    sampleOutput: '9 faults (theoretical minimum for this reference string with 3 frames)',
    commonMistakes: [
      'Looking at future use from the wrong position (should look ahead from position i+1, not from start).',
      'Not correctly handling pages that never appear again (assign infinite distance).',
    ],
    vivaQA: [
      { q: 'Why cannot Optimal be implemented in a real OS?', a: 'It requires knowing future page references in advance, which is impossible at runtime.' },
      { q: 'What is the purpose of studying Optimal algorithm?', a: 'It serves as a benchmark: the minimum achievable page faults for a given reference string and frame count. We compare FIFO, LRU, etc. against it.' },
      { q: 'Which practical algorithm comes closest to Optimal?', a: 'LRU generally comes closest in practice. Optimal uses future knowledge; LRU uses past knowledge as a proxy.' },
      { q: 'Is the Optimal algorithm unique?', a: 'No. Multiple pages may have the same next-use distance. Tie-breaking differs by implementation.' },
      { q: 'How does the number of frames affect page faults for Optimal?', a: 'More frames always reduce or maintain faults for Optimal (no Belady\'s anomaly). Fault rate decreases monotonically with more frames.' },
    ],
  },
  {
    id: 10,
    title: 'Disk Scheduling: FCFS',
    category: 'disk',
    route: 'disk',
    tab: 'fcfs',
    aim: 'Implement FCFS disk scheduling and calculate total head movement.',
    objectives: [
      'Understand disk structure (cylinders, tracks, sectors).',
      'Simulate disk head movement for FCFS order.',
      'Calculate seek time and total head movement.',
      'Identify the limitations of FCFS disk scheduling.',
    ],
    theory: `In FCFS disk scheduling, requests are serviced in the order they arrive. While fair and simple, it does not minimize head movement and can result in a lot of back-and-forth movement across the disk. Total seek time = sum of absolute differences between consecutive cylinder positions.`,
    algorithm: [
      'Record the initial head position.',
      'Service requests in the order they appear in the queue.',
      'For each request, move head to that cylinder.',
      'Record seek distance = |current − next|.',
      'Accumulate total head movement.',
    ],
    complexity: { time: 'O(n)', space: 'O(n)' },
    cCode: `#include <stdio.h>
#include <stdlib.h>

void fcfsDisk(int head, int requests[], int n) {
    int total = 0, current = head;
    printf("Head: %d -> ", current);
    for (int i = 0; i < n; i++) {
        int move = abs(requests[i] - current);
        total += move;
        current = requests[i];
        printf("%d -> ", current);
    }
    printf("\\nTotal Head Movement: %d\\n", total);
    printf("Average Movement: %.2f\\n", (float)total / n);
}`,
    sampleInput: 'Head=50, Requests=[82,170,43,140,24,16,190]',
    sampleOutput: 'Total movement = 642 cylinders',
    commonMistakes: [
      'Using signed subtraction instead of absolute value for seek distance.',
      'Not starting from the initial head position.',
    ],
    vivaQA: [
      { q: 'What is seek time in disk scheduling?', a: 'The time taken to move the disk arm to the correct cylinder (track). It is the main component of disk access time along with rotational latency.' },
      { q: 'What is the main disadvantage of FCFS disk scheduling?', a: 'It does not minimize head movement. The disk arm may thrash between far cylinders, wasting seek time.' },
      { q: 'What are the three components of disk access time?', a: 'Seek time (arm movement to cylinder), Rotational latency (wait for sector to rotate under head), Transfer time (reading/writing data).' },
      { q: 'When is FCFS disk scheduling acceptable?', a: 'When the disk load is light and fairness is more important than performance, such as in interactive systems with few disk requests.' },
      { q: 'How is total head movement computed?', a: 'Sum of absolute differences between consecutive positions: |r1 − head| + |r2 − r1| + ... + |rn − rn-1|.' },
    ],
  },
  {
    id: 11,
    title: 'Disk Scheduling: SSTF',
    category: 'disk',
    route: 'disk',
    tab: 'sstf',
    aim: 'Implement Shortest Seek Time First (SSTF) disk scheduling.',
    objectives: [
      'Implement greedy shortest-seek selection.',
      'Compare SSTF vs FCFS total head movement.',
      'Understand starvation risk in SSTF.',
      'Observe service order vs arrival order.',
    ],
    theory: `SSTF selects the pending request that is closest to the current head position, minimizing the immediate seek distance. It generally results in less total head movement than FCFS but may cause starvation of requests at cylinder extremes if requests near the center keep arriving.`,
    algorithm: [
      'Record current head position.',
      'From all pending requests, find the one with minimum |request − current|.',
      'Move head to that cylinder; remove from pending queue.',
      'Repeat until all requests are served.',
    ],
    complexity: { time: 'O(n²)', space: 'O(n)' },
    cCode: `#include <stdio.h>
#include <stdlib.h>

void sstfDisk(int head, int requests[], int n) {
    int visited[n], total = 0, current = head;
    for (int i = 0; i < n; i++) visited[i] = 0;
    
    printf("Head: %d", current);
    for (int count = 0; count < n; count++) {
        int minDist = 99999, nextIdx = -1;
        for (int i = 0; i < n; i++) {
            if (!visited[i] && abs(requests[i] - current) < minDist) {
                minDist = abs(requests[i] - current);
                nextIdx = i;
            }
        }
        visited[nextIdx] = 1;
        total += minDist;
        current = requests[nextIdx];
        printf(" -> %d", current);
    }
    printf("\\nTotal Head Movement: %d\\n", total);
}`,
    sampleInput: 'Head=50, Requests=[82,170,43,140,24,16,190]',
    sampleOutput: 'Total movement = 208 cylinders (vs 642 for FCFS)',
    commonMistakes: [
      'Not marking visited requests causes re-visiting.',
      'Selecting distance without taking absolute value.',
    ],
    vivaQA: [
      { q: 'How does SSTF improve over FCFS?', a: 'By always servicing the nearest request, SSTF reduces total head movement and average seek time compared to FCFS.' },
      { q: 'What is the major disadvantage of SSTF?', a: 'Starvation: requests far from the frequently-accessed area may wait indefinitely as closer requests keep arriving.' },
      { q: 'Which algorithm is better: SSTF or SCAN?', a: 'SCAN (elevator algorithm) provides a balance: better than FCFS, prevents starvation unlike SSTF, with reasonable seek times.' },
      { q: 'Is SSTF optimal?', a: 'No. It is a greedy algorithm optimizing locally. The globally optimal disk schedule is NP-hard to compute.' },
      { q: 'What is rotational latency?', a: 'The time waiting for the desired sector to rotate under the read/write head after the arm has reached the correct cylinder.' },
    ],
  },
  {
    id: 12,
    title: 'Integrated OS Simulation Project',
    category: 'integrated',
    route: 'integrated',
    tab: 'workbench',
    aim: 'Integrate CPU scheduling, memory management, resource allocation, and file system into one unified OS simulation workbench.',
    objectives: [
      'Create and manage simulated processes with full lifecycle.',
      'Apply CPU scheduling and observe Gantt chart output.',
      'Simulate page replacement and observe memory behavior.',
      'Run Banker\'s safety analysis on a resource allocation scenario.',
      'Manage a virtual file system and inspect simulated file operations.',
    ],
    theory: `This experiment brings together all OS concepts from Experiments 1–11 into a unified simulation. A real operating system simultaneously manages the CPU (scheduling), memory (virtual memory, paging), storage (file system, disk scheduling), and resources (deadlock avoidance). This workbench lets you explore how each subsystem behaves and interact with them independently within a single interface.`,
    algorithm: ['See individual experiment documentation for each subsystem.'],
    complexity: { time: 'Varies by subsystem', space: 'O(n × m) overall' },
    cCode: `// This experiment integrates concepts from all previous experiments.
// See the individual experiment source code tabs for C implementations.`,
    sampleInput: 'Use the Integrated Workbench tab to configure all subsystems.',
    sampleOutput: 'Results from each subsystem simulator displayed in unified event log.',
    commonMistakes: [
      'Assuming subsystems are truly coupled: they are independent simulations in this workbench.',
      'Not resetting state before running a new simulation.',
    ],
    vivaQA: [
      { q: 'What are the main responsibilities of an operating system?', a: 'Process management, memory management, storage management, I/O management, security, and providing a user interface.' },
      { q: 'What is the difference between a process and a thread?', a: 'A process is an independent program with its own address space. A thread is a lightweight unit of execution within a process, sharing the process address space.' },
      { q: 'What is virtual memory?', a: 'An abstraction that gives each process its own large, private address space, backed by physical RAM and disk storage, with paging translating virtual to physical addresses.' },
      { q: 'What is the role of the OS scheduler?', a: 'To decide which process runs on the CPU at each moment, aiming to maximize CPU utilization, throughput, and fairness while minimizing waiting time and response time.' },
      { q: 'What is a system call?', a: 'A programmatic way for a process to request services from the operating system kernel (e.g., file I/O, process creation, memory allocation.' },
    ],
  },
];

export function getExperimentById(id) {
  return EXPERIMENTS.find(e => e.id === id);
}

export function getExperimentsByCategory(cat) {
  return EXPERIMENTS.filter(e => e.category === cat);
}

export const CATEGORIES = [
  { id: 'cpu',        label: 'CPU Scheduling',       expIds: [1, 2] },
  { id: 'concurrency',label: 'Concurrency',           expIds: [3, 4, 5] },
  { id: 'resources',  label: 'Resource Allocation',   expIds: [6] },
  { id: 'memory',     label: 'Memory Management',     expIds: [7, 8, 9] },
  { id: 'disk',       label: 'Disk Scheduling',       expIds: [10, 11] },
  { id: 'integrated', label: 'Integrated Project',    expIds: [12] },
];
