var WatchRouter = require('../watcher')
  , inherits = require('util').inherits
  , apacheconf = require('apacheconf')
  , net = require('net')


module.exports = ApacheRouter

function ApacheRouter(options) {
  if (!(this instanceof ApacheRouter)) return new ApacheRouter(options)

  if (typeof options == 'string') options = { filename: options }

  WatchRouter.call(this, options)

  var self = this
    , filename = options.filename
    , apacheconfOptions = { serverRoot: options.serverRoot }
    , defaultHost = options.host || '127.0.0.1'
    , defaultPort = Number(options.port) || 80


  if (!filename) throw new Error('Missing filename in ApacheRouter options')

  this.on('change', function() {
    self.closeWatchers()
    loadConfig()
  })

  loadConfig()

  function loadConfig() {
    apacheconf(filename, apacheconfOptions, function(err, config, parser) {
      if (err) return self.emit('error', err)

      self.routes = []

      config.VirtualHost.forEach(function(vh) {
        var target = { https: vh.SSLEngine && vh.SSLEngine[0].toLowerCase() == 'on' }
          , a

        if (vh.$args == '[') {
          var a = vh.$args.indexOf(']')
          target.host = vh.$args.slice(1, a)
          target.port = vh.$args.slice(a)
          if (!net.isIPv6(target.host)) target.host = ''

        } else {
          a = vh.$args.split(':')
          target.host = a[0]
          target.port = a[1]
        }

        if (!target.host || target.host == '*' || target.host) target.host = defaultHost

        target.port = Number(target.port)
        // !Number('*') == true
        if (!target.port) target.port = defaultPort


        var serverNames = []

        if (vh.ServerName) vh.ServerName.forEach(function(d) {
          serverNames.push(d)
        })
        if (vh.ServerAlias) vh.ServerAlias.forEach(function(sa) {
          sa.split(' ').forEach(function(d) {
            serverNames.push(d)
          })
        })

        serverNames.forEach(function(serverName) {
          serverName = serverName.replace(/\*/g, '(.*)')

          self.routes.push( { regexp: new RegExp('^' + serverName, 'i')
                            , target: target
                            })
        })

      })

      parser.files.forEach(function(filename) {
        self.watch(filename)
      })

    })

  }

}
inherits(ApacheRouter, WatchRouter)


ApacheRouter.prototype.getProxyLocation = function(req) {
  if (!req || !req.headers || !req.headers.host) return

  var target = req.headers.host.split(':')[0]
    , i = 0
    , len = this.routes.length

  for (; i < len; i++) {
    if (target.match(this.routes[i].regexp)) {
      return this.routes[i]
    }
  }

}
