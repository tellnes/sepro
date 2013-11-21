var fs = require('fs')
  , path = require('path')
  , Sepro = require('./sepro')


exports = module.exports = Sepro
exports.Sepro = Sepro

fs.readdirSync(__dirname + '/middleware').forEach(function(filename) {
  if (!/\.js$/.test(filename)) return

  var desc = {
    get: function() {
      var klass = require('./middleware/' + filename)
      return function (options) {
        return new klass(options)
      }
    }
  }

  Object.defineProperty(exports, path.basename(filename, '.js'), desc)
})
