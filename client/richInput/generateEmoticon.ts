import { StyleManifest } from '../emoticonConfig/types/StyleManifest';
import { EMOTICON_CONTROL_CHAR } from './constants';

function generateEmoticon(unicode: number, imgSrc: string, style: StyleManifest) {
  if (unicode < 0x20 || unicode === 0x7F) {
    unicode = '�'.charCodeAt(0);
  }

  const packId = style.packId;
  const { marginTop, marginRight, marginBottom, marginLeft } = style.uiFit;

  // This contains our emoticon image and its metadata.
  const emoContainer = document.createElement('div');
  emoContainer.style.display = 'inline';

  // Out actual emoticon img.
  const emoFace = document.createElement('img');
  emoFace.src = `${imgSrc}`;
  emoFace.alt = `▒`; // or maybe '❤'?
  emoFace.style.width = `${style.uiFit.width}px`;
  emoFace.style.margin =
    `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`;

  // Contains metadata. It is always hidden from user view. Metadata includes
  // data such as the emoticon pack this emoticon is from.
  const emoMeta = document.createElement('span');
  emoMeta.style.display = 'none';
  emoMeta.innerText = `${EMOTICON_CONTROL_CHAR}:${unicode}:${packId}`;

  // Bring it all together.
  emoContainer.append(emoFace, emoMeta);

  return emoContainer;
}

export {
  generateEmoticon,
};
