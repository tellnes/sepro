var LRUCache = require('lru-cache')
  , getKey = require('./utils').getKey

module.exports = Sticky

function Sticky(options) {
  options = options || {}
  this.cache = new LRUCache({ max: options.max || 1000 })
}

Sticky.prototype.reduce = function (req, targets) {
  var key = this._getKey(req)
    , targetStr = this.cache.get(key)

  if (!targetStr) return

  for (var i = 0; i < targets.length; i++) {
    if (getKey(targets[i]) === targetStr) {
      return targets[i]
    }
  }
}

Sticky.prototype.attach = function (sepro) {
  var self = this
  function save(req, target) {
    var targetStr = getKey(loc)
    if (self._createKey) key = self._createKey(targetStr)
    self.cache.set(self._getKey(req), targetStr)
  }
  sepro.on('start', function (req, res, target) {
    save(req, target)
  })
  sepro.on('websocket:start', function (req, socket, head, target) {
    save(req, target)
  })
}
