var cookie = require('cookie')
  , crc32 = require('buffer-crc32')
  , getKey = require('../utils').getKey
  , LRUCache = require('lru-cache')

module.exports = StickyCookie

function StickyCookie(options) {
  options = options || {}
  this.cache = new LRUCache({ max: options.max || 1000 })
  this.cookieName = options.cookieName || 'sepro'
}

StickyCookie.prototype.reduce = function (req, targets) {
  req._seproStickyCookieReduce = true

  var cookies = {}

  if (req.cookies) {
    cookies = req.cookies
  } else if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie)
  }

  var targetStr = this.cache.get( cookies[this.cookieName] )
  if (!targetStr) return

  for (var i = 0; i < targets.length; i++) {
    if (getKey(targets[i]) === targetStr) {
      return [ targets[i] ]
    }
  }
}

StickyCookie.prototype.attach = function (sepro) {
  var self = this

  sepro.on('start', function (req, res, target) {
    if (!req._seproStickyCookieReduce) return

    var targetStr = getKey(target)
      , value = crc32.signed(targetStr)

    self.cache.set(value, targetStr)

    res.setHeader('Set-Cookie', cookie.serialize( self.cookieName
                                                , value
                                                , { path: '/', httpOnly: true }
                                                ))
  })

  sepro.on('websocket:start', function (req, socket, head, target) {
    if (!req._seproStickyCookieReduce) return

    var targetStr = getKey(target)
    self.cache.set( crc32.signed(targetStr)
                  , targetStr
                  )
  })
}
