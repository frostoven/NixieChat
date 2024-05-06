import { StyleManifest } from '../emoticonConfig/types/StyleManifest';

/* This exists solely for auto-completion. */
interface EmoticonElement extends HTMLImageElement {
  dataset: {
    /** Numeric identifier of this emoticon. */
    unicode: string,
    /** ID of the emoticon pack this emoticon belongs to. */
    packId: string,
    /** User-specified emoticon tone. */
    tone: string,
  };
}

function generateEmoticon(
  unicode: number, imgSrc: string, style: StyleManifest, tone: number,
) {
  if (unicode < 0x20 || unicode === 0x7F) {
    unicode = '�'.charCodeAt(0);
  }

  const packId = style.packId;
  const { marginTop, marginRight, marginBottom, marginLeft } = style.uiFit;

  const emoticon = document.createElement('img') as EmoticonElement;
  emoticon.src = imgSrc;
  emoticon.alt = String.fromCodePoint(unicode, tone);
  emoticon.style.width = `${style.uiFit.width}px`;
  emoticon.style.margin =
    `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`;
  emoticon.dataset.unicode = `${unicode}`;
  emoticon.dataset.packId = packId;
  emoticon.dataset.tone = `${tone}`;

  return emoticon;
}

export {
  EmoticonElement,
  generateEmoticon,
};
