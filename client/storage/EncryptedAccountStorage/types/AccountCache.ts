import { FrozenPasswordStore } from './PasswordStore';

interface AccountCache {
  accountName: string,
  decryptedAccount: DecryptedAccount | null,
  encryptedAccountBlob: Uint8Array,
  encryptedAccountIv: Uint8Array,
  passwordStore: FrozenPasswordStore,
}

interface DecryptedAccount {
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
  DecryptedAccount,
};
