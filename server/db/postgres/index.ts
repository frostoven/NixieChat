import fs from 'fs';
import { Pool } from 'pg';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { Emitter } from '@socket.io/postgres-emitter';
import { SecretsFile } from './types/SecretsFile';
import { enforceSafePermissions } from '../dbUtils/checkSecretsPermissions';

let emitter: Emitter;

enforceSafePermissions('.secrets.json');

async function initPgConnection(io: Server) {
  let secretsFile: SecretsFile = {
    pgConnection: {
      host: undefined,
      user: undefined,
      database: undefined,
      password: undefined,
      port: undefined,
    },
  };

  try {
    const data = fs.readFileSync('./.secrets.json') as unknown;
    secretsFile = JSON.parse(data as string);
  }
  catch (error: any) {
    console.error(error.toString());
    console.error();
    console.error(
      'Could not read secrets file. Please save a copy of ' +
      '".secrets.example.json" as ".secrets.json" and modify it as needed.',
    );
    // TODO: make db-based connections optional.
    process.exit(1);
  }

  console.log('=================================================================');
  const pg = secretsFile.pgConnection;
  console.log(
    `Initiating PG connection: ${pg.user}@${pg.host}:${pg.port}/${pg.database}`,
  );
  const pool = new Pool(secretsFile.pgConnection);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`);

  io.adapter(createAdapter(pool));
  emitter = new Emitter(pool);
  return emitter;
}

function getPgClusterEmitter() {
  if (!emitter) {
    console.error('Fatal: requested PG emitter too soon.');
    process.exit(2);
  }

  return emitter;
}

export {
  initPgConnection,
  getPgClusterEmitter,
};
