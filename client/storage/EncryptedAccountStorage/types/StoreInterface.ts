import { BasicAccountSignature } from "./AccountCache";

interface StoreInterface {
  isDbReady: Function,
  prepareAccountsStore: Function,
  createAccount: (options: BasicAccountSignature) => Promise<any>,
  getAllEncryptedAccounts: () => Promise<any[]|null>,
  getAccountsStore: Function,
  addContact: Function,
  retrieveAllContacts: Function,
}

interface AccountCreationParamsSignature {
  accountName: string,
  personalName: string,
  publicName: string,
  publicKey: CryptoKey,
  privateKey: CryptoKey,
  overwrite: boolean,
  // This should always be a string, even if the user opts to not have a
  // password (in which case it should be passed in as '').
  password: string,
  // Used to salt the keys used when storing contacts. The idea is to make it
  // difficult to identify which contacts belong to which accounts without
  // storing contacts and accounts in the same encrypted blob.
  privateContactIdSalt: string,
  // Used to salt the keys used when storing chats. The idea is to make it
  // difficult to identify which chats belong to which accounts without
  // storing chats and accounts in the same encrypted blob.
  privateChatIdSalt: string,
}

/**
 * An encrypted blob describing everything about a contact.
 * For IndexedDb, this represents one entry in a JS object.
 * For SQLite, this represents a single row in a table.
 */
interface ContactsBlob {
  // A string created by hashing the account ID with privateContactIdSalt.
  owningAccountIDHash: Uint8Array,
  encryptedContactBlob: Uint8Array,
  encryptedContactIv: Uint8Array,
}

/**
 * An encrypted blob describing everything about a particular message.
 * For IndexedDb, this represents one entry in a JS object.
 * For SQLite, this represents a single row in a table.
 */
interface ChatBlob {
  // A string created by hashing the account ID with privateChatIdSalt.
  owningAccountIDHash: Uint8Array,
  encryptedMessageBlob: Uint8Array,
  encryptedMessageIv: Uint8Array,
}

/**
 * An encrypted blob describing everything about a particular message.
 * For IndexedDb, this represents one entry in a JS object.
 * For SQLite, this represents a single row in a table.
 */
interface MessageBlob {
  // A string created by hashing the account ID with privateChatIdSalt.
  owningAccountIDHash: Uint8Array,
  owningAccountIDMessageIdHash: Uint8Array,
  encryptedMessageBlob: Uint8Array,
  encryptedMessageIv: Uint8Array,
}

export {
  StoreInterface,
  AccountCreationParamsSignature,
  BasicAccountSignature,
  ContactsBlob,
  ChatBlob,
};
