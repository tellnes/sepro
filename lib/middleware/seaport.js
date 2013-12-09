var Router = require('../router')
  , inherits = require('util').inherits
  , semver = require('semver')
  , getKey = require('../utils').getKey

module.exports = SeaportRouter
SeaportRouter.SeaportRouter = SeaportRouter

function SeaportRouter(options) {
  if (!(this instanceof SeaportRouter)) return new SeaportRouter(options)

  options = options || {}
  Router.call(this, options)

  var ports = options.ports
    , self = this

  if (!ports) throw new Error('Missing seaport connection (options.ports) in SeaportRouter options')

  // Setup seaport

  function register(service) {
    self.getServerNames(service).forEach(function(serverName) {
      if (!self.routes[serverName]) self.routes[serverName] = []
      self.routes[serverName].push(service)
    })
  }

  ports.on('register', register)
  ports.on('reclaim', register)

  ports.on('free', this.free.bind(this))
  ports.on('stale', this.free.bind(this))

  ports.query().forEach(register)
}
inherits(SeaportRouter, Router)

SeaportRouter.prototype.getServerNames = function(options) {
  var names = Router.prototype.getServerNames.call(this, options)

  if (this.serverName) {
    names.push([options.role, this.serverName].join('.'))
    if (options.version && semver.valid(options.version)) {
      names.push([options.version, options.role, this.serverName].join('.'))
    }
  }

  return names
}

SeaportRouter.prototype.attach = function (sepro) {
  this.on('free', function (service) {
    sepro.remove(service)
  })
}

SeaportRouter.prototype.free = function (service) {
  var key = getKey(service)
    , self = this

  self.emit('free', service)

  self.getServerNames(service).forEach(function (serverName) {
    if (!self.routes[serverName]) return

    self.routes[serverName] = self.routes[serverName].filter(function (node) {
      return (getKey(node) !== key)
    })

    if (!self.routes[serverName].length) {
      delete self.routes[serverName]
    }
  })
}

SeaportRouter.prototype.getProxyLocation = function (target) {
  var services = this.routes[target]

  if (services && services.length > 1) {
    services = services.filter(function (service) {
      if (service.type !== 'service') {
        this.free(service)
        return false
      }
      return true
    }, this)
  }

  return services
}
