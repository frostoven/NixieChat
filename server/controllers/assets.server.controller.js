const path = require('path');

const config = require('../config/server');

const semanticUiPath = '../../node_modules/semantic-ui-css/';
const semanticUiForestPath = '../../node_modules/semantic-ui-forest-themes/';

// All the below is what the server sees.

exports.favicon = (req, res) => {
  res.sendFile(path.join(__dirname + '../../../client/assets/icons/favicon.ico'));
};

exports.app = (req, res) => {
  res.sendFile(path.join(__dirname + '../../../client/index.html'));
};

exports.bundleDir = (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.join(
    __dirname +
    '../../../client/.build/' +
    fileName,
  ));
};

exports.css = (req, res) => {
  res.sendFile(path.join(__dirname + '../../../client/assets/css/' + req.params.file));
};

exports.semanticCss = (req, res) => {
  res.sendFile(path.join(`${__dirname}/${semanticUiPath}/semantic.min.css`));
};

exports.customTheme = (req, res) => {
  const fileName = req.params.fileName;
  if (fileName.slice(-4) === '.css') {
    res.sendFile(path.join(`${__dirname}/${semanticUiForestPath}/semantic.darkly.css`));
  }
  else {
    res.json({ error: true, 'message': 'Theme file must be css.' });
  }
};

exports.getFont = (req, res) => {
  const fontName = req.params.fontName;
  let semanticPath = semanticUiPath;
  if (fontName.includes('custom_theme')) {
    semanticPath = semanticUiForestPath;
  }

  res.sendFile(path.join(
    __dirname +
    '../' +
    semanticUiPath +
    '/themes/default/assets/fonts/' +
    fontName,
  ));
};

exports.getIcon = (req, res) => {
  res.sendFile(path.join(
    __dirname +
    '../../../assets/icons/' +
    req.params.fileName,
  ));
};

exports.getImage = (req, res) => {
  res.sendFile(path.join(
    __dirname +
    '../../../assets/img/' +
    req.params.fileName,
  ));
};

