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
  ports.on('free', function(service) {
    self.remove(service)

    var key = getKey(service)

    self.getServerNames(service).forEach(function(serverName) {
      if (!self.routes[serverName]) return

      self.routes[serverName] = self.routes[serverName].filter(function(node) {
        return (getKey(node) != key)
      })
    })
  })

  function register(service) {
    self.getServerNames(service).forEach(function(serverName) {
      if (!self.routes[serverName]) self.routes[serverName] = []
      self.routes[serverName].push(service)
    })
  }

  ports.on('register', register)

  ports.query().forEach(register)
}
inherits(SeaportRouter, Router)

SeaportRouter.prototype.getServerNames = function(options) {
  var names = SeaportRouter.super_.prototype.getServerNames.call(this, options)

  if (this.serverName) {
    names.push([options.role, this.serverName].join('.'))
    if (options.version && semver.valid(options.version)) names.push([options.version, options.role, this.serverName].join('.'))
  }

  return names
}
