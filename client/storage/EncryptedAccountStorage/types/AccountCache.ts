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
  // An encrypted version of DecryptedData.
  encryptedAccountBlob: Uint8Array,
  // Needed along with a password for decryption. It's very important that this
  // be unique among all entries, otherwise decrypting messages without a
  // password becomes trivial.
  encryptedAccountIv: Uint8Array,
}

/**
 * Represents data as it is after database retrieval and postprocessing.
 * - For IndexedDb, this represents one entry in a JS object.
 * - For SQLite, this represents a single row in a table.
 */
interface AccountCache extends BasicAccountSignature {
  decryptedData: DecryptedData | null,
  passwordStore: FrozenPasswordStore,
}

/**
 * Data that's held in RAM after decryption.
 */
interface DecryptedData {
  accountId: string,
  accountName: string,
  personalName: string,
  publicName: string,
  contacts: string[],
  privateKey: CryptoKey,
  publicKey: CryptoKey
  modulusHash: Uint8Array
}

export {
  BasicAccountSignature,
  AccountCache,
  DecryptedData,
};
