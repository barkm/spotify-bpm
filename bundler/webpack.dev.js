const { merge } = require("webpack-merge");
const path = require("path");
const commonWebpackConfiguration = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(commonWebpackConfiguration, {
  mode: "development",
  devServer: {
    host: "0.0.0.0",
    open: true,
    static: path.join(__dirname, "dist"),
    https: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      REDIRECT_URI: JSON.stringify("https://0.0.0.0:8080/"),
    }),
  ],
});
