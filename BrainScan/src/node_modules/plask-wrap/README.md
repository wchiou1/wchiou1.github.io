# plask-wrap

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Plask wrapper for browserify. 

It uses "browser" field in package.json to avoid requiring "plask" module in the browser 
and make using `-i plask` browserify unnecesary when bundling a pex app.

## Usage

[![NPM](https://nodei.co/npm/plask-wrap.png)](https://www.npmjs.com/package/plask-wrap)

It's recommended to use `is-plask` together with this module

```javascript
var plask = require('plask-wrap')
var isPlask = require('is-plask')

if (isPlask) {
  var canvas = plask.SkCanvas.create(1280, 720)
}
```

## License

MIT, see [LICENSE.md](http://github.com/vorg/plask-wrap/blob/master/LICENSE.md) for details.
