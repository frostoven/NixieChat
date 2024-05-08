import { name } from './name';
import { EmoTrie } from './EmoTrie';

let trieCache: EmoTrie;

// Please do not use more than one word in the key. For example, if you want
// 'tearsOfJoy' rather create one entry using 'tears' and another using 'joy'.
// This is needed because we use a trie structure, which cannot search for
// substrings (without pushing the complexity to O(n^2), anyway, thus making it
// slower than a for loop).
const emoticonAliases: { [key: string]: number[] } = {
  aubergine: [ name.aubergine ],
  broken: [ name.brokenHeart ],
  gun: [ name.pistol ],
  heart: [ name.heart, name.brokenHeart ],
  neutral: [ name.faceNeutral ],
  peach: [ name.peach ],
  sad: [
    name.faceSlightlyFrowning, name.faceSmilingTear, name.faceWithDiagonalMouth,
  ],
  salute: [ name.faceSalute ],
  smile: [
    name.faceTearsOfJoy, name.faceSweatSmile, name.faceSlightlySmiling,
    name.faceSmilingTear,
  ],
  sweat: [ name.faceSweatSmile, name.faceSmilingTear ],
};

// Aliases
emoticonAliases.eggplant = emoticonAliases.aubergine;
emoticonAliases.laugh = emoticonAliases.smile;
emoticonAliases.cry = emoticonAliases.sad;
emoticonAliases.weapon = emoticonAliases.gun;
emoticonAliases.water = emoticonAliases.gun;
emoticonAliases.pistol = emoticonAliases.gun;

function findEmoticon(input: string, packId: string) {
  // Some performance.now() tests from my Ryzen 7 3750H laptop:
  // * For 20 names, a simple for-loop and trie both clock 0ms.
  // * For 10,000 names, a simple for-loop takes around 1-3ms while the trie
  //   still clocks 0ms if a single item is matched.
  // * If ALL 10,000 entries match, then a simple for-loop takes 10-15ms
  // (including enforcing uniqueness among aliases) while the trie consistently
  // clocks 0ms.
  //
  // The trie does have some disadvantages: While we can match 'tier' against
  // 'tiersOfJoy', we cannot match 'Joy' within 'tiersOfJoy'. Or, rather, doing
  // so requires a change that would make the trie complexity O(n^2), thus
  // completely defeating the point for this use-case:
  // https://stackoverflow.com/questions/8905888/trie-data-structure-and-printing-all-the-sub-strings
  // Another disadvantage is that we need to initialise the trie during the
  // first query, which averages 150ms on my machine for 10,000 aliases and
  // emoticons. Thereafter, each query clocks 0ms.
  //
  // In hindsight, this is over-engineered as 10-15ms per keystroke as an
  // unreachable worst-case is actually perfectly reasonable. But hey, why be
  // boring. Besides, this equates to less slightly battery consumption, even
  // taking the trie initialization into account.
  if (!trieCache) {
    trieCache = new EmoTrie();
    const aliasNames = Object.keys(emoticonAliases);
    for (let i = 0, len = aliasNames.length; i < len; i++) {
      const alias = aliasNames[i];
      const unicodeValues = emoticonAliases[alias];
      for (let j = 0, len = unicodeValues.length; j < len; j++) {
        const number = unicodeValues[j];
        trieCache.insert(alias, number);
      }
    }
  }

  return trieCache.search(input, packId);
}

export {
  findEmoticon,
};
