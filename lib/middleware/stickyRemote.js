var Sticky = require('../sticky')
  , inherits = require('util').inherits

module.exports = StickyRemote

function StickyRemote(options) {
  Sticky.call(this, options)
}
inherits(StickyRemote, Sticky)

StickyRemote.prototype._getKey = function (req) {
  return [ req.remoteAddress, req.headers.host ].join('@')
}
