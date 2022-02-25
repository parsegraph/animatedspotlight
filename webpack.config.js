const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  externals: {
    "parsegraph-checkglerror":{
      commonjs:"parsegraph-checkglerror",
      commonjs2:"parsegraph-checkglerror",
      amd:"parsegraph-checkglerror",
      root:"parsegraph"
    }
  },
  entry: {
    index: relDir("src/index.ts"),
    demo: relDir("src/demo.ts"),
  },
  ...webpackConfig(true),
};

