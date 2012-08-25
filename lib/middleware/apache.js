var HttpProxy = require('http-proxy').HttpProxy
  , inherits = require('util').inherits
  , fs = require('fs')
  , apacheconf = require('apacheconf')
  , debug = require('debug')('sepro:apache')


module.exports = Apache

function Apache(options) {
  if (!(this instanceof Apache)) return new Apache(options)

  if (typeof options == 'string') options = { filename: options }

  options = options || {}

  if (!options.target) options.target = { host: options.host || '127.0.0.1'
                                        , port: options.port || 80
                                        }

  HttpProxy.call(this, options)

  this.routes = []


  var self = this
    , filename = options.filename
    , watch = options.watch ? typeof options.watch == 'object' ? options.watch : {} : false
    , maxRetries = options.maxRetries || 3
    , deadTTL = options.deadTTL = (options.deadTTL || 10) * 1000


  if (!filename) throw new Error('Missing filename in ApacheRouter options')

  loadConfig()

  function loadConfig() {
    apacheconf(filename, function(err, config, parser) {
      if (err) return self.emit('error', error)

      var serverNames = []

      config.VirtualHost.forEach(function(vh) {
        if (vh.ServerName) vh.ServerName.forEach(function(d) {
          serverNames.push(d)
        })
        if (vh.ServerAlias) vh.ServerAlias.forEach(function(sa) {
          sa.split(' ').forEach(function(d) {
            serverNames.push(d)
          })
        })
      })

      self.routes = serverNames.map(function(serverName) {
        serverName = serverName.replace(/\*/g, '(.*)')
        return new RegExp('^' + serverName, 'i')
      })

      if (watch) {
        self.watchers = []

        parser.files.forEach(function(filename) {
          var w = fs.watch(filename, watch, function() {
            self.closeWatchers()
            loadConfig()
          })
          self.watchers.push(w)
        })
      }

    })

  }

  this.on('proxyError', function(err, req, res) {
    if ( err.code === 'ECONNREFUSED'
      || err.code === 'ETIMEDOUT'
      || req.error !== undefined
    ) {

      self.isDead = true
      setTimeout(function() {
        self.isDead = false
      }, deadTTL)

      err.message = 'Apache is dead (' + JSON.stringify(err) + ')'
      res.statusCode = 503
      req.next(err)
      return
    }

    req.retries = req.retries ? req.retries + 1 : 1

    if (req.retries >= maxRetries) {
      res.statusCode = 502
      req.next(err)
      return
    }

    debug('Retrying request')
    this.handle(req, res, req.next)
  })

}
inherits(Apache, HttpProxy)

Apache.prototype.closeWatchers = function() {
  self.watchers.forEach(function(watcher) {
    watcher.close()
  })
}

Apache.prototype.close = function() {
  this.closeWatchers()
  Apache.super_.prototype.close.call(this)
}

Apache.prototype.handle = function(req, res, next) {
  if (!req || !req.headers || !req.headers.host) return next()

  var target = req.headers.host.split(':')[0]
    , match = false
    , i = 0
    , len = this.routes.length

  for (; i < len; i++) {
    if (target.match(this.routes[i])) {
      match = true
      break
    }
  }

  if (!match) return next()

  if (this.isDead) {
    res.statusCode = 503
    return next(new Error('Apache is marked as dead'))
  }

  req.next = next

  debug('proxy request for %s to apache', req.headers.host)
  this.proxyRequest(req, res)

  req.emit('proxy', this.target)
}
