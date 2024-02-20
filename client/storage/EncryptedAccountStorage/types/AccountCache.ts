import { FrozenPasswordStore } from './PasswordStore';

/**
 * Minimum amount of information by which an encrypted account can be
 * identified.
 */
interface BasicAccountSignature {
  // Name used to identify the account before decryption. Note that this name
  // is private; we never share this name with contacts as it can be used to
  // identify encrypted accounts.
  accountName: string,
  // An encrypted version of DecryptedAccountData.
  ciphertext: Uint8Array,
  // Needed along with a password for decryption. It's very important that this
  // be unique among all entries, otherwise decrypting messages without a
  // password becomes trivial.
  iv: Uint8Array,
}

/**
 * Represents data as it is after database retrieval and postprocessing.
 * - For IndexedDb, this represents one entry in a JS object.
 * - For SQLite, this represents a single row in a table.
 */
interface AccountCache extends BasicAccountSignature {
  decryptedData: DecryptedAccountData | null,
  // Stores the user's password in RAM. The password is chosen by the user,
  // or '0000' if they chose not to have a password.
  accountPasswordStore: FrozenPasswordStore,
  // User password hashed with privateContactIdSalt.
  contactPasswordStore: FrozenPasswordStore,
}

/**
 * Data that's held in RAM after decryption.
 */
interface DecryptedAccountData {
  accountId: string,
  accountName: string,
  personalName: string,
  publicName: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey
  modulusHash: Uint8Array,
  contactDetachableId: string,
  privateContactIdSalt: Uint8Array,
  privateChatIdSalt: Uint8Array,
}

export {
  BasicAccountSignature,
  AccountCache,
  DecryptedAccountData,
};
