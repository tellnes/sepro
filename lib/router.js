
var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , semver = require('semver')


module.exports = Router

function Router(options) {
  options = options || {}
  EventEmitter.call(this)

  this.routes = {}
  this.serverName = options.serverName || null
}
inherits(Router, EventEmitter)


Router.prototype.getProxyLocation = function (target) {
  return this.routes[target]
}

Router.prototype.getServerNames = function(options) {
  var names = []

  if (options.serverName) names.push(options.serverName)

  if (options.serverAliases) {
    options.serverAliases.forEach(function(alias) {
      names.push(alias)
    })
  }

  if (options.domain) names.push(options.domain)

  if (options.domains) {
    options.domains.forEach(function(domain) {
      names.push(domain)
    })
  }

  if (this.serverName && options.name) {
    names.push([options.name, this.serverName].join('.'))
    if (options.version && semver.valid(options.version)) {
      names.push([options.version, options.name, this.serverName].join('.'))
    }
  }

  return names
}
