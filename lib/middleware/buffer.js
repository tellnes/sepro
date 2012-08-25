var hp = require('http-proxy')

module.exports = function() {
  function buffer(req, res, next) {
    if (!req.buffer) {
      req.buffer = hp.buffer(req.upgrade ? req.socket : req)
      req.on('proxy', function() {
        req.buffer.resume()
        req.buffer = null
      })
    }

    if (next) next()
  }

  buffer.handle = buffer
  buffer.handleUpgrade = buffer
  return buffer
}
