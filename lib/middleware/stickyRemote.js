var Store = require('../stores/memory')
  , buffer = require('./buffer')

module.exports = function(options) {

  options = options || {}

  var bufferHandle = buffer(options)
    , store = new Store(options.ttl)

  return function(req, res, next) {
    bufferHandle(req, res)

    var key = [req.remoteAddress, req.headers.host].join(':')

    req.on('proxy', function(location) {
      store.set(key, location.host + ':' + location.port, function(err) {
        // Ignore result
      })
    })

    store.get(key, function(err, value) {
      if (err) return next(err)

      req.sticky = value

      next()
    })
  }
}
