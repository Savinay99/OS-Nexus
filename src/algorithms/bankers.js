/**
 * OS Nexus : Banker's Algorithm (Deadlock Avoidance)
 */

/**
 * Run Banker's safety algorithm.
 * @param {number[]} available - Available resources vector
 * @param {number[][]} allocation - Allocation matrix [process][resource]
 * @param {number[][]} maximum - Maximum demand matrix [process][resource]
 * @returns {{ safe: boolean, sequence: number[], steps: Array, need: number[][] }}
 */
export function bankersAlgorithm(available, allocation, maximum) {
  const n = allocation.length;      // number of processes
  const m = available.length;       // number of resource types

  // Validate dimensions
  if (maximum.length !== n) throw new Error('Maximum matrix row count must equal number of processes.');
  for (let i = 0; i < n; i++) {
    if (allocation[i].length !== m) throw new Error(`Allocation row ${i} length mismatch.`);
    if (maximum[i].length !== m) throw new Error(`Maximum row ${i} length mismatch.`);
  }

  // Compute Need matrix
  const need = allocation.map((row, i) => row.map((val, j) => {
    const n = maximum[i][j] - val;
    if (n < 0) throw new Error(`Process ${i}: allocation exceeds maximum for resource ${j}.`);
    return n;
  }));

  // Safety algorithm
  const work = [...available];
  const finish = Array(n).fill(false);
  const sequence = [];
  const steps = [];

  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      // Check if need[i] <= work
      const canAllocate = need[i].every((nij, j) => nij <= work[j]);
      if (canAllocate) {
        steps.push({
          process: i,
          work: [...work],
          need: [...need[i]],
          allocation: [...allocation[i]],
          finish: [...finish],
          action: `P${i} can execute: need [${need[i].join(',')}] ≤ work [${work.join(',')}]`
        });
        // Release resources
        for (let j = 0; j < m; j++) work[j] += allocation[i][j];
        finish[i] = true;
        sequence.push(i);
        found = true;
      }
    }
  }

  const safe = finish.every(f => f);
  return { safe, sequence, steps, need, work, finish };
}

/**
 * Resource Request Algorithm
 * Check if a specific resource request from process i is safe to grant.
 * @param {number} processIdx - Requesting process index
 * @param {number[]} request - Requested resources vector
 * @param {number[]} available
 * @param {number[][]} allocation
 * @param {number[][]} maximum
 */
export function resourceRequest(processIdx, request, available, allocation, maximum) {
  const n = allocation.length;
  const m = available.length;
  const need = allocation.map((row, i) => row.map((val, j) => maximum[i][j] - val));

  // Step 1: Check request <= need
  for (let j = 0; j < m; j++) {
    if (request[j] > need[processIdx][j]) {
      return { granted: false, reason: `Request exceeds maximum need for resource ${j}.` };
    }
  }

  // Step 2: Check request <= available
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      return { granted: false, reason: `Insufficient available resources (resource ${j}: need ${request[j]}, have ${available[j]}).` };
    }
  }

  // Step 3: Tentatively allocate
  const newAvail = available.map((v, j) => v - request[j]);
  const newAlloc = allocation.map((row, i) => i === processIdx ? row.map((v, j) => v + request[j]) : [...row]);
  const newMax = maximum.map(row => [...row]);

  // Step 4: Safety check
  const result = bankersAlgorithm(newAvail, newAlloc, newMax);
  if (result.safe) {
    return { granted: true, reason: `Request granted. Safe sequence: P${result.sequence.join(' → P')}.`, sequence: result.sequence };
  } else {
    return { granted: false, reason: 'Granting this request would lead to an unsafe state.' };
  }
}
