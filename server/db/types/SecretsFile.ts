interface SecretsFile {
  pgConnection: {
    host: undefined | string,
    user: undefined | string,
    database: undefined | string,
    password: undefined | string,
    port: undefined | number,
  }
}

export {
  SecretsFile,
}
