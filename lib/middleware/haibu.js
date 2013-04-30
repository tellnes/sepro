var Router = require('../router')
  , inherits = require('util').inherits
  , request = require('request')
  , semver = require('semver')


module.exports = HaibuRouter
HaibuRouter.HaibuRouter = HaibuRouter

function HaibuRouter(options) {
  if (!(this instanceof HaibuRouter)) return new HaibuRouter(options)

  options = options || {}
  Router.call(this, options)

  var authToken = options.authToken || null
    , endpoint = options.endpoint
    , interval = (options.interval || 60) * 1000
    , self = this


  if (!endpoint) throw new Error('Haibu endpoint must be an valid url')
  if (/\/$/.test(endpoint)) endpoint = endpoint.slice(0, endpoint.length-1)

  function update() {
    request(endpoint + '/drones/'
            , { json: true
              , headers: { 'x-auth-token': authToken }
              }
            ,
      function(err, res, body) {
        if (!err && res.statusCode != 200) {
          if (body && body.message) {
            err = new Error(body.message)
          } else {
            err = new Error('Failed load haibu drones')
          }

          err.statusCode = res.statusCode
          err.name = 'HaibuRequestError'
        }

        if (err) return self.emit('error', err)

        self.routes = {}

        Object.keys(body.drones).forEach(function(name) {
          var names = self.getServerNames(body.drones[name].app)
            , nodes

          nodes = body.drones[name].drones.map(function (node) {
            return  { host: node.host
                    , port: node.port
                    }
          })

          if (!names.length || !nodes.length) return

          names.forEach(function(name) {
            self.routes[name] = nodes
          })

        })

        self._timeout = setTimeout(update, interval)
      }
    )
  }
  update()
}

inherits(HaibuRouter, Router)

HaibuRouter.prototype.close = function() {
  clearTimeout(this._timeout)

  HaibuRouter.super_.prototype.close.call(this)
}
