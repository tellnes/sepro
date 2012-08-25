var http = require('http')
  , debug = require('debug')('sepro:dispatcher')


var env = process.env.NODE_ENV || 'development'

var proto = exports


proto.listen = function() {
  var app = this
    , server

  if (arguments[0] instanceof http.Server) {
    server = arguments[0]
  } else {
    server = http.createServer()
    server.listen.apply(server, arguments)
  }

  server.on('request', app)

  server.on('upgrade', function(req, socket, head) {
    app.handle(req, head, function() {
      socket.destroy()
    })
  })

  return server
}

proto.use = function(layer) {

  // wrap vanilla http.Servers
  if (layer instanceof http.Server) {
    layer = { handle: layer.listeners('request')[0]
            , handleUpgrade: layer.listeners('upgrade')[0]
            }
  }

  // wrap vanilla middleware
  if (!layer.handle && typeof layer == 'function') {
    var fn = layer
    layer = { handle: fn
            , upgradeHandle: fn.upgradeHandle
            }
  }

  debug('use %s', layer.constructor != Object ? layer.constructor.name : null || layer.handle.name || layer.upgradeHandle || layer.name || 'anonymous')
  this.stack.push(layer)

  if (layer.close) {
    this.on('close', function() {
      layer.close()
    })
  }

  return this
}

// Slightly modified version of connect´s handle
/**
 * Handle server requests, punting them down
 * the middleware stack.
 *
 * @api private
 */

proto.handle = function(req, res, out) {
  var stack = this.stack
    , index = 0

  function next(err) {
    var layer = stack[index++]

    if (!layer) {
      if (out) return out(err)

      if (req.upgrade) {
        req.socket.destroy()
        return
      }

      if (err) {
        // default to 500
        if (res.statusCode < 400) res.statusCode = 500
        debug('default %s', res.statusCode)

        // production gets a basic error message
        var msg = 'production' == env
          ? http.STATUS_CODES[res.statusCode]
          : err.stack || err.toString()

        // log to stderr in a non-test env
        if ('test' != env) console.error(err.stack || err.toString())
        if (res.headerSent) return req.socket.destroy()
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', Buffer.byteLength(msg))
        if ('HEAD' == req.method) return res.end()
        res.end(msg)
      } else {
        debug('default 404')
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain')
        if ('HEAD' == req.method) return res.end()
        res.end('Cannot ' + req.method + ' ' + req.url)
      }
      return

    }

    var fnName = req.upgrade ? 'handleUpgrade' : 'handle'

    if (!layer[fnName]) {
      next()
      return
    }

    debug('%s', layer.constructor != Object ? layer.constructor.name : null || layer[fnName].name || layer.name || 'anonymous')

    var arity = layer[fnName].length
    if (err) {
      if (arity === 4) {
        layer[fnName](err, req, res, next)
      } else {
        next(err)
      }
    } else if (arity < 4) {
      layer[fnName](req, res, next)
    } else {
      next()
    }
  }

  next()
}

proto.close = function() {
  this.emit('close')
}
