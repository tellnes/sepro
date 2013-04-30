
var RoutingProxy = require('http-proxy').RoutingProxy
  , inherits = require('util').inherits
  , semver = require('semver')
  , debug = require('debug')('sepro:router')


module.exports = Router

function Router(options) {
  options = options || {}

  this.routes = {}
  this.serverName = options.serverName || null
  this.upgrade = options.upgrade !== false

  RoutingProxy.call(this, options)

  var deadTTL = options.deadTTL = (options.deadTTL || 10) * 1000
    , maxRetries = options.maxRetries || 3

  this.on('proxyError', function(err, req, res) {
    if ( err.code === 'ECONNREFUSED'
      || err.code === 'ETIMEDOUT'
      || req.error !== undefined
    ) {
      req.location.dead = true
      setTimeout(function() {
        req.location.dead = false
      }, deadTTL)
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
inherits(Router, RoutingProxy)

Router.prototype.handleUpgrade =
Router.prototype.handle = function(req, resOrHead, next) {
  if (req.upgrade && !this.upgrade) return next()

  var location = this.getProxyLocation(req)

  if (Array.isArray(location)) {
    var index = -1

    if (location.length > 1) {
      if (req.sticky) {

        var sticky = this._getKey(req.sticky)
          , i = 0
          , len = location.length

        for(; i < len; i++) {
          if (!location[i].dead && this._getKey(location[i]) == sticky) {
            index = i
            break
          }
        }
      }

      if (index == -1) {

        var indexes = Object.keys(location)
          , i
          , loc

        while(index == -1 && indexes.length) {
          i = Math.floor(Math.random() * indexes.length)
          loc = location[indexes[i]]

          if (loc && loc.dead) {
            indexes.splice(i, 1)
          } else {
            index = indexes[i]
          }
        }
      }

    } else {
      index = 0
    }

    location = location[index]
  }

  if (!location) return next()

  if (location.dead) {
    res.statusCode = 503
    return next(new Error('Backend is dead'))
  }

  if (!location.target) location = { target: location }

  req.location = location
  req.next = next

  if (req.upgrade) {
    debug('proxy upgrade for %s to %s:%s', req.headers.host, location.target.host, location.target.port)
    this.proxyWebSocketRequest(req, req.socket, resOrHead, location)

  } else {
    debug('proxy request for %s to %s:%s', req.headers.host, location.target.host, location.target.port)
    this.proxyRequest(req, resOrHead, location)
  }

  req.emit('proxy', location)
}

Router.prototype.getProxyLocation = function(req) {
  if (!req || !req.headers || !req.headers.host) return null

  var target = req.headers.host.split(':')[0]
  return this.routes[target]
}

Router.prototype.getServerNames = function(options) {
  var names = []

  if (options.serverName) names.push(options.serverName)

  if (options.serverAliases) options.serverAliases.forEach(function(alias) {
    names.push(alias)
  })

  if (options.domain) names.push(options.domain)

  if (options.domains) options.domains.forEach(function(domain) {
    names.push(domain)
  })

  if (this.serverName && options.name) {
    names.push([options.name, this.serverName].join('.'))
    if (options.version && semver.valid(options.version)) names.push([options.version, options.name, this.serverName].join('.'))
  }

  return names
}
