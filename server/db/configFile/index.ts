// Loads the server admin config file if it exists, or returns defaults if it
// does not.

import fs from 'fs';
import { ConfigFileFormat } from './types/ConfigFileFormat';

const configDefaults: ConfigFileFormat = {
  // Can be 'in-memory' or 'postgres'.
  dbType: 'in-memory',
  // This can also be overridden from the commandline with PORT=[N] [command].
  serverPort: 42069,
};

let configFile: ConfigFileFormat;

try {
  const data = fs.readFileSync('./.config.json') as unknown;
  configFile = {
    ...configDefaults,
    ...JSON.parse(data as string),
  };
}
catch (_) {
  configFile = {
    ...configDefaults
  };
}

// Allow commandline to take precedent.
if (process.env.NODE_PORT) {
  const defaultPort = configDefaults.serverPort;
  configFile.serverPort = parseInt(process.env.NODE_PORT) || defaultPort;
}

export {
  configFile,
};
