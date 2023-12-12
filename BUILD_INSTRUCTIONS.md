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
