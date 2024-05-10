/**
 * This file released by Frostoven under the MIT License.
 */

import ChangeTracker from 'change-tracker';

type WorkerArgs = {
  action: string,
  [customKey: string]: any,
}

/**
 * Spawns the specified amo
 */
class ThreadPool {
  // If true, this thread pool is ready for action.
  private _initComplete = false;
  // If true, processing is done LIFO. Else, FIFO.
  private readonly _latestFirst: boolean;
  // Contains all web workers in this pool.
  private readonly _workers: Worker[] = [];
  // Contains the IDs of the workers ready for use.
  private readonly _availableWorkersIds: number[] = [];
  // Used to wait for a worker to post a response.
  private readonly _jobCompletionTrackerById: ChangeTracker[] = [];
  // Worker responses awaiting processing.
  private readonly _workerResponses: any[] = [];
  // Requests that have not yet been sent to workers.
  private readonly _pendingRequests: {
    data: WorkerArgs,
    onComplete: Function
  }[] = [];

  /**
   * @param latestFirst - If true, processing is done LIFO. Else, FIFO.
   */
  constructor(latestFirst: boolean = true) {
    this._latestFirst = latestFirst;
  }

  /**
   * Creates all workers, and assigns them IDs.
   * @example
   * this.initWorkers(workerCount, (id: number) => {
   *   // Dev note: URLs must always be inlined as per webpack 5 requirements,
   *   // which is why we do that here instead of just passing in the file name.
   *   return new Worker(
   *     new URL('./yourWorker.ts', import.meta.url),
   *     { name: `YourWorkerName${id}` },
   *   );
   * });
   */
  protected initWorkers(workerCount: number, onCreateWorker: (id: number) => Worker) {
    if (this._initComplete) {
      console.error('ThreadPool.initWorkers may only be called once.');
      return;
    }

    for (let i = 0; i < workerCount; i++) {
      const worker = onCreateWorker(i);
      worker.onmessage = ({ data }) => {
        this._workerResponses[i] = data;
        this._jobCompletionTrackerById[i].setValue(true);
      };
      this._workers.push(worker);
      this._availableWorkersIds.push(i);
      this._workerResponses.push(null);
      this._jobCompletionTrackerById.push(new ChangeTracker());
    }

    this._initComplete = true;
  }

  /**
   * Sends the specified request to a web worker. If all web workers are
   * currently busy, queues the work for later.
   */
  protected async processRequest(data: WorkerArgs, onComplete: Function) {
    if (!this._initComplete) {
      console.error('ThreadPool needs initializing before work may be queued.');
      return;
    }

    // Reserve a worker.
    const workerId = this._availableWorkersIds.pop() as number;

    if (!isFinite(workerId)) {
      // Out of workers; reservation failed. Queue request.
      console.log('Postponing job:', data);
      this._pendingRequests.push({ data, onComplete });
      return;
    }

    // Worker reservation success; start processing and wait for completion.
    const worker = this._workers[workerId];
    worker.postMessage(data);
    await this._waitForJob(workerId);

    // Retrieve the result and clear out the old data.
    const responseData = this._workerResponses[workerId];
    this._workerResponses[workerId] = null;

    // We no longer need the worker; release it.
    this._availableWorkersIds.push(workerId);

    // Check if we have pending jobs, and run them if needed. We do this before
    // calling back the processed data so that the next worker can start
    // processing data at the same time as the main thread, rather than the
    // worker waiting for the main thread to free up first.
    let nextJob = this._latestFirst ?
      this._pendingRequests.pop() :
      this._pendingRequests.shift();

    if (typeof nextJob !== 'undefined') {
      console.log(
        `Starting next job, ${this._pendingRequests.length} still queued.`,
      );
      this.processRequest(
        nextJob.data,
        nextJob.onComplete,
      ).catch(console.error);
    }

    // Return the waiting result to the original caller for processing.
    onComplete(responseData);
  }

  /** Stalls until the specified worker posts something. */
  private _waitForJob(workerId: number) {
    const completionTracker = this._jobCompletionTrackerById[workerId];
    return new Promise<void>((resolve) => {
      completionTracker.getOnce(() => {
        this._jobCompletionTrackerById[workerId] = new ChangeTracker();
        resolve();
      });
    });
  }
}

export {
  ThreadPool,
};
