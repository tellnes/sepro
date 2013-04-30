var cookie = require('cookie')
  , crc32 = require('buffer-crc32')
  , inherits = require('util').inherits
  , Sticky = require('../sticky')

module.exports = StickyCookie

function StickyCookie(options) {
  options = options || {}
  Sticky.call(this, options)
  this.cookieName = options.cookieName || 'sepro'
}
inherits(StickyCookie, Sticky)

StickyCookie.prototype._getKey = function (req) {
  var cookies = {}

  if (req.cookies) {
    cookies = req.cookies
  } else if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie)
  }

  return cookies[this.cookieName]
}

StickyCookie.prototype._createKey = function (target) {
  var key = crc32.signed(target)
  req.res.setHeader('Set-Cookie', cookie.serialize( this.cookieName
                                                  , key
                                                  , { path: '/', httpOnly: true }
                                                  ))
  return key
}
