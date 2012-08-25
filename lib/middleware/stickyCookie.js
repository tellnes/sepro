var Cookies = require('cookies')
  , net = require('net')

function defaultEncode(options) {
  var host
    , type

  if (net.isIPv4(options.host)) {
    host = options.host.split('.').map(Number)

    type = 0

  } else if (net.isIPv6(options.host)) {
    host = options.host.split('.').map(function(n) {
      return parseInt(n, 16)
    })

    type = 1

  } else {
    host = new Buffer(options.host)
    type = 2
  }

  var buf = new Buffer(1 + 2 + host.length)

  buf[0] = type
  buf.writeUInt16LE(options.port, 1)

  for(var i = 0, len = host.length; i < len; i++) {
    buf[i + 3] = host[i]
  }

  return buf.toString('hex')
}

function defaultDecode(str) {
  if (!str) return

  try {
    var buf = new Buffer(str, 'hex')
  } catch(err) {
    return
  }

  var type = str[0]
    , host
    , port

  port = buf.readUInt16LE(1)

  if (type == 0) {
    host = [buf[3], buf[4], buf[5], buf[6]].join('.')

  } else if (type == 1) {
    host = Array.prototype.join.call(buf.slice(3), ':')

  } else if (type == 2) {
    host = buf.toString('utf8', 3)
  }

  return { host: host, port: port }
}

module.exports = function(options) {

  options = options || {}

  var name = options.name || 'sepro'
    , encode = options.encode || defaultEncode
    , decode = options.decode || defaultDecode

  return function stickyCookie(req, res, next) {
    var cookies = new Cookies(req, res)

    req.sticky = decode(cookies.get(name))

    req.on('proxy', function(location) {
      cookies.set(name, encode(location))
    })

    next()
  }
}
