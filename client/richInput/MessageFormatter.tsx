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
type EmoticonType = [ MessageFragment.emoticon, unicode: number, packId: string ];
//
type FragmentType = SkipType | TextType | BrType | EmoticonType;
type FormattedMessage = FragmentType[];

// This is incremented for each new emoticon and then cached.
let emoticonKey = 0;

class MessageFormatter {
  private _array: FormattedMessage = [];
  private _reactCache: ((JSX.Element | string)[]) | null = null;

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
        const isValid = isFinite(unicode) && packId;

        if (!isValid) {
          console.warn('Invalid emoticon found; skipping.');
          continue;
        }

        result.push([
          MessageFragment.emoticon,
          unicode,
          packId,
        ]);
      }
    }

    console.log('message/>', result);
    this._array = result;
    return this;
  }

  importFromFormattedArray(array: FormattedMessage) {
    this.clearCaches();
    if (!Array.isArray(array)) {
      console.error('importFromFormattedArray requires an array.');
      return;
    }
    this._array = array;
  }

  exportAsFormattedArray() {
    return this._array;
  }

  exportAsReactComponent() {
    if (this._reactCache) {
      return this._reactCache;
    }

    console.log('working with');

    const array = this._array;
    const jsx: (JSX.Element | string)[] = [];
    for (let i = 0, len = array.length; i < len; i++) {
      const item = array[i];
      console.log('---> [exportAsReactComponent] item:', item);
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
      else if (type === MessageFragment.emoticon && item.length === 3) {
        const unicode = item[1];
        const packId = item[2];
        const style = getStyleById(packId);
        if (!unicode || !style) {
          console.error('Invalid emoticon data:', { unicode, packId, style });
          continue;
        }
        jsx.push(
          <Emoticon
            key={++emoticonKey}
            unicode={unicode}
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

  clearCaches() {
    this._reactCache = null;
  }
}

export {
  MessageFormatter,
  FormattedMessage,
  MessageFragment,
};
