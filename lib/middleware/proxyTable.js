var ProxyTable = require('http-proxy').ProxyTable
  , inherits = require('util').inherits


module.exports = ProxyTableRouter
ProxyTableRouter.ProxyTableRouter = ProxyTableRouter

function ProxyTableRouter(options) {
  if (!(this instanceof ProxyTableRouter)) return new ProxyTableRouter(options)

  if (typeof options === 'string')
    options = { router: options }

  ProxyTable.call(this, options)
}
inherits(ProxyTableRouter, ProxyTable)

ProxyTableRouter.prototype.getProxyLocation = function(target, req) {
  return ProxyTable.prototype.getProxyLocation.call(this, req)
}
