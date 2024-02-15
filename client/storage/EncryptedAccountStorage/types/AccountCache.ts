import { FrozenPasswordStore } from './PasswordStore';

interface AccountCache {
  accountName: string,
  decryptedData: DecryptedData | null,
  encryptedAccountBlob: Uint8Array,
  encryptedAccountIv: Uint8Array,
  passwordStore: FrozenPasswordStore,
}

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
  AccountCache,
  DecryptedData,
};
