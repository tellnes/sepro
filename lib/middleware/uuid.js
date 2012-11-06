
module.exports = function(options) {
  if (typeof options == 'function') options = { generator: options }

  options = options || {}

  if (!options.generator)
    throw new Error('uuid middleware require options.generator')

  var generator = options.generator
    , response = options.response === false ? false : (typeof options.response == 'string' ? options.response : null) || options.name || 'x-sepro-id'
    , forward = options.forward === false ? false : (typeof options.forward == 'string' ? options.forward : null) || options.name || 'x-sepro-id'

  function uuid(req, res, next) {
    req.uuid = generator()

    if (response && !req.upgrade) {
      res.setHeader(response, req.uuid)
    }

    if (forward) {
      req.headers[forward] = req.uuid
    }

    next()
  }

  uuid.handle = uuid
  uuid.handleUpgrade = uuid

  return uuid
}
