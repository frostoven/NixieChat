// Each emoticon below has a styles array. Currently:
// * 0 is used for OpenMoji.
// * 1 is used for Google's Noto Emoji (the Android set).
// * 2 is used for Telegram emoticons.
// * 3 is miscellany.
import { tgramLookup } from './2-Telegram/lookupTable';
import { openMojiList, openMojiToneSupport } from './0-OpenMoji/list';
import { notoList, notoToneSupport } from './1-Noto/list';
import { tgramList, tgramToneSupport } from './2-Telegram/list';
import { miscMojiList, miscMojiToneSupport } from './3-Misc/list';
import { StyleManifest } from './types/StyleManifest';

const EMOTION_BASE = 'assets/emo/';

const emoticonPathCache = {};

const emoticonConfig: StyleManifest[] = [
  {
    packId: '❄omj',
    dir: '0-OpenMoji',
    availableEmoticons: openMojiList,
    tonePrefix: '-',
    toneSupport: openMojiToneSupport,
    previewSize: 36,
    uiFit: {
      width: 24,
      marginTop: 0,
      marginRight: -2,
      marginBottom: -7,
      marginLeft: -2,
    },
  },
  {
    packId: '❄nto',
    dir: '1-Noto',
    availableEmoticons: notoList,
    filePrefix: 'emoji_u',
    tonePrefix: '_',
    toneSupport: notoToneSupport,
    lowerCase: true,
    previewSize: 24,
    uiFit: {
      width: 18,
      marginTop: 0,
      marginRight: 1,
      marginBottom: -4,
      marginLeft: 0,
    },
  },
  {
    packId: '❄tgm',
    dir: '2-Telegram',
    availableEmoticons: tgramList,
    tonePrefix: '',
    lookupTable: tgramLookup,
    toneSupport: tgramToneSupport,
    previewSize: 33,
    uiFit: {
      width: 33,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    },
  },
  {
    packId: '❄nxm',
    dir: '3-Misc',
    availableEmoticons: miscMojiList,
    tonePrefix: '-',
    toneSupport: miscMojiToneSupport,
    previewSize: 24,
    uiFit: {
      width: 18,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    },
  },
];

const styleById = {};
for (let i = 0, len = emoticonConfig.length; i < len; i++) {
  const style = emoticonConfig[i];
  styleById[style.packId] = style;
}

function getStyleCount() {
  return emoticonConfig.length;
}

function getAllStyles() {
  return emoticonConfig;
}

function getStyleById(packId: string) {
  return styleById[packId];
}

function getEmoticonUrl(unicode: number, styleManifest: StyleManifest, tone: number) {
  // When I benchmarked string ops in the day, [].join() was literal orders of
  // magnitude faster than concatenation (the computer would visibly freeze
  // when concatenating many strings, but stay fluid with .join()). I see talk
  // that things have since been optimized for the reverse.
  // TODO: Test both methods on a few thousand emoticons loading all at once.
  const cacheKey = [ styleManifest.packId, unicode, tone ].join('-');
  if (emoticonPathCache[cacheKey]) {
    return emoticonPathCache[cacheKey];
  }

  // Some emoticon pack files are upper case, some lower case. The pack
  // manifest tells us which.
  const caseFn = styleManifest.lowerCase ? 'toLowerCase' : 'toUpperCase';

  // Implement user tone preference if the emoticon supports it.
  let emoticonSuffix: string;
  if (tone && styleManifest.toneSupport.get(unicode)) {
    emoticonSuffix =
      styleManifest.tonePrefix + tone.toString(16)[caseFn]();
  }
  else {
    emoticonSuffix = '';
  }

  const path = [
    EMOTION_BASE, styleManifest.dir, '/', styleManifest.filePrefix || '',
    unicode.toString(16)[caseFn](), emoticonSuffix, '.webp',
  ].join('');

  emoticonPathCache[cacheKey] = path;
  return path;
}

export {
  getStyleCount,
  getAllStyles,
  getStyleById,
  getEmoticonUrl,
};
