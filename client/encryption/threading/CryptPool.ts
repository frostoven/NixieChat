import { ThreadPool } from './ThreadPool';
import { AesGcmDecryptResult, AesGcmEncryptResult } from '../crypto-aes-gcm';

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
class CryptPool extends ThreadPool {
  constructor() {
    super();
    // We utilize a singleton to ensure the seamless management of all
    // cryptographic threads, eliminating the necessity for calling functions
    // to coordinate among themselves.
    if (_cryptSingleton) {
      return _cryptSingleton;
    }
    else {
      _cryptSingleton = this;
    }

    const workerCount = Math.max(4, CORE_COUNT - 2);
    console.log(`CryptPool: Using ${workerCount} threads.`);
    this.initWorkers(workerCount, (id: number) => {
      // Worker URLs must always be inlined as per webpack 5 requirements,
      // which is why we construct the Worker here instead of just passing the
      // file name to the init function.
      return new Worker(
        new URL('./cryptWorker.ts', import.meta.url),
        { name: `CryptWorker${id}` },
      );
    });
  }

  /** Encrypts the specified data inside a worker thread. */
  aesGcmEncrypt(password: string, plaintext: string) {
    return new Promise<AesGcmEncryptResult>((resolve) => {
      this.processRequest({
        action: 'aesGcmEncrypt',
        password,
        plaintext,
      }, (data: AesGcmEncryptResult) => {
        resolve(data);
      }).catch(console.error);
    });
  }

  /** Decrypts the specified data inside a worker thread. */
  aesGcmDecrypt(
    password: string, ciphertext: Uint8Array, iv: Uint8Array,
    silenceDecryptError: boolean = false,
  ) {
    return new Promise<AesGcmDecryptResult>((resolve) => {
      this.processRequest({
        action: 'aesGcmDecrypt',
        password,
        ciphertext,
        iv,
        silenceDecryptError,
      }, (data: AesGcmDecryptResult) => {
        resolve(data);
      }).catch(console.error);
    });
  }
}

export {
  CryptPool,
};
