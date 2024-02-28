interface StyleManifest {
  // Parent directory.
  dir: string,
  // All emoticons we currently have for this pack.
  availableEmoticons: number[],
  toneSupport: Map<number, boolean>,
  // Some sets, such as Noto, have standard naming, but with a file prefix.
  filePrefix?: string,
  // Telegram decided to reinvent the wheel naming-wise. This is used to map
  // their emoticons to unicode characters.
  lookupTable?: object,
  // Different packs have different amounts of whitespace, dimensions, etc.
  // This number tells the UI the optimal emoticon size for each pack. This
  // number should ideally be evenly divisible with the original image width.
  size: number,
  // Margin that best suites most emoticons in this pack after scaling.
  margin: number,
  // If true, the pack in question writes its Unicode names lower-cased.
  lowerCase?: boolean,
}

export {
  StyleManifest,
}
