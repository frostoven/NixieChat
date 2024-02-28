import { name } from '../name';

const notoList: number[] = [
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
  name.catFace,
  name.heart,
  name.brokenHeart,
  name.pistol,
  name.aubergine,
  name.peach,
];

const notoToneSupport: Map<number, boolean> = new Map();

export {
  notoList,
  notoToneSupport,
}
