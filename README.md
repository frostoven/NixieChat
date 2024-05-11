# Frostoven NixieChat

NixieChat is a chat stack that uses end-to-end encryption for communication. It
uses Diffie-Hellman to add contacts, and AES-256 (in GCM mode) to encrypt
messages, accounts, and contact information. It signs messages with RSA.
NixieChat servers act only as connection forwarders, and cannot read your
messages. This project will serve as a base for the web, mobile, and desktop
version.

## !! Do not use this yet !!

This app is still in early development. It isn't fully formed yet, and still
needs a few weeks until it will be usable. It will break a lot during that
time.

## Cryptography Notice

This distribution includes cryptographic software. The country in which you
currently reside may have restrictions on the import, possession, use, and/or
re-export to another country, of encryption software. BEFORE using any
encryption software, please check your country's laws, regulations and policies
concerning the import, possession, or use, and re-export of encryption
software, to see if this is permitted.

## Security

As with all security software, please scrutinize this application before you
use it. If you notice any problems or have concerns, please report them by
[creating an issue](https://github.com/frostoven/NixieChat/issues/new)
for us to investigate. This application is designed with security as the main
priority, and we aim to maintain that standard.

As this application is still in its early stages, if you uncover any
vulnerabilities, please submit an issue. As NixieChat develops, we will
establish a dedicated security page outside of GitHub where vulnerabilities can
be submitted without posing a risk to users. We will update the issues page as
well as this README with relevant details in due course.

## Screenshots

Adding contacts:

![preview](preview_light.jpg)

![preview](preview_dark.jpg)

Profile pics are generated from RSA keys:

![preview](preview_profile.png)

## Developer notes

For build instructions see [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md).
