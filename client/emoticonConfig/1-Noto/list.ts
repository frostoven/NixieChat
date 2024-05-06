import { name } from '../name';

const notoList: number[] = [
  name.thumbsUp,
  name.thumbsDown,
  name.faceSlightlySmiling,
  name.faceSmilingTear,
  name.faceLoudlyCrying,
  name.faceWithPleadingEyes,
  name.faceThinking,
  name.faceTearsOfJoy,
  name.faceSweatSmile,
  name.faceNeutral,
  name.faceExpressionless,
  name.faceConfused,
  name.faceSlightlyFrowning,
  name.faceGrimacing,
  name.foldedHands,
  name.catFace,
  name.heart,
  name.brokenHeart,
  name.pistol,
  name.aubergine,
  name.peach,
];

const notoToneSupport: Map<number, boolean> = new Map();
notoToneSupport.set(name.thumbsUp, true);
notoToneSupport.set(name.thumbsDown, true);
notoToneSupport.set(name.foldedHands, true);

export {
  notoList,
  notoToneSupport,
}
