# is-plask

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Check if we are running inside Plask environment (http://plask.org)

## Usage

[![NPM](https://nodei.co/npm/is-plask.png)](https://www.npmjs.com/package/is-plask)

```
var plask = require('plask-wrap')
var isPlask = require('is-plask')

if (isPlask) {
   var canvas = plask.SkCanvas.create(1280, 720)
}
```

## License

MIT, see [LICENSE.md](http://github.com/vorg/is-plask/blob/master/LICENSE.md) for details.
