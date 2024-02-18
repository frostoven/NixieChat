interface PasswordStore {
  isPasswordSet: () => boolean,

  setPassword: (password: string) => void,

  encryptAes256Gcm: (plaintext: string) => Promise<void | {
    iv: Uint8Array;
    ciphertext: Uint8Array;
  }>

  decryptAes256Gcm: (
    cyphertext: Uint8Array, iv: Uint8Array, silenceDecryptError: boolean,
  ) => Promise<string | void | null>,
}

type FrozenPasswordStore = Readonly<PasswordStore>;

export {
  PasswordStore,
  FrozenPasswordStore,
};
