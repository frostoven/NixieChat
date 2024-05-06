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

export {
  getStyleCount,
  getAllStyles,
  getStyleById,
};
