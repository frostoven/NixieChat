import { CollectionCache } from '../../types/CollectionCache';

interface Account {
  accountName: string,
  accountId: string,
  personalName: string,
  publicName: string,
  contacts: CollectionCache,
  privateKey: CryptoKey,
  publicKey: CryptoKey
}

export {
  Account,
}
