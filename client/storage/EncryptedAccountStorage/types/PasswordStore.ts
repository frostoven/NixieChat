interface PasswordStore {
  isPasswordSet: () => boolean,

  setPassword: (password: string) => void,

  encryptAes256Gcm: (plaintext: string) => Promise<{
    iv: Uint8Array;
    ciphertext: Uint8Array;
  } | null>

  decryptAes256Gcm: (
    ciphertext: Uint8Array, iv: Uint8Array, silenceDecryptError?: boolean,
  ) => Promise<string | null>,
}

type FrozenPasswordStore = Readonly<PasswordStore>;

export {
  PasswordStore,
  FrozenPasswordStore,
};
