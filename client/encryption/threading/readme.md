### Security note:
This directory contains files that perform multi-threading via web workers.
At the time of writing it is unclear to the author if Spectre attacks are
possible with SharedArrayBuffers within this context, and needs further
investigating before we use them. Keep in mind that NixieChat targets old as
well as new devices, so "modern devices have this patched" might not be a
sufficient argument for using SharedArrayBuffers.

Until we've ascertained that it's safe to use SharedArrayBuffers within the
context of encryption and signing / verification, we _copy_ data between
workers instead.
