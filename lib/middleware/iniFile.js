var WatchRouter = require('../watcher')
  , inherits = require('util').inherits
  , fs = require('fs')
  , ini = require('ini')


module.exports = IniFile

function IniFile(options) {
  if (!(this instanceof IniFile)) return new IniFile(options)

  if (typeof options === 'string') options = { file: options }

  options = options || {}
  WatchRouter.call(this, options)

  var self = this
    , filename = options.file
    , defaultHost = options.defaultHost || '127.0.0.1'

  self.watch(filename)

  self.on('change', update)
  update()

  function readFileCB(err, content, cb) {
    if (err) return cb(err)
    cb(null, ini.parse(content))
  }

  function update(cb) {
    fs.readFile(filename, 'utf8', function (err, file) {
      if (err) return self.emit('error', err)

      try {
        file = ini.parse(file)
      } catch (err) {
        self.emit('error', err)
      }

      self.routes = {}

      Object.keys(file).forEach(function (domain) {
        var target = file[domain].split(':')
          , host
          , port

        if (target.length == 1) {
          host = defaultHost
          port = target[0]
        } else {
          host = target[0]
          port = target[1]
        }

        port = parseInt(port, 10)

        self.routes[domain] = { host: host, port: port }
      })
    })
  }
}

inherits(IniFile, WatchRouter)
