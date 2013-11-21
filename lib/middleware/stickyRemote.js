var LRUCache = require('lru-cache')
  , getKey = require('../utils').getKey

module.exports = StickyRemote

function StickyRemote(options) {
  options = options || {}
  this.cache = new LRUCache({ max: options.max || 1000 })
}

StickyRemote.prototype._getKey = function (req) {
  return [ req.remoteAddress, req.headers.host ].join('@')
}

StickyRemote.prototype.reduce = function (req, targets) {
  var targetStr = this.cache.get( this._getKey(req) )
  if (!targetStr) return

  for (var i = 0; i < targets.length; i++) {
    if (getKey(targets[i]) === targetStr) {
      return [ targets[i] ]
    }
  }
}

StickyRemote.prototype.attach = function (sepro) {
  var self = this
  function save(req, target) {
    self.cache.set(self._getKey(req), getKey(target))
  }
  sepro.on('start', function (req, res, target) {
    save(req, target)
  })
  sepro.on('websocket:start', function (req, socket, head, target) {
    save(req, target)
  })
}
