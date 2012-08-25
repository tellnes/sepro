var Cookies = require('cookies')

module.exports = function(options) {

  options = options || {}

  var name = options.name || 'sepro'
    , host = options.host

  return function stickyCookie(req, res, next) {
    var cookies = new Cookies(req, res)

    req.sticky = cookies.get('name')

    if (!host) {
      req.sticky = host + ':' + req.sticky
    }

    req.on('proxy', function(location) {
      var value = ''
      if (!host) value = location.host + ':'
      value += location.port

      cookies.set(name, value)
    })

    next()
  }
}
