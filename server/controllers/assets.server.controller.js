import path from 'path';

const semanticUiPath = '../../node_modules/semantic-ui-css/';
const semanticUiForestPath = '../../node_modules/semantic-ui-forest-themes/';

// All the below is what the server sees.

function favicon(_, res) {
  res.sendFile(path.join(__dirname + '../../../client/assets/icons/favicon.ico'));
}

function app(_, res) {
  res.sendFile(path.join(__dirname + '../../../client/index.html'));
}

function bundleDir(req, res) {
  const fileName = req.params.fileName;
  res.sendFile(path.join(
    __dirname +
    '../../../client/.build/' +
    fileName,
  ));
}

function css(req, res) {
  res.sendFile(path.join(__dirname + '../../../client/assets/css/' + req.params.file));
}

function semanticCss(_, res) {
  res.sendFile(path.join(`${__dirname}/${semanticUiPath}/semantic.min.css`));
}

function customTheme(req, res) {
  const fileName = req.params.fileName;
  if (fileName.slice(-4) === '.css') {
    res.sendFile(path.join(`${__dirname}/${semanticUiForestPath}/semantic.darkly.css`));
  }
  else {
    res.json({ error: true, 'message': 'Theme file must be css.' });
  }
}

function getFont(req, res) {
  const fontName = req.params.fontName;
  // Commenting this out because I'm not so sure that we want font
  // inconsistencies.
  // let semanticPath = semanticUiPath;
  // if (fontName.includes('custom_theme')) {
  //   semanticPath = semanticUiForestPath;
  // }

  res.sendFile(path.join(
    __dirname +
    '../' +
    semanticUiPath +
    '/themes/default/assets/fonts/' +
    fontName,
  ));
}

function getBackground(req, res) {
  res.sendFile(path.join(
    __dirname +
    '../../../client/assets/backgrounds/' +
    req.params.fileName,
  ));
}

function getIcon(req, res) {
  res.sendFile(path.join(
    __dirname +
    '../../../client/assets/icons/' +
    req.params.fileName,
  ));
}

function getImage(req, res) {
  res.sendFile(path.join(
    __dirname +
    '../../../client/assets/img/' +
    req.params.fileName,
  ));
}

function getEmoticon(req, res) {
  res.sendFile(path.join(
    __dirname +
    `../../../client/assets/emo/${req.params.dirName}/` +
    req.params.fileName,
  ));
}

const controller = {
  favicon,
  app,
  bundleDir,
  css,
  semanticCss,
  customTheme,
  getFont,
  getBackground,
  getIcon,
  getImage,
  getEmoticon,
};

export default controller;
