import { name } from './name';
import { EmoTrie } from './EmoTrie';

let trieCache: EmoTrie;

// Please do not use more than one word in the a. For example, if you want
// 'tearsOfJoy', rather create two entries: one for 'tears', and another for
// 'joy'. This is needed because of how the emoticon search algorithm works.
//
// Also, for easier maintenance, please keep the keys in alphabetical order to
// ease maintenance. Just beware that inherited values are in their own section
// below the main one (for example, names.cry inherits from names.sad). The
// values on the right don't need to be alphabetical, those will display in
// the order they're written.
const names: { [key: string]: number[] } = {};
//
names.aubergine = [ name.aubergine ];
names.broken = [ name.brokenHeart ];
names.cat = [ name.catFace ];
names.confused = [ name.faceConfused ];
names.folded = [ name.foldedHands ];
names.gun = [ name.pistol ];
names.grimace = [ name.faceGrimacing ];
names.hands = [ name.foldedHands, name.thumbsUp, name.thumbsDown ];
names.heart = [ name.heart, name.brokenHeart ];
names.monocle = [ name.faceWithMonocle ];
names.neutral = [ name.faceNeutral ];
names.peach = [ name.peach ];
names.sad = [
  name.faceSlightlyFrowning, name.faceConfused, name.faceNeutral,
  name.faceWithDiagonalMouth, name.faceLoudlyCrying, name.faceWithPleadingEyes,
  name.faceSmilingTear,
];
names.salute = [ name.faceSalute ];
names.smile = [
  name.faceTearsOfJoy, name.faceSweatSmile, name.faceSlightlySmiling,
  name.faceSmilingTear,
];
names.sweat = [ name.faceSweatSmile ];
names.tear = [ name.faceTearsOfJoy, name.faceSmilingTear ];
names.thinking = [ name.faceThinking, name.faceWithMonocle ];
names.thumbs = [ name.thumbsUp, name.thumbsDown ];

// Inherited values.
names.cry = [ ...names.sad, name.faceTearsOfJoy ];
names.eggplant = names.aubergine;
names.joy = names.smile;
names.laugh = names.smile;
names.pistol = names.gun;
names.thought = names.thinking;
names.water = names.gun;
names.weapon = names.gun;

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
    const aliasNames = Object.keys(names);
    for (let i = 0, len = aliasNames.length; i < len; i++) {
      const alias = aliasNames[i];
      const unicodeValues = names[alias];
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
