import { describe, it, expect } from 'vitest';
import { fcfs, sjf, priorityScheduling, roundRobin } from '../src/algorithms/cpu.js';
import {
  fifoPageReplacement,
  lruPageReplacement,
  optimalPageReplacement,
  firstFit,
  bestFit,
  worstFit,
  translateAddress
} from '../src/algorithms/memory.js';
import { fcfsDisk, sstfDisk } from '../src/algorithms/disk.js';
import { bankersAlgorithm, resourceRequest } from '../src/algorithms/bankers.js';

describe('CPU Scheduling Algorithms', () => {
  const sampleProcesses = [
    { id: 'P1', at: 0, bt: 5, priority: 2 },
    { id: 'P2', at: 1, bt: 3, priority: 1 },
    { id: 'P3', at: 2, bt: 8, priority: 3 },
    { id: 'P4', at: 3, bt: 6, priority: 2 },
  ];

  it('calculates FCFS scheduling correctly', () => {
    const res = fcfs(sampleProcesses);
    expect(res.schedule).toHaveLength(4);
    expect(res.schedule[0].ct).toBe(5);
    expect(res.schedule[1].ct).toBe(8);
    expect(res.metrics.avgTAT).toBeGreaterThan(0);
    expect(res.metrics.avgWT).toBeGreaterThan(0);
  });

  it('calculates SJF scheduling correctly', () => {
    const res = sjf(sampleProcesses);
    expect(res.schedule).toHaveLength(4);
    expect(res.gantt.length).toBeGreaterThan(0);
  });

  it('calculates Priority scheduling correctly', () => {
    const res = priorityScheduling(sampleProcesses);
    expect(res.schedule).toHaveLength(4);
    expect(res.schedule.find(p => p.id === 'P2')).toBeDefined();
  });

  it('calculates Round Robin scheduling correctly with quantum = 2', () => {
    const res = roundRobin(sampleProcesses, 2);
    expect(res.schedule).toHaveLength(4);
    expect(res.gantt.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Memory Algorithms', () => {
  const refString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0];
  const frames = 3;

  it('calculates FIFO page replacement correctly', () => {
    const res = fifoPageReplacement(refString, frames);
    expect(res.steps).toHaveLength(refString.length);
    expect(res.faults).toBeGreaterThan(0);
    expect(res.hits).toBeGreaterThan(0);
    expect(res.hitRatio + res.faultRatio).toBeCloseTo(1, 5);
  });

  it('calculates LRU page replacement correctly', () => {
    const res = lruPageReplacement(refString, frames);
    expect(res.steps).toHaveLength(refString.length);
    expect(res.faults).toBeGreaterThan(0);
    expect(res.hits).toBeGreaterThan(0);
  });

  it('calculates Optimal page replacement correctly', () => {
    const res = optimalPageReplacement(refString, frames);
    expect(res.steps).toHaveLength(refString.length);
    const fifoRes = fifoPageReplacement(refString, frames);
    expect(res.faults).toBeLessThanOrEqual(fifoRes.faults);
  });

  it('allocates memory using First Fit, Best Fit, and Worst Fit', () => {
    const blocks = [100, 500, 200, 300, 600];
    const processes = [212, 417, 112, 426];

    const ff = firstFit(blocks, processes);
    expect(ff.allocation).toHaveLength(4);
    expect(ff.allocation[0].success).toBe(true);

    const bf = bestFit(blocks, processes);
    expect(bf.allocation).toHaveLength(4);

    const wf = worstFit(blocks, processes);
    expect(wf.allocation).toHaveLength(4);
  });

  it('translates logical to physical address in paging', () => {
    const pageTable = { 0: 5, 1: 6, 2: 1, 3: 2 };
    const pageSize = 4096;
    const res = translateAddress(13318, pageSize, pageTable);

    expect(res.pageNumber).toBe(3);
    expect(res.offset).toBe(1030);
    expect(res.frameNumber).toBe(2);
    expect(res.physicalAddress).toBe(2 * 4096 + 1030);
    expect(res.pageFault).toBe(false);

    const faultRes = translateAddress(25000, pageSize, pageTable);
    expect(faultRes.pageFault).toBe(true);
  });
});

describe('Disk Scheduling Algorithms', () => {
  const requests = [82, 170, 43, 140, 24, 16, 190];
  const initialHead = 50;

  it('calculates FCFS disk scheduling correctly', () => {
    const res = fcfsDisk(initialHead, requests);
    expect(res.order).toHaveLength(requests.length);
    expect(res.movements).toHaveLength(requests.length);
    expect(res.total).toBeGreaterThan(0);
  });

  it('calculates SSTF disk scheduling correctly', () => {
    const res = sstfDisk(initialHead, requests);
    expect(res.order).toHaveLength(requests.length);
    expect(res.movements).toHaveLength(requests.length);
    const fcfsRes = fcfsDisk(initialHead, requests);
    expect(res.total).toBeLessThanOrEqual(fcfsRes.total);
  });
});

describe("Banker's Algorithm", () => {
  const available = [3, 3, 2];
  const allocation = [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ];
  const maximum = [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ];

  it('determines safe state and sequence correctly', () => {
    const res = bankersAlgorithm(available, allocation, maximum);
    expect(res.safe).toBe(true);
    expect(res.sequence).toHaveLength(5);
    expect(res.sequence[0]).toBe(1); // P1
  });

  it('evaluates safe and unsafe resource requests', () => {
    const res = resourceRequest(1, [1, 0, 2], available, allocation, maximum);
    expect(res.granted).toBe(true);
  });
});
