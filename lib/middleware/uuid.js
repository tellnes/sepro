
module.exports = function(options) {
  if (typeof options == 'function') options = { generator: options }

  options = options || {}

  if (!options.generator)
    throw new Error('uuid middleware require options.generator')

  var generator = options.generator
    , response = options.response !== false ? typeof options.response == 'string' ? options.response : 'x-sepro-id' : false
    , forward = options.forward !== false ? typeof options.forward == 'string' ? options.forward : 'x-sepro-id' : false

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

  uuid.hamdle = uuid
  uuid.handleUpgrade = uuid

  return uuid
}
