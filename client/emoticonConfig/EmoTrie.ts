/**
 * This file released by Frostoven under the MIT License.
 */

import { getStyleById } from './index';

/**
 * Dev note: This was done in a hurry, please double-check it's done correctly
 * before using this code for anything important. Its current intent is for use
 * with fast partial emoticon searching only, and is intentionally tightly
 * coupled with the project's emoticon structure. It does not return duplicate
 * values.
 *
 * See: https://en.wikipedia.org/wiki/Trie
 */
class EmoTrie {
  children: { [key: string]: EmoTrie } = {};
  endOfWord: boolean = false;
  items: any[] = [];

  insert(word: string, item: any) {
    let node: EmoTrie = this;
    for (let i = 0, len = word.length; i < len; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = new EmoTrie();
      }
      node = node.children[char];
    }
    node.endOfWord = true;
    node.items.push(item);
  }

  search(prefix: string, packId: string): any[] {
    let node: EmoTrie = this;
    for (let i = 0, len = prefix.length; i < len; i++) {
      const char = prefix[i];
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    const style = getStyleById(packId);
    return this._collect(node, style.availableEmoticons);
  }

  private _collect(node: EmoTrie, allowedEmoticons: number[]) {
    let results: Map<number, boolean> = new Map;
    if (node.endOfWord) {
      for (let i = 0, len = node.items.length; i < len; i++) {
        const unicode = node.items[i];
        if (allowedEmoticons.includes(unicode)) {
          results.set(node.items[i], true);
        }
      }
    }

    for (const key in node.children) {
      const children = this._collect(node.children[key], allowedEmoticons);
      for (let i = 0, len = children.length; i < len; i++) {
        const unicode = children[i];
        if (allowedEmoticons.includes(unicode)) {
          results.set(unicode, true);
        }
      }
    }
    return Array.from(results.keys());
  }
}

export {
  EmoTrie,
};
