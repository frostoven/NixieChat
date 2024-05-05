import { EMOTICON_CONTROL_CHAR } from './constants';

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

class MessageFormatter {
  _array: FormattedMessage = [];

  importFromElement(element: HTMLDivElement | HTMLTextAreaElement) {
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
      else if (node.nodeName === 'DIV') {
        // The only divs we currently allow are emoticons. Attempt to build
        // one, if it fails then assume something went wrong and skip. For
        // security reasons we need to be very pedantic about the structure.
        const isValid =
          node.childNodes.length === 2 &&          // Always 2, no exception.
          node.childNodes[0].nodeName === 'IMG' && // Emoticon image.
          node.childNodes[1].nodeName === 'SPAN';  // Emoticon metadata.

        if (!isValid) {
          console.warn('Found invalid div node in message; skipping.');
          continue;
        }

        // We don't need the <img> data, only the <span> matters here.
        const metadata = node.childNodes[1].textContent || '';
        const metadataParts = metadata.split(':');
        const metadataIsValid =
          metadataParts.length === 3 &&
          metadataParts[0] === EMOTICON_CONTROL_CHAR;

        if (!metadataIsValid) {
          console.warn('Found invalid emoticon; skipping.');
          continue;
        }

        result.push([
          MessageFragment.emoticon,
          parseInt(metadataParts[1]),
          metadataParts[2],
        ]);
      }
    }

    console.log('message/>', result);
    return this;
  }

  importFromFormattedArray(array: (FragmentType)[]) {
    //
  }

  exportAsFormattedArray() {
    return this._array;
  }

  exportAsReactComponent() {
    //
  }
}

export {
  MessageFormatter,
  FormattedMessage,
  MessageFragment,
};
