const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // Only bundle the popup UI
  entry: {
    popup: './src/popup/index.tsx',
    background: './public/background/index.ts',
    content: './public/content/index.ts'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
    clean: true
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    // Generate popup HTML and inject compiled popup script
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup']
    }),

    // Copy all static extension files from public/
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons' },
        { from: 'public/background', to: 'background' },
        { from: 'public/content', to: 'content' },
        { from: 'public/inpage.js', to: 'inpage.js' }
      ]
    })
  ],

  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'
};
