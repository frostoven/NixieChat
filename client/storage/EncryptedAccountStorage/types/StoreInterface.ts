import { BasicAccountSignature } from "./AccountCache";

interface StoreInterface {
  isDbReady: Function,
  prepareAccountsStore: Function,
  createAccount: (options: BasicAccountSignature) => Promise<any>,
  getAllEncryptedAccounts: () => Promise<any[]|null>,
  addContact: Function,
  createChat: Function,
  getAllContactsByOwner: Function,
  getAllChatsByOwner: Function,
  createMessage: Function,
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
  // Contacts are stored in a table different to accounts. This string is used
  // to identify which contacts belong to which account. This value is
  // encrypted, the purpose being to make it difficult to ascertain which
  // contacts belong to which accounts without first unlocking accounts.
  // Account information itself is also encrypted, so without the decrypted
  // account, contact information is an unidentifiable mess.
  contactDetachableId: string,
  // Used to salt encrypted data used when storing contacts.
  privateContactIdSalt: string,
  privateChatIdSalt: string,
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
  ciphertext: Uint8Array,
  iv: Uint8Array,
}

export {
  StoreInterface,
  AccountCreationParamsSignature,
  BasicAccountSignature,
};
