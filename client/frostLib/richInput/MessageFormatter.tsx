/**
 * This file released by Frostoven under the MIT License.
 */

import React from 'react';
import { getEmoticonUrl, getStyleById } from '../../emoticonConfig';
import { Emoticon } from './react/Emoticon';
import { EmoticonElement, generateEmoticon } from './generateEmoticon';

enum MessageFragment {
  skip,
  text,
  lineBreak,
  emoticon,
}

type SkipType = [ MessageFragment.skip ];
type TextType = [ MessageFragment.text, textPart: string ];
type BrType = [ MessageFragment.lineBreak ];
type EmoticonType = [
  MessageFragment.emoticon, unicode: number, packId: string, tone: number,
];
//
type FragmentType = SkipType | TextType | BrType | EmoticonType;
type FormattedMessage = FragmentType[];

// This is incremented for each new emoticon and then cached.
let emoticonKey = 0;

/**
 * #### Security info
 * Note for maintainers: This class does not, and should not ever, store HTML
 * code. Doing would be a massive security risk as it would allow hacking
 * contacts via <script> tags embedded inside messages. Instead, This class
 * assigns numeric values to every element we require for messaging, and
 * generates any / all markup on the fly as needed.
 *
 * #### Internal format
 * Data is stored as numbers inside arrays. For example, a message containing
 * text and an emoticon would look like this:
 * @example
 *   [
 *     // 1 = text, 2 = line break, 3 = emoticon
 *     [ 1, 'This is an OpenMoji heart emoji: ' ],
 *     [ 3, 0x2764, '❄omj', 0 ], // type, unicode, packId, tone
 *     [ 2 ],
 *     [ 1, 'This text follows a line break.' ],
 *   ]
 */
class MessageFormatter {
  private _array: FormattedMessage = [];
  private _reactCache: ((JSX.Element | string)[]) | null = null;

  /**
   * Scans the specified HTML element for text nodes, br nodes, and img tags.
   * Converts safe-to-use data to the MessageFormatter blackbox format,
   * discards everything else.
   * @param element
   */
  importFromElement(element: HTMLDivElement | HTMLTextAreaElement) {
    this.clearCaches();
    const result: FormattedMessage = [];

    const childNodes = element.childNodes;
    for (let i = 0, len = childNodes.length; i < len; i++) {
      const node = childNodes[i];

      if (node.nodeName === '#text') {
        const text = node.nodeValue || '';
        if (!text) {
          // We often end up with (actually a very large amount of) empty
          // nodes. Nodes have a 7-byte overhead; obvious waste, skip.
          continue;
        }
        result.push([ MessageFragment.text, text ]);
      }
      else if (node.nodeName === 'BR') {
        // Note: Text nodes may also contain line breaks, and won't show as
        // <br> nodes. Don't yet know if that's an issue, assuming it's not
        // until more testing is done. No use writing crazy amounts of code for
        // what might turn out to be a non-issue.
        result.push([ MessageFragment.lineBreak ]);
      }
      else if (node.nodeName === 'IMG') {
        // The only images we currently allow are emoticons. Attempt to build
        // one, if it fails then assume something went wrong and skip. For
        // security reasons we need to be very pedantic about the structure.
        const emoticon = node as EmoticonElement;
        const unicode = parseInt(emoticon.dataset.unicode);
        const packId = emoticon.dataset.packId;
        const tone = parseInt(emoticon.dataset.tone || '0');
        const isValid = isFinite(unicode) && packId;

        if (!isValid) {
          console.warn('Invalid emoticon found; skipping.');
          continue;
        }

        result.push([
          MessageFragment.emoticon,
          unicode,
          packId,
          tone,
        ]);
      }
    }

    this._array = result;
    return this;
  }

  /**
   * Stores the specified array.
   * @param array
   */
  importFromFormattedArray(array: FormattedMessage) {
    this.clearCaches();
    if (!Array.isArray(array)) {
      console.error('importFromFormattedArray requires an array.');
      return;
    }
    this._array = array;
    return this;
  }

  /**
   * Converts the specified string to a usable formatted message.
   */
  importFromPlaintext(text: string) {
    if (text) {
      this._array = [ [ MessageFragment.text, text ] ];
    }
    else {
      this._array = [];
    }
    return this;
  }

  /**
   * Imports a message from a JSON string.
   */
  importFromJsonString(jsonString: string) {
    let array: FormattedMessage;
    try {
      array = JSON.parse(jsonString);
    }
    catch (error) {
      console.error('[importFromJsonString] Failed: Invalid string', jsonString);
      return this;
    }

    this.importFromFormattedArray(array);
    return this;
  }

  /**
   * Used for message rendering. Converts stored information into a React
   * component and caches the result.
   */
  exportAsReactComponent() {
    if (this._reactCache) {
      return this._reactCache;
    }

    const array = this._array;
    const jsx: (JSX.Element | string)[] = [];
    for (let i = 0, len = array.length; i < len; i++) {
      const item = array[i];
      if (!item || !item.length) {
        continue;
      }

      const type = item[0];
      if (type === MessageFragment.lineBreak) {
        jsx.push(<br/>);
      }
      else if (type === MessageFragment.text && item.length === 2) {
        jsx.push(item[1] || '');
      }
      else if (type === MessageFragment.emoticon && item.length === 4) {
        const unicode = item[1];
        const packId = item[2];
        const tone = item[3];
        const style = getStyleById(packId);
        if (!unicode || !style) {
          console.error('Invalid emoticon data:', { unicode, packId, style });
          continue;
        }
        jsx.push(
          <Emoticon
            key={++emoticonKey}
            unicode={unicode}
            isPreview={false}
            tone={tone}
            styleManifest={style}
          />,
        );
      }
      else {
        console.error('Ignoring fragment', item);
      }
    }

    this._reactCache = jsx;
    return jsx;
  }

  /**
   * Used for message editing. Uses stored info to generate HTML nodes.
   */
  exportAsHtmlNodes() {
    const nodeList: Node[] = [];
    const array = this._array;
    for (let i = 0, len = array.length; i < len; i++) {
      const nodeInfo = array[i];
      const type = nodeInfo['0'];
      if (type === MessageFragment.text) {
        // Note: createTextNode doubles as an HTML escaping function.
        nodeList.push(document.createTextNode(nodeInfo['1']));
      }
      else if (type === MessageFragment.lineBreak) {
        nodeList.push(document.createElement('br'));
      }
      else if (type === MessageFragment.emoticon) {
        const unicode = nodeInfo[1];
        const style = getStyleById(nodeInfo[2]);
        const tone = nodeInfo[3];
        const path = getEmoticonUrl(unicode, style, tone);
        nodeList.push(generateEmoticon(unicode, path, style, tone));
      }
    }
    return nodeList;
  }

  /**
   * Used for message editing by the fallback input method. Discards all
   * formatted text, including emoticons.
   */
  exportAsPlaintext() {
    const textArray: string[] = [];
    const array = this._array;
    for (let i = 0, len = array.length; i < len; i++) {
      const nodeInfo = array[i];
      const type = nodeInfo['0'];
      if (type === MessageFragment.text) {
        textArray.push(nodeInfo['1']);
      }
      else if (type === MessageFragment.lineBreak) {
        textArray.push('\n');
      }
    }
    return textArray.join('');
  }

  /**
   * Dumps imported data.
   */
  exportAsFormattedArray() {
    return this._array;
  }

  /**
   * Exports imported data as a flattened JSON string.
   * @param [clearIfEmpty] - If true, will return '' instead of '[]' the
   * message has no contents. Default is false.
   */
  exportAsJsonString(clearIfEmpty = false) {
    if (clearIfEmpty && this._array.length === 0) {
      return '';
    }
    return JSON.stringify(this._array);
  }

  /**
   * Deletes all processed information.
   */
  clearCaches() {
    this._reactCache = null;
  }
}

export {
  MessageFormatter,
  FormattedMessage,
  MessageFragment,
};
