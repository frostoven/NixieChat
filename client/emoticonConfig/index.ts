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

const emoticonConfig: StyleManifest[] = [
  {
    dir: '0-OpenMoji',
    availableEmoticons: openMojiList,
    toneSupport: openMojiToneSupport,
    size: 36,
    margin: 1,
  },
  {
    dir: '1-Noto',
    availableEmoticons: notoList,
    filePrefix: 'emoji_u',
    toneSupport: notoToneSupport,
    lowerCase: true,
    size: 24,
    margin: 4,
  },
  {
    dir: '2-Telegram',
    availableEmoticons: tgramList,
    lookupTable: tgramLookup,
    toneSupport: tgramToneSupport,
    size: 33,
    margin: 0,
  },
  {
    dir: '3-Misc',
    availableEmoticons: miscMojiList,
    toneSupport: miscMojiToneSupport,
    size: 36,
    margin: 0,
  },
];

function getStyleCount() {
  return emoticonConfig.length;
}

function getAllStyles() {
  return emoticonConfig;
}

export {
  getStyleCount,
  getAllStyles,
};
