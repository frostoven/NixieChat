import { FrozenPasswordStore } from './PasswordStore';

/**
 * Minimum amount of information by which an encrypted contact can be
 * identified.
 */
interface BasicContactSignature {
  // Contacts are stored in a table different to accounts. This string is used
  // to identify which contacts belong to which account. This value is
  // encrypted, the purpose being to make it difficult to ascertain which
  // contacts belong to which accounts without first unlocking accounts.
  // Account information itself is also encrypted, so without the decrypted
  // account, contact information is an unidentifiable mess.
  contactDetachableId: string,
  // An encrypted version of DecryptedAccountData.
  encryptedContactBlob: Uint8Array,
  // Needed along with a password for decryption. It's very important that this
  // be unique among all entries, otherwise decrypting messages without a
  // password becomes trivial.
  encryptedContactIv: Uint8Array,
}

/**
 * Represents data as it is after database retrieval and postprocessing.
 * - For IndexedDb, this represents one entry in a JS object.
 * - For SQLite, this represents a single row in a table.
 */
interface ContactCache extends BasicContactSignature {
  contactDetachableId: string,
  decryptedData: DecryptedContactData | null,
  // The password used here is a SHA-256 hash of the user's account password
  // and their 768-bit secret salt. The idea here is that if an attacker got
  // only partial access to the user's database, brute-force decryption would
  // be infeasible.
  chatPasswordStore: FrozenPasswordStore,
}

/**
 * Data that's held in RAM after decryption.
 */
interface DecryptedContactData {
  // Used in the absence of a contact personal name, and for severe errors
  // where the personal name is unknown.
  initialName: string,
  // This is a random SHA-256 hash.
  internalContactId: string,
  contactPubKey: CryptoKey,
  chatDetachableId: string,
  privateChatIdSalt: Uint8Array,
  initialSharedSecret: Uint8Array,
  sharedSalt: Uint8Array,
}

export {
  BasicContactSignature,
  ContactCache,
  DecryptedContactData,
};
