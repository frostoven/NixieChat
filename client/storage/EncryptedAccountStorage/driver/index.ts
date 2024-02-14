// Automatically imports database connector most appropriate to the current
// platform.
import { StoreInterface } from '../types/StoreInterface';

type CompatibleStore = { new(): StoreInterface };

export default async function getDbByPlatform(): Promise<CompatibleStore> {
  // @ts-ignore - __DB_IMPORT__ is dynamically set by Webpack at build time.
  switch (__DB_IMPORT__) {
    case 'sqlite':
      return (await import('./sqlite')).default as CompatibleStore;
    case 'indexeddb':
    default:
      return (await import('./indexeddb')).default as CompatibleStore;
  }
}

export {
  getDbByPlatform,
};
