var WatchRouter = require('../watcher')
  , inherits = require('util').inherits
  , fs = require('fs')
  , ini = require('ini')
  , track = require('track')


module.exports = CouchDBRouter
CouchDBRouter.CouchDBRouter = CouchDBRouter

function CouchDBRouter(options) {
  if (!(this instanceof CouchDBRouter)) return new CouchDBRouter(options)

  if (typeof options === 'string') options = { local: options }

  options = options || {}
  WatchRouter.call(this, options)

  var self = this

  self.watch(options.local)
  if (options.default) self.watch(options.default)
  self.on('change', update)

  update()

  function readFileCB(err, content, cb) {
    if (err) return cb(err)
    cb(null, ini.parse(content))
  }

  function update() {
    var t = track()

    if (options.default) {
      fs.readFile(options.default, 'utf8', t('default', readFileCB))
    }

    fs.readFile(options.local, 'utf8', t('local', readFileCB))

    t.end(function (err, tr) {
      if (err) return self.emit('error', err)

      var local = tr.local
        , def = tr.default || {}
        , location = { }

      location.port = options.port || local.httpd && local.httpd.port || def.httpd && def.httpd.port || 5984
      location.host = options.host || local.httpd && local.httpd.host || def.httpd && def.httpd.host || '127.0.0.1'

      self.routes = {}

      function iterator(domain) {
        self.routes[domain] = location
      }

      if (local.vhosts) {
        Object.keys(local.vhosts).forEach(iterator)
      }

      if (def.vhosts) {
        Object.keys(def.vhosts).forEach(iterator)
      }

      if (options.domain) {
        iterator(options.domain)
      }

      if (options.domains) {
        options.domains.forEach(iterator)
      }

    })
  }
}

inherits(CouchDBRouter, WatchRouter)
