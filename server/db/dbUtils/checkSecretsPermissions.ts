import fs from 'fs';

/**
 * This function is meant to be used with optional config files. It checks if a
 * file has production-safe permissions. If not, crashes the application. If
 * the file does not exist, returns false.
 *
 * This functions does nothing of value on Windows, and just returns false.
 *
 * @param {string} fileName
 * @param {string|undefined} path
 * @return {boolean} True if the check was performed.
 */
function enforceSafePermissions(fileName: string, path: string = ''): boolean {
  const filePath = path + fileName;

  if (process.platform === 'win32') {
    console.warn(
      `* Warning: Not checking the file permissions of "${filePath}" ` +
      'because we\'re on Windows.',
    );
    return false;
  }

  if (!fs.existsSync(filePath)) {
    return false;
  }

  const fileStat = fs.statSync(filePath);
  // Here, parseInt returns octal permissions that look like this: 100644. This
  // allows us to determine permissions. We assume here that group reads are
  // ok, so we check only the world permissions (the last digit). We can
  // probably add a flag at some stage that lets users decide whether or not
  // group reads are acceptable.
  const filePermission = `${parseInt(fileStat.mode.toString(8), 10)}`.slice(2);
  console.log(`Permissions of ${fileName} is`, filePermission);
  const worldPermission = Number(filePermission[filePermission.length - 1]);
  if (worldPermission === 1) {
    // The reason this isn't an actual problem is that execute permissions
    // without read permissions does not actually allow execution; you still
    // get "permission denied."
    console.warn(
      `${fileName} is world-executable. Not really a problem, though it is ` +
      'strange and likely an administrative mistake.',
    );
  }
  else if (worldPermission >= 4) {
    console.error(
      `${fileName} is world-readable. This means unauthorised parties can ` +
      'read your passwords.\n\n' +
      `Please fix your ${fileName} permissions and try again. A good ` +
      `solution is running a command such as "chmod 600 ${fileName}"`,
    );
    process.exit(1);
  }
  else if (worldPermission >= 2) {
    console.error(
      `${fileName} is world-writable. This means unauthorised parties can ` +
      'make NixieChat contact the wrong databases.\n\n' +
      `Please fix your ${fileName} permissions and try again. A good ` +
      `solution is running a command such as "chmod 600 ${fileName}"`,
    );
    process.exit(1);
  }
  return true;
}

export {
  enforceSafePermissions,
};
