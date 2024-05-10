/**
 * This file released by Frostoven under the MIT License.
 */

import ChangeTracker from 'change-tracker';

const CORE_COUNT = navigator?.hardwareConcurrency || 6;

let _cryptSingleton: CryptPool;

/**
 * Spawns two worker threads less than the total amount of logical processors
 * reported by the system, and uses these workers to perform cryptographic work
 * outside the main thread.
 *
 * If the system for whatever reason hides its processor count (apparently
 * Safari does this, I don't have a Mac to test), defaults to 4 threads.
 *
 * Note that any given cryptographic function will only use one thread at a
 * time. Where the parallelism becomes relevant is with concurrent
 * cryptographic tasks, such as loading multiple stored encrypted messages
 * within a chat post-boot.
 */
class CryptPool {
  _threadCount = Math.min(4, CORE_COUNT - 2);
  // Contains all web workers in this pool.
  _workers: Worker[] = [];
  // Contains the IDs of the workers ready for use.
  _availableWorkers: number[] = [];
  // If true, one or more workers are currently busy.
  // _processingActive = false;
  _jobCompletionTrackers: ChangeTracker[] = [];
  _triggerNextJob: ChangeTracker = new ChangeTracker();
  _workerResponses: any[] = [];
  _pendingRequests: any[] = [];

  constructor() {
    // We utilize a singleton to ensure the seamless management of all
    // cryptographic threads, eliminating the necessity for calling functions
    // to coordinate among themselves.
    if (_cryptSingleton) {
      return _cryptSingleton;
    }
    else {
      _cryptSingleton = Object.freeze(this);
    }

    console.log(`CryptPool: Using ${this._threadCount} threads.`);
    for (let i = 0; i < this._threadCount; i++) {
      // Dev note: URLs must always be inlined as per webpack 5 requirements.
      const worker = new Worker(
        new URL('./cryptWorker.ts', import.meta.url),
        { name: `CryptWorker${i}` },
      );

      worker.onmessage = ({ data }) => {
        this._workerResponses[i] = data;
        this._jobCompletionTrackers[i].setValue(true);
      };
      this._workers.push(worker);
      this._availableWorkers.push(i);
      this._workerResponses.push(null);
      this._jobCompletionTrackers.push(new ChangeTracker());
    }
  }

  queueEncryption(password: string, plaintext: string) {
    return new Promise<void>((resolve) => {
      this._startProcessing({
        action: 'aesGcmEncrypt',
        password,
        plaintext,
      }, (data: any) => {
        console.log('-> queueEncryption got result:', data);
        resolve(/* TBA */);
      }).catch(console.error);
    });
  }

  queueDecryption(
    password: string, ciphertext: Uint8Array, iv: Uint8Array,
    silenceDecryptError: boolean = false,
  ) {
    return new Promise<void>((resolve) => {
      this._startProcessing({
        action: 'aesGcmDecrypt',
        password,
        ciphertext,
        iv,
        silenceDecryptError,
      }, (data: any) => {
        console.log('-> queueDecryption got result:', data);
        resolve(/* TBA */);
      }).catch(console.error);
    });
  }

  /** Stalls until the specified worker posts something. */
  _waitForJob(workerId: number) {
    const completionTracker = this._jobCompletionTrackers[workerId];
    return new Promise<void>((resolve) => {
      completionTracker.getOnce(() => {
        this._jobCompletionTrackers[workerId] = new ChangeTracker();
        resolve();
      });
    });
  }

  // Starts processing if needed, else does nothing.
  async _startProcessing(data: any, onComplete: Function) {
    // Reserve a worker.
    const workerId = this._availableWorkers.pop() as number;

    // If reservation was a success, start processing. Else, wait for an
    // opening.
    if (isFinite(workerId)) {
      // Start processing and wait for completion.
      const worker = this._workers[workerId];
      worker.postMessage(data);
      await this._waitForJob(workerId);

      // Retrieve the result and clear out the old data.
      const responseData = this._workerResponses[workerId];
      this._workerResponses[workerId] = null;

      // We no longer need the worker; release it and inform those waiting.
      this._availableWorkers.push(workerId);
      this._triggerNextJob.setValue(true);

      // Return the result to the original caller for processing.
      onComplete(responseData);

      // Check if we have pending jobs, and run them if needed.
      const latestJob = this._pendingRequests.pop();
      if (latestJob) {
        console.log(
          `Starting next job, ${this._pendingRequests.length} still queued.`,
        );
        this._startProcessing(
          latestJob.data,
          latestJob.onComplete,
        ).catch(console.error);
      }
    }
    else {
      // Wait for an opening and then try again.
      console.log('Postponing job:', data);
      this._pendingRequests.push({ data, onComplete });
    }
  }
}

export {
  CryptPool,
};
