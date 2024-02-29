import { name } from '../name';

// TODO: add unit tests that check for duplicate entries.
const openMojiList: number[] = [
  name.thumbsUp,
  name.thumbsDown,
  name.faceSlightlySmiling,
  name.faceLoudlyCrying,
  name.faceTearsOfJoy,
  name.faceSweatSmile,
  name.faceSmilingTear,
  name.faceNeutral,
  name.faceSlightlyFrowning,
  name.faceWithMonocle,
  name.faceSalute,
  name.faceWithDiagonalMouth,
  name.faceGrimacing,
  name.heart,
  name.brokenHeart,
  name.pistol,
];

const openMojiToneSupport: Map<number, boolean> = new Map();
openMojiToneSupport.set(name.thumbsUp, true);
openMojiToneSupport.set(name.thumbsDown, true);
openMojiToneSupport.set(name.foldedHands, true);

export {
  openMojiList,
  openMojiToneSupport,
}
