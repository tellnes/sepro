var fs = require('fs')
  , path = require('path')
  , hp = require('http-proxy')
  , Router = require('./router')
  , proto = require('./proto')
  , EventEmitter = require('events').EventEmitter

function merge(dest, src) {
  Object.keys(src).forEach(function(key) {
    dest[key] = src[key]
  })
}

function createServer() {
  var app = function(req, res) { app.handle(req, res) }

  merge(app, proto)

  merge(app, EventEmitter.prototype)
  EventEmitter.call(app)

  app.stack = []

  return app
}

module.exports = exports = createServer

exports.proto = proto
exports.Router = Router

exports.HttpProxy = hp.HttpProxy
exports.ProxyTable = hp.ProxyTable
exports.RoutingProxy = hp.RoutingProxy

exports.middleware = {}


fs.readdirSync(__dirname + '/middleware').forEach(function(filename) {
  if (!/\.js$/.test(filename)) return

  var desc = {
    get: function() {
      return require('./middleware/' + filename)
    }
  }

  Object.defineProperty(exports, path.basename(filename, '.js'), desc)
  Object.defineProperty(exports.middleware, path.basename(filename, '.js'), desc)
})
