import React from 'react';
import { getStyleById } from '../emoticonConfig';
import { Emoticon } from '../components/ChatComponents/Emoticon';
import { EmoticonElement } from './generateEmoticon';

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
 *     [ 3, 0x2764, '❄omj' ], // type, unicode, packId
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
        result.push([ MessageFragment.text, node.nodeValue || '' ]);
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

    // console.log('message/>', result);
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
  exportAsHtmlElement() {
    console.error('exportAsHtmlElement: not yet implemented.');
  }

  /**
   * Dumps imported data.
   */
  exportAsFormattedArray() {
    return this._array;
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
