interface ConfigFileFormat {
  dbType: 'in-memory' | 'postgres',
  serverPort: number,
}

export {
  ConfigFileFormat,
};
