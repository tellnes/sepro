var Router = require('../router')
  , inherits = require('util').inherits


module.exports = ProxyTableRouter
ProxyTableRouter.ProxyTableRouter = ProxyTableRouter

function ProxyTableRouter(options) {
  if (!(this instanceof ProxyTableRouter)) return new ProxyTableRouter(options)

  if (typeof options == 'string')
    options = { router: options }

  Router.call(this, options)
}
inherits(ProxyTableRouter, Router)

ProxyTableRouter.prototype.getProxyLocation = function(req) {
  return this.proxyTable.getProxyLocation(req)
}
