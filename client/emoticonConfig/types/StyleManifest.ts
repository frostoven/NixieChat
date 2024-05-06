interface StyleManifest {
  // The ID that uniquely identifies this emoticon pack. It may contain any
  // characters you can type with a US keyboard except ':'. The entire ID is
  // sent with each emoticon, every message, so to save on bandwidth the
  // recommended structure is 4 randomly generated secure-password-style
  // characters (which offers a few million combinations). The idea with pack
  // IDs is that, eventually, users may submit emoticon packs to NixieChat (or
  // use their own emoticon servers they trust). We'd then sanitise images from
  // these pack to ensure they don't contain malicious data. If someone sends
  // you an emoticon from a pack you do don't have, you may then choose to
  // download the relevant pack, or decline to do so.
  packId: string,
  // Parent directory.
  dir: string,
  // All emoticons we currently have for this pack.
  availableEmoticons: number[],
  toneSupport: Map<number, boolean>,
  // Some sets, such as Noto, have standard naming, but with a file prefix.
  filePrefix?: string,
  // Usually '-' or '_'.
  tonePrefix: string,
  // Telegram decided to reinvent the wheel naming-wise. This is used to map
  // their emoticons to unicode characters.
  lookupTable?: object,
  // Different packs have different amounts of whitespace, dimensions, etc.
  // This number tells the UI the optimal emoticon size for each pack. This
  // number should ideally be evenly divisible with the original image width.
  previewSize: number,
  // If true, the pack in question writes its Unicode names lower-cased.
  lowerCase?: boolean,
  // Size and margins to apply when embedded inside text.
  uiFit: {
    // Different packs have different amounts of whitespace, dimensions, etc.
    // This number tells the UI the optimal emoticon size for each pack. This
    // number should ideally be evenly divisible with the original image width.
    width: number,
    marginTop: number,
    marginRight: number,
    marginBottom: number,
    marginLeft: number,
  }
}

export {
  StyleManifest,
};
