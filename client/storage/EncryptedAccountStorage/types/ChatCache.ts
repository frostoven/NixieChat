import { FrozenPasswordStore } from './PasswordStore';

/**
 * Minimum amount of information by which an encrypted chat can be
 * identified.
 */
interface BasicChatSignature {
  // Chats are stored in a table different to contacts. This string is used
  // to identify which chats belongs to which contact. This value is
  // encrypted, the purpose being to make it difficult to ascertain which
  // chats belong to which contacts without first unlocking contacts.
  // Contact information itself is also encrypted, so without the decrypted
  // contact, chat information is an unidentifiable mess.
  chatDetachableId: string,
  // An encrypted version of DecryptedContactData.
  encryptedChatBlob: Uint8Array,
  // Needed along with a password for decryption. It's very important that this
  // be unique among all entries, otherwise decrypting messages without a
  // password becomes trivial.
  encryptedChatIv: Uint8Array,
}

/**
 * Represents data as it is after database retrieval and postprocessing.
 * - For IndexedDb, this represents one entry in a JS object.
 * - For SQLite, this represents a single row in a table.
 */
interface ChatCache extends BasicChatSignature {
  messageDetachableId: string,
  decryptedData: DecryptedChatData | null,

  // // The password used here is a SHA-256 hash of the user's contact password
  // // and their 768-bit secret salt. The idea here is that if an attacker got
  // // only partial access to the user's database, brute-force decryption would
  // // be infeasible.
  // messagePasswordStore: FrozenPasswordStore,
}

/**
 * Data that's held in RAM after decryption.
 */
interface DecryptedChatData {
  // If null, the contact's name is displayed. If a string, that is displayed
  // instead.
  chatName: string | null,
  // Randomly generated string.
  internalChatId: string,
  messageDetachableId: string,
}

export {
  BasicChatSignature,
  ChatCache,
  DecryptedChatData,
};
