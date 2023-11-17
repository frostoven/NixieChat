const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const exec = require('child_process').exec;

module.exports = {
  watch: true,
  target: 'web',
  devtool: 'source-map',

  entry: {
    bundle: './client/index.js',
  },

  output: {
    path: __dirname + '/build',
    publicPath: 'build/',
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-nullish-coalescing-operator',
          ]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          loader: 'css-loader',
          options: {
            modules: true
          }
        })
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.json', '.jsx']
  },
};
