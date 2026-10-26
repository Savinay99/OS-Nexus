/**
 * OS Nexus : Page Replacement Algorithms
 */

/**
 * FIFO Page Replacement
 * @param {number[]} refString
 * @param {number} frames
 * @returns {{ steps: Array, hits: number, faults: number }}
 */
export function fifoPageReplacement(refString, frames) {
  validate(refString, frames);
  const steps = [];
  const frameState = [];
  const queue = []; // FIFO queue of indices into frameState
  let hits = 0, faults = 0;

  for (const page of refString) {
    const snapshot = [...frameState];
    const hit = frameState.includes(page);
    let replaced = null;

    if (hit) {
      hits++;
    } else {
      faults++;
      if (frameState.length < frames) {
        frameState.push(page);
        queue.push(frameState.length - 1);
      } else {
        const replaceIdx = queue.shift();
        replaced = frameState[replaceIdx];
        frameState[replaceIdx] = page;
        queue.push(replaceIdx);
      }
    }

    steps.push({ page, frames: [...frameState], hit, fault: !hit, replaced });
  }

  return { steps, hits, faults, hitRatio: hits / refString.length, faultRatio: faults / refString.length };
}

/**
 * LRU Page Replacement
 */
export function lruPageReplacement(refString, frames) {
  validate(refString, frames);
  const steps = [];
  const frameState = [];
  const lastUsed = new Map(); // page → last used index
  let hits = 0, faults = 0;

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const hit = frameState.includes(page);
    let replaced = null;

    if (hit) {
      hits++;
    } else {
      faults++;
      if (frameState.length < frames) {
        frameState.push(page);
      } else {
        // Find frame with smallest lastUsed index
        let lruPage = frameState[0];
        let lruTime = lastUsed.get(lruPage) ?? -1;
        for (const fp of frameState) {
          const t = lastUsed.get(fp) ?? -1;
          if (t < lruTime) { lruTime = t; lruPage = fp; }
        }
        replaced = lruPage;
        frameState[frameState.indexOf(lruPage)] = page;
      }
    }

    lastUsed.set(page, i);
    steps.push({ page, frames: [...frameState], hit, fault: !hit, replaced });
  }

  return { steps, hits, faults, hitRatio: hits / refString.length, faultRatio: faults / refString.length };
}

/**
 * Optimal Page Replacement
 */
export function optimalPageReplacement(refString, frames) {
  validate(refString, frames);
  const steps = [];
  const frameState = [];
  let hits = 0, faults = 0;

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const hit = frameState.includes(page);
    let replaced = null;

    if (hit) {
      hits++;
    } else {
      faults++;
      if (frameState.length < frames) {
        frameState.push(page);
      } else {
        // Find page whose next use is farthest in future
        let farthestPage = frameState[0];
        let farthestIdx = -1;
        for (const fp of frameState) {
          const nextUse = refString.indexOf(fp, i + 1);
          const useIdx = nextUse === -1 ? Infinity : nextUse;
          if (useIdx > farthestIdx) { farthestIdx = useIdx; farthestPage = fp; }
        }
        replaced = farthestPage;
        frameState[frameState.indexOf(farthestPage)] = page;
      }
    }

    steps.push({ page, frames: [...frameState], hit, fault: !hit, replaced });
  }

  return { steps, hits, faults, hitRatio: hits / refString.length, faultRatio: faults / refString.length };
}

function validate(refString, frames) {
  if (!refString || refString.length === 0) throw new Error('Page reference string cannot be empty.');
  if (!frames || frames < 1) throw new Error('Number of frames must be at least 1.');
}

/**
 * Contiguous Memory Allocation : First Fit
 * @param {number[]} blocks Array of block sizes
 * @param {number[]} processes Array of process sizes
 */
export function firstFit(blocks, processes) {
  const blk = blocks.map((size, idx) => ({ id: idx, initialSize: size, size, allocatedTo: null }));
  const allocation = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    let allocated = false;
    for (let j = 0; j < blk.length; j++) {
      if (blk[j].size >= pSize && blk[j].allocatedTo === null) {
        blk[j].allocatedTo = `P${i + 1}`;
        blk[j].used = pSize;
        blk[j].internalFrag = blk[j].size - pSize;
        allocation.push({ process: `P${i + 1}`, pSize, blockId: j, blockSize: blk[j].size, frag: blk[j].internalFrag, success: true });
        allocated = true;
        break;
      }
    }
    if (!allocated) {
      allocation.push({ process: `P${i + 1}`, pSize, blockId: null, blockSize: null, frag: null, success: false });
    }
  }

  return { blocks: blk, allocation };
}

/**
 * Contiguous Memory Allocation : Best Fit
 */
export function bestFit(blocks, processes) {
  const blk = blocks.map((size, idx) => ({ id: idx, initialSize: size, size, allocatedTo: null }));
  const allocation = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    let bestIdx = -1;
    for (let j = 0; j < blk.length; j++) {
      if (blk[j].size >= pSize && blk[j].allocatedTo === null) {
        if (bestIdx === -1 || blk[j].size < blk[bestIdx].size) {
          bestIdx = j;
        }
      }
    }

    if (bestIdx !== -1) {
      blk[bestIdx].allocatedTo = `P${i + 1}`;
      blk[bestIdx].used = pSize;
      blk[bestIdx].internalFrag = blk[bestIdx].size - pSize;
      allocation.push({ process: `P${i + 1}`, pSize, blockId: bestIdx, blockSize: blk[bestIdx].size, frag: blk[bestIdx].internalFrag, success: true });
    } else {
      allocation.push({ process: `P${i + 1}`, pSize, blockId: null, blockSize: null, frag: null, success: false });
    }
  }

  return { blocks: blk, allocation };
}

/**
 * Contiguous Memory Allocation : Worst Fit
 */
export function worstFit(blocks, processes) {
  const blk = blocks.map((size, idx) => ({ id: idx, initialSize: size, size, allocatedTo: null }));
  const allocation = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    let worstIdx = -1;
    for (let j = 0; j < blk.length; j++) {
      if (blk[j].size >= pSize && blk[j].allocatedTo === null) {
        if (worstIdx === -1 || blk[j].size > blk[worstIdx].size) {
          worstIdx = j;
        }
      }
    }

    if (worstIdx !== -1) {
      blk[worstIdx].allocatedTo = `P${i + 1}`;
      blk[worstIdx].used = pSize;
      blk[worstIdx].internalFrag = blk[worstIdx].size - pSize;
      allocation.push({ process: `P${i + 1}`, pSize, blockId: worstIdx, blockSize: blk[worstIdx].size, frag: blk[worstIdx].internalFrag, success: true });
    } else {
      allocation.push({ process: `P${i + 1}`, pSize, blockId: null, blockSize: null, frag: null, success: false });
    }
  }

  return { blocks: blk, allocation };
}

/**
 * Paging Address Translation
 * @param {number} logicalAddress
 * @param {number} pageSize
 * @param {Object<number, number>} pageTable Mapping page# -> frame#
 */
export function translateAddress(logicalAddress, pageSize, pageTable) {
  if (logicalAddress < 0 || isNaN(logicalAddress)) throw new Error('Logical address must be a non-negative integer.');
  if (pageSize <= 0 || isNaN(pageSize)) throw new Error('Page size must be greater than 0.');

  const pageNumber = Math.floor(logicalAddress / pageSize);
  const offset = logicalAddress % pageSize;
  const frameNumber = pageTable[pageNumber];

  if (frameNumber === undefined || frameNumber === null) {
    return {
      logicalAddress,
      pageSize,
      pageNumber,
      offset,
      frameNumber: null,
      physicalAddress: null,
      pageFault: true
    };
  }

  const physicalAddress = frameNumber * pageSize + offset;
  return {
    logicalAddress,
    pageSize,
    pageNumber,
    offset,
    frameNumber,
    physicalAddress,
    pageFault: false
  };
}
