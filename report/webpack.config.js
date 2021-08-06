const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname + '/src/index.tsx'),
  devtool: 'eval-cheap-source-map',
  output: {
    path: path.resolve(process.cwd() + '/coverage/dist'),
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      '@coverage': path.resolve(process.cwd(), 'coverage/'),
      '@app': path.resolve(__dirname, 'src/app/')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json'],
    modules: [
      'node_modules',
      ...module.paths,
    ]
  },
  resolveLoader: {
    modules: module.paths,
  },
  devServer: {
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + '/src/index.html'
    }),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: `${process.cwd()}/coverage/screenshots`, to: `coverage/screenshots` },
        { from: `${process.cwd()}/coverage/results.json`, to: `coverage/results.json` }
      ],
    }),
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      }
    ]
  }
}
