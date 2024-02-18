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
      request.onupgradeneeded = (event) => {
        console.log('AccountsStorage upgrade triggered.');
        const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
        if (!target) {
          console.error('[AccountsStorage] Setup or upgrade failed.', event);
          return resolve(null);
        }

        db = target.result;

        // --- Accounts store ----------------------------------- //

        const accountStore = db.createObjectStore('accounts', {
          // Key paths must be unique; this ensures we don't have multiple
          // accounts with the same name.
          keyPath: 'accountName',
        });

        // It is absolutely essential that the initialization vector is unique
        // per CryptoKey, else we can easily decrypt AES strings without the
        // password. We don't actually reuse keys, but it makes sense to
        // prevent duplicates globally in case some oversight fucks us later.
        accountStore.createIndex('encryptedAccountIv', 'encryptedAccountIv', {
          unique: true,
        });

        accountStore.transaction.oncomplete = (_) => {
          // If we ever wanted to write some default data post-creation, we'd
          // do that here.
          console.log('Accounts object store created.');
        };

        // --- Contacts store ----------------------------------- //

        // Contact stores don't have unique key paths other than a simple ID as
        // they aren't meant to be uniquely identified.
        const contactStore = db.createObjectStore('contacts', {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Same comment applies as with the encryptedAccountIv above: Keep IVs
        // unique for all contacts, even for unrelated accounts.
        contactStore.createIndex('encryptedContactIv', 'encryptedContactIv', {
          unique: true,
        });

        // All contacts belonging to the same account will have the same
        // detachable ID. The ID is 256 bits of random data presented as hex.
        contactStore.createIndex('contactDetachableId', 'contactDetachableId', {
          unique: false,
        });

        contactStore.transaction.oncomplete = (_) => {
          console.log('Contacts object store created.');
        };
      };
    });
  }

  isDbReady() {
    if (!db) {
      console.error('[AccountsStorage] Database not ready.');
      return false;
    }
    return true;
  }

  createAccount({
    accountName,
    encryptedAccountBlob,
    encryptedAccountIv,
  }) {
    return new Promise((resolve) => {
      if (!this.isDbReady()) {
        console.error('Cannot create account: DB not ready.');
        return resolve(false);
      }

      if (!accountName || !encryptedAccountIv || !encryptedAccountIv) {
        console.error('Cannot create account: Invalid parameters.');
        return resolve(false);
      }

      let transaction: IDBTransaction;
      try {
        // @ts-ignore - Better data integrity on Firefox.
        transaction = db!.transaction([ 'accounts' ], 'readwriteflush', strict);
      }
      catch (_) {
        transaction = db!.transaction([ 'accounts' ], 'readwrite', strict);
      }

      const request =
        transaction
          .objectStore('accounts')
          .add({
            accountName,
            encryptedAccountBlob,
            encryptedAccountIv,
          });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (error) => {
        console.error('error', error);
        resolve(false);
      };
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

  // Important note: This function does not ensure that the contact key is
  // valid. It assumes that the wrapper class (EncryptedAccountStorage) has
  // done all the work. This is because, at the DB level, we can only ensure
  // unencrypted are unique. All other values are encrypted (and two strings
  // with the exact same values produce different ciphertexts, even) so the DB
  // has very limited error-checking capabilities.
  addContact({
    contactDetachableId,
    encryptedContactBlob,
    encryptedContactIv,
  }) {
    return new Promise((resolve) => {
      if (!this.isDbReady()) {
        console.error('Cannot add contact: DB not ready.');
        return resolve(false);
      }

      if (!contactDetachableId || !encryptedContactBlob || !encryptedContactIv) {
        console.error('Cannot add contact: Invalid parameters.');
        return resolve(false);
      }

      let transaction: IDBTransaction;
      try {
        // @ts-ignore - Better data integrity on Firefox.
        transaction = db!.transaction([ 'contacts' ], 'readwriteflush', strict);
      }
      catch (_) {
        transaction = db!.transaction([ 'contacts' ], 'readwrite', strict);
      }

      const request =
        transaction
          .objectStore('contacts')
          .add({
            contactDetachableId,
            encryptedContactBlob,
            encryptedContactIv,
          });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (error) => {
        console.error('error', error);
        resolve(false);
      };
    });
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

  retrieveAllContacts() {
    console.error('[IndexedDb] under construction');
  }
}

export default IdbAccountStorage;
