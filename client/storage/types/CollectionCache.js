class CollectionCache {
  entryByName = {};
  length = 0;
  asArray = [];
  allEntryNames = [];

  updateCache(collection) {
    const asArray = Object.values(collection);
    this.entryByName = collection;
    this.length = asArray.length;
    this.asArray = asArray;
    this.allEntryNames = Object.keys(collection);
  }
}

export {
  CollectionCache,
};
