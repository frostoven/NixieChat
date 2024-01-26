#!/bin/sh

# This file is licensed under the terms of the MIT license.

# This scripts turns the project's build dirs into RAM disks (or tmpfs, to be
# precise) so we don't constantly hammer the disk with megabytes of data.
#
# Please run this script with elevated privileges.
#
# To undo the effects of this script, run the following with elevated
# privileges:
# umount client/.build
# umount server/.build

# Ensure the user has specified their desired user.
if test -z "$1"; then
  printf 'Please specify which user should have access to these directories.\n'
  printf 'Example Usage:\n'
  printf '  sudo ./mount_builds_as_tmpfs.sh my-normal-user\n'
  exit 0
fi

# Save arg1 as
user="$1"

# Exit if an error is encountered below.
set -ue

printf 'Making sure needed directories exist\n'
mkdir -p server/.build
mkdir -p client/.build

printf 'Creating tmpfs mount for "server/.build"\n'
sudo mount -o size=2M -t tmpfs none server/.build

printf 'Creating tmpfs mount for "client/.build"\n'
sudo mount -o size=32M -t tmpfs none client/.build

printf 'Assigning ownership\n'
chown "$user":"$user" server/.build
chown "$user":"$user" client/.build

printf 'Setting permissions\n'
chmod 750 server/.build
chmod 750 client/.build

printf 'Done\n'
