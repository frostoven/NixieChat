// Automatically imports database connector most appropriate to the current
// platform.
export default function getDbByPlatform() {
  // @ts-ignore - __DB_IMPORT__ is dynamically set by Webpack at build time.
  switch (__DB_IMPORT__) {
    case 'indexeddb':
      return import('./indexeddb');
    case 'sqlite':
      return import('./sqlite');
  }
}

export {
  getDbByPlatform,
}
