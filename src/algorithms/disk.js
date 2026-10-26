/**
 * OS Nexus : Disk Scheduling Algorithms
 */

/**
 * FCFS Disk Scheduling
 * @param {number} head - Initial head position
 * @param {number[]} requests - Array of cylinder requests
 * @returns {{ order: number[], movements: number[], total: number }}
 */
export function fcfsDisk(head, requests) {
  validateDisk(head, requests);
  const order = [...requests];
  const movements = [];
  let current = head;
  let total = 0;

  for (const req of order) {
    const move = Math.abs(req - current);
    movements.push(move);
    total += move;
    current = req;
  }

  return { order, movements, total, average: requests.length > 0 ? total / requests.length : 0, headStart: head };
}

/**
 * SSTF Disk Scheduling (Shortest Seek Time First)
 */
export function sstfDisk(head, requests) {
  validateDisk(head, requests);
  const remaining = [...requests];
  const order = [];
  const movements = [];
  let current = head;
  let total = 0;

  while (remaining.length > 0) {
    // Find closest request
    let closestIdx = 0;
    let closestDist = Math.abs(remaining[0] - current);

    for (let i = 1; i < remaining.length; i++) {
      const dist = Math.abs(remaining[i] - current);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    }

    const next = remaining.splice(closestIdx, 1)[0];
    order.push(next);
    movements.push(closestDist);
    total += closestDist;
    current = next;
  }

  return { order, movements, total, average: requests.length > 0 ? total / requests.length : 0, headStart: head };
}

function validateDisk(head, requests) {
  if (head < 0) throw new Error('Head position cannot be negative.');
  if (!requests || requests.length === 0) throw new Error('Request queue cannot be empty.');
  for (const r of requests) {
    if (r < 0) throw new Error(`Cylinder request ${r} cannot be negative.`);
  }
}
