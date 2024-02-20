import { StoreInterface } from '../../types/StoreInterface';

let db: IDBDatabase | null = null;
const schemaVersion = 1;
const strict: IDBTransactionOptions = { durability: 'strict' };

/**
 * Some rules with IndexedDb:
 * - Safari is officially not supported because it does a lot of weird things,
 *   and Safari only runs on Mac. I don't own a Mac. So I can't test Safari.
 * - Transactions are tied to the event loop. If you return to the event loop,
 *   your transaction will be killed by most browsers. An example of returning
 *   to the event loop is doing an 'await' mid-transaction.
 * - Browsers like Firefox prefer performance at the expense of integrity. We
 *   use the non-standard 'readwriteflush' mode when available which asks
 *   Firefox to prefer durability. This flag doesn't work in Chrome, so we
 *   catch any errors and fall back to 'readwrite' as necessary.
 * - As of Chrome 121, the last of the giants have caved; you now need to
 *   specify { durability: 'strict' } with all writes or Chrome will default to
 *   relaxed. There is no central place to force strict durability.
 *
 * Other details:
 * - To simplify matters, AccountsStorage uses NixieStorage for unencrypted
 *   data (such as storing non-chat initialization vectors). We do this is
 *   because NixieStorage offers a high level key:value API that 'just works'™
 *   and thus makes one-off values extremely easy to manage.
 * - Data is encrypted on a per-value level. This means you cannot always do
 *   queries by arbitrary values such as text fields. There are some
 *   exceptions to the rule. For example, if the user has allowed storing data
 *   decrypted, then search functions may be written to search decrypted
 *   instead of encrypted tables.
 */

let singletonInstance: IdbAccountStorage;

class IdbAccountStorage implements StoreInterface {
  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    else {
      singletonInstance = this;
    }
  }

  /**
   * Prepares the accounts store. If it does not yet exist, it's created.
   */
  prepareAccountsStore() {
    return new Promise((resolve) => {
      const request = window.indexedDB.open('NixieAccountsStore', schemaVersion);

      // Can happen if the user declines DB use.
      request.onerror = (event) => {
        console.error('[AccountsStorage] Could not init accounts store.', event);
        return resolve(null);
      };

      // On success, we've created a connection (though not yet read to it).
      request.onsuccess = (event: Event) => {
        const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
        if (!target) {
          console.error('[AccountsStorage] Could not init accounts store.', event);
          return resolve(null);
        }

        db = target.result;
        return resolve(null);
      };

      // Upgrades are triggered during two different scenarios:
      // * New device setup.
      // * Preexisting device, but schemaVersion has changed.
      // Because upgrades are triggered on both, we use this as our generic
      // first-time setup.
      request.onupgradeneeded = async (event) => {
        console.log('Database upgrade triggered.');
        const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
        if (!target) {
          console.error('[AccountsStorage] Setup or upgrade failed.', event);
          return resolve(null);
        }

        db = target.result;

        // --- Accounts store ----------------------------------- //

        this.createEncryptedObjectStore({
          upgradeTarget: db,
          storeName: 'accounts',
          storeOptions: {
            // Key paths must be unique; this ensures we don't have multiple
            // accounts with the same name.
            keyPath: 'accountName',
          },
          // Accounts are pure roots and thus not attachable to other roots.
          detachableIdName: null,
        });

        // --- Contacts store ----------------------------------- //

        this.createEncryptedObjectStore({
          upgradeTarget: db,
          storeName: 'contacts',
          storeOptions: {
            // Contact stores don't have unique key paths other than a simple
            // ID as they aren't meant to be uniquely identified.
            keyPath: 'id',
            autoIncrement: true,
          },
          // Attaches to accounts.
          detachableIdName: 'contactDetachableId',
        });

        // --- Chats store -------------------------------------- //

        this.createEncryptedObjectStore({
          upgradeTarget: db,
          storeName: 'chats',
          storeOptions: {
            // Chat stores don't have unique key paths other than a simple ID as
            // they aren't meant to be uniquely identified.
            keyPath: 'id',
            autoIncrement: true,
          },
          // Attaches to contacts.
          detachableIdName: 'chatDetachableId',
        });

        // --- Message store ------------------------------------ //

        this.createEncryptedObjectStore({
          upgradeTarget: db,
          storeName: 'messages',
          storeOptions: {
            // Message stores don't have unique key paths other than a simple
            // ID as they aren't meant to be uniquely identified.
            keyPath: 'id',
            autoIncrement: true,
          },
          // Attaches to chats.
          detachableIdName: 'messageDetachableId',
        });
      };
    });
  }

  // Used during the database upgrade process.
  createEncryptedObjectStore({
    upgradeTarget,
    storeName,
    storeOptions,
    detachableIdName,
  }: {
    upgradeTarget: IDBDatabase,
    storeName: string,
    storeOptions: IDBObjectStoreParameters,
    detachableIdName: string | null,
  }) {
    if (!upgradeTarget) {
      console.error(
        `Could not create store "${storeName}" - db connection not ready.`,
      );
      return false;
    }

    // Begin.
    const objectStore = upgradeTarget.createObjectStore(
      storeName, storeOptions,
    );

    // It is absolutely essential that the initialization vector is unique
    // per CryptoKey, else we can easily decrypt AES strings without the
    // password. We don't actually reuse keys, but it makes sense to
    // prevent duplicates globally in case some oversight fucks us later.
    objectStore.createIndex('iv', 'iv', {
      unique: true,
    });

    if (detachableIdName !== null) {
      // A detachable ID is like a foreign key, but not enforced by the
      // database (because the root owner's copy is encrypted, so the
      // database can't see the association).
      //
      // All dependents belonging to the same root will have the same
      // detachable ID. For example, all contacts belonging to the same
      // account have the same detachable ID. The ID is 256 bits of random
      // data presented as hex.
      objectStore.createIndex(detachableIdName, detachableIdName, {
        unique: false,
      });
    }

    objectStore.transaction.oncomplete = (_) => {
      // If we ever wanted to write some default data post-creation, we'd
      // do that here.
      console.log('Object store creation complete.');
      return true;
    };
  }

  isDbReady() {
    if (!db) {
      console.error('[AccountsStorage] Database not ready.');
      return false;
    }
    return true;
  }

  // Important note: This function does not ensure that the entry's identifier
  // is valid. It assumes that the wrapper class (EncryptedAccountStorage) has
  // done all the work. This is because, at the DB level, we can only ensure
  // unencrypted are unique. All other values are encrypted (and two strings
  // with the exact same values produce different ciphertexts, even) so the DB
  // has very limited error-checking capabilities.
  createEntry({ storeName, identifierKey, identifierValue, ciphertext, iv }) {
    return new Promise((resolve) => {
      if (!this.isDbReady()) {
        console.error(`Cannot create "${storeName}" entry: DB not ready.`);
        return resolve(false);
      }

      if (!storeName || !identifierKey || !identifierValue || !iv) {
        console.error(`Cannot create "${storeName}" entry: Invalid parameters.`);
        return resolve(false);
      }

      let transaction: IDBTransaction;
      try {
        // @ts-ignore - Better data integrity on Firefox.
        transaction = db!.transaction([ storeName ], 'readwriteflush', strict);
      }
      catch (_) {
        transaction = db!.transaction([ storeName ], 'readwrite', strict);
      }

      const request =
        transaction
          .objectStore(storeName)
          .add({
            [identifierKey]: identifierValue,
            ciphertext,
            iv,
          });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (error) => {
        console.error(`${storeName} error:`, error);
        resolve(false);
      };
    });
  }

  async createAccount({ accountName, ciphertext, iv }) {
    await this.createEntry({
      storeName: 'accounts',
      identifierKey: 'accountName',
      identifierValue: accountName,
      ciphertext,
      iv,
    });
  }

  async addContact({ contactDetachableId, ciphertext, iv }) {
    await this.createEntry({
      storeName: 'contacts',
      identifierKey: 'contactDetachableId',
      identifierValue: contactDetachableId,
      ciphertext,
      iv,
    });
  }

  async createChat({ chatDetachableId, ciphertext, iv }) {
    await this.createEntry({
      storeName: 'chats',
      identifierKey: 'chatDetachableId',
      identifierValue: chatDetachableId,
      ciphertext,
      iv,
    });
  }

  async createMessage({ messageDetachableId, ciphertext, iv }) {
    await this.createEntry({
      storeName: 'messages',
      identifierKey: 'messageDetachableId',
      identifierValue: messageDetachableId,
      ciphertext,
      iv,
    });
  }

  getAllEncryptedAccounts(): Promise<object[] | null> {
    return new Promise(resolve => {
      if (!this.isDbReady()) {
        return resolve(null);
      }

      const request = db!
        .transaction([ 'accounts' ], 'readonly')
        .objectStore('accounts')
        .getAll();

      request.onsuccess = (event: Event) => {
        const target: IDBRequest = event.target as IDBRequest;
        resolve(target.result);
      };

      request.onerror = (error) => {
        console.error('error', error);
        resolve(null);
      };
    });
  }

  getAccountsStore() {
    if (!this.isDbReady()) {
      return null;
    }
    return db;
  }

  getAllContactsByOwner({ contactDetachableId }): Promise<object[] | null> {
    return new Promise(resolve => {
      if (!this.isDbReady()) {
        return resolve(null);
      }

      const request = db!
        .transaction([ 'contacts' ], 'readonly')
        .objectStore('contacts')
        .index('contactDetachableId')
        // TODO: Test using getAll() (without contactDetachableId) to get
        //  contacts that don't belong, and ensure the failure to decrypt is
        //  handled gracefully. Users need an opportunity to deal with
        //  corrupted contact data.
        .getAll(contactDetachableId);

      request.onsuccess = (event: Event) => {
        const target: IDBRequest = event.target as IDBRequest;
        resolve(target.result);
      };

      request.onerror = (error) => {
        console.error('error', error);
        resolve(null);
      };
    });
  }

  getAllChatsByOwner({ chatDetachableId }): Promise<object[] | null> {
    return new Promise(resolve => {
      if (!this.isDbReady()) {
        return resolve(null);
      }

      const request = db!
        .transaction([ 'chats' ], 'readonly')
        .objectStore('chats')
        .index('chatDetachableId')
        .getAll(chatDetachableId);

      request.onsuccess = (event: Event) => {
        const target: IDBRequest = event.target as IDBRequest;
        resolve(target.result);
      };

      request.onerror = (error) => {
        console.error('error', error);
        resolve(null);
      };
    });
  }
}

export default IdbAccountStorage;
