const { merge } = require("webpack-merge");
const commonWebpackConfiguration = require("./webpack.common.js");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");

module.exports = merge(commonWebpackConfiguration, {
  mode: "production",
  output: {
    filename: "bundle.[contenthash].js",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      REDIRECT_URI: JSON.stringify("https://barkm.github.io/spotify-bpm/"),
    }),
  ],
});
