# Build Instructions

_Note: This is not needed if you simply want to run the app. You only need to
do this if you want to run the NixieChat service on your own servers._

## Preparation

First, install NPM dependencies:
```
npm install
```

Next, you'll need to set up PostgreSQL for connection pooling. Please see
`.secrets.example.json` for requirements. As the project is still new, we
haven't yet made the time to write proper instructions. Please
[raise an issue](https://github.com/frostoven/NixieChat/issues)
if you would like this prioritised.

## Running a production build

```
npm run build-prod
npm start
```

You may then access the server at `http://localhost:42069`.

We do not minify the source. This increases bundle size quite substantially
but means that humans may easily inspect our source to check for malicious
intent.

## Running a developer build
```
npm run dev
```

Once the build commences, please give Webpack a few seconds to finish booting.
Once done, you may access the server at `http://localhost:42069`.

## Configs and overrides

The `.[name].example.json` files are example config files. You may copy-paste
them, remove the `.example` part from their names, and you'll have working
configs populated with defaults ready to go.

Additionally, there are some environment variables you can set that will always
override whatever is in the config files:
```
PORT=number          | Changes the server's web listening port.
NO_COLOR=1           | Disables terminal colors and ASCII characters.
PLATFORM=web|desktop | Use 'desktop' for SQLite support, 'web' uses IndexedDB.
NODE_ENV=development | Makes the application and build processes run in dev mode.
NODE_ENV=production  | Makes the application and build processes run in prod mode.
``` 

## Clustered setup

#### External web servers
Normal Socket.io rules on
[sticky sessions](https://socket.io/docs/v4/using-multiple-nodes)
apply.

#### Multi-Node setup

NixieChat supports PostgreSQL as an optional back-end for managing inter-server
device notifications. We currently don't have a guide on setting this up. Please
[raise an issue](https://github.com/frostoven/NixieChat/issues)
on GitHub if you'd like us to prioritize making such a guide.
