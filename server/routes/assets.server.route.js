import express from 'express';
import assetsController from '../controllers/assets.server.controller';

const router = express.Router();

// All the below is what the client sees; real paths will sometimes differ. See
// the associated controller file for true server-side paths.

router.get(
  '/',
  assetsController.app,
);

router.get(
  '/favicon.ico',
  assetsController.favicon,
);

router.get(
  '/build/:fileName',
  assetsController.bundleDir,
);

router.get(
  '/assets/css/:file',
  assetsController.css,
);

router.get(
  '/modules/semantic.min.css',
  assetsController.semanticCss,
);

router.get(
  '/modules/themes/default/assets/fonts/:fontName',
  assetsController.getFont,
);

router.get(
  '/custom_themes/themes/default/assets/fonts/:fontName',
  assetsController.getFont,
);

router.get(
  '/custom_themes/:fileName',
  assetsController.customTheme,
);

router.get(
  '/assets/backgrounds/:fileName',
  assetsController.getBackground,
);

router.get(
  '/assets/icons/:fileName',
  assetsController.getIcon,
);

router.get(
  '/assets/img/:fileName',
  assetsController.getImage,
);

router.get(
  '/assets/emo/:dirName/:fileName',
  assetsController.getEmoticon,
);

export default router;
