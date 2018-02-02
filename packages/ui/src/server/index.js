import express from 'express';
import Webpack from 'webpack';
import WebpackConfig from '../../webpack.config';
import WebpackDevMiddleware from 'webpack-dev-middleware';
import WebPackHotMiddleware from 'webpack-hot-middleware';

const PORT = 3000;
const app = new express();

// app.use('/dist', express.static(path.join(__dirname, '../dist')));

// create a webpack instance from our dev config
const webpackCompiler = Webpack(WebpackConfig);

// Use webpack dev middleware to bundle our universal on the fly and serve it
// on publicPath. Turn off verbose webpack output in our server console
// by setting noInfo: true
app.use(WebpackDevMiddleware(webpackCompiler, {
  publicPath: WebpackConfig.output.publicPath,
  noInfo: true,
}));

// instruct our webpack instance to use webpack hot middleware
app.use(WebPackHotMiddleware(webpackCompiler));

app.use((req, res) => {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to LD Scheduler</title>
  </head>
  <body>
    <div id="reactDiv" />
    <script type="application/javascript" src="/dist/main.js" defer></script>
  </body>    
</html>
  `;
  res.end(html);
});

app.listen(PORT, () => {
  console.log(`LD Scheduler listening at ${PORT}`);
});
