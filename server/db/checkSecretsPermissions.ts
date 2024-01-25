import fs from 'fs';

const secretStat = fs.statSync('./.secrets.json');
// Here, parseInt returns octal permissions that look like this: 100644. This
// allows us to determine permissions. We assume here that group reads are ok,
// so we check only the world permissions (the last digit). We can probably add
// a flag at some stage that lets users decide whether or not group reads are
// acceptable.
const secretsPermission = `${parseInt(secretStat.mode.toString(8), 10)}`.slice(2);
console.log('\nPermissions of .secrets.json is', secretsPermission);
const worldPermission = Number(secretsPermission[secretsPermission.length - 1]);
if (worldPermission === 1) {
  // The reason this isn't an actual problem is that execute permissions
  // without read permissions does not actually allow execution; you still get
  // "permission denied."
  console.warn(
    '.secrets.json is world-executable. Not really a problem, though it is ' +
    'strange and likely an administrative mistake.',
  );
}
else if (worldPermission >= 4) {
  console.error(
    '.secrets.json is world-readable. This means unauthorised parties can ' +
    'read your passwords.\n\n' +
    'Please fix your .secrets.json permissions and try again. A good ' +
    'solution is running a command such as "chmod 600 .secrets.json"',
  );
  process.exit(1);
}
else if (worldPermission >= 2) {
  console.error(
    '.secrets.json is world-writable. This means unauthorised parties can ' +
    'make NixieChat contact the wrong databases.\n\n' +
    'Please fix your .secrets.json permissions and try again. A good ' +
    'solution is running a command such as "chmod 600 .secrets.json"',
  );
  process.exit(1);
}
