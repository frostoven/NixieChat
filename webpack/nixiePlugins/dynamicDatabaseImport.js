const webpack = require('webpack');

let dbDriver;
switch (process.env.PLATFORM) {
  case 'desktop':
    dbDriver = 'sqlite';
    break;
  case 'web':
  default:
    dbDriver = 'indexeddb';
}

/**
 * This acts like a string find-replace mechanism within the bundle. We use
 * this to allow bundling desktop-only libs (such as SQLite) into the
 * desktop client while using IndexedDB in the browser (we avoid IndexedDB
 * because it has poor support and a spec that's still changing).
 *
 * The reason this plugin is useful is that the web version won't bundle
 * desktop-only code, and vice-versa.
 *
 * This plugin will assume that you're targeting 'web' by default. You can set
 * it to desktop via the environment variable PLATFORM.
 *
 * @example
 * export default function getDbByPlatform() {
 *   // @ts-ignore - __DB_IMPORT__ is dynamically set by Webpack at build time.
 *   switch (__DB_IMPORT__) {
 *     case 'indexeddb':
 *       return import('./indexeddb_module_name');
 *     case 'sqlite':
 *       return import('./sqlite_module_name');
 *   }
 * }
 *
 * export {
 *   getDbByPlatform,
 * }
 */
function dynamicDatabaseImport() {
  return new webpack.DefinePlugin({
    __DB_IMPORT__: `'${dbDriver}'`,
  })
}

module.exports = dynamicDatabaseImport;
