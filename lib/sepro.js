var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , pick = require('./utils').pick
  , getKey = require('./utils').getKey
  , HttpProxy = require('http-proxy').HttpProxy
  , LRUCache = require('lru-cache')
  , debug = require('debug')('sepro:dispatcher')

module.exports = Sepro

function Sepro(options) {
  options = options || {}
  EventEmitter.call(this)

  this.routers = []
  this.reducers = []

  this.proxies = new LRUCache({ max: options.maxProxies || 100 })
}
inherits(Sepro, EventEmitter)

Sepro.prototype.use = function (layer) {
  debug('use %s', layer.constructor && layer.constructor.name || layer.name || 'anonymous')

  if (layer.attach) {
    layer.attach(this)
  }

  if (layer.getProxyLocation) {
    this.routers.push(layer)
  }

  if (layer.reduce) {
    this.reducers.push(layer)
  }

  if (layer.close) {
    this.once('close', function () {
      layer.close()
    })
  }

  return this
}

Sepro.prototype.getProxyLocation = function (target, req) {
  var index
    , targets
    , layer
    , reduced

  if (typeof target === 'object' && target.headers) {
    req = target
    target = target.headers.host || ''
  }

  target = target.split(':')[0]

  index = 0
  while(layer = this.routers[index++]) {
    targets = layer.getProxyLocation(target, req)
    if (targets) break
  }

  if (!targets) return null
  if (!targets.length) return targets

  if (req) {
    index = 0
    while ((layer = this.reducers[index++]) && targets.length > 1) {
      reduced = layer.reduce(req, targets)
      if (reduced) targets = reduced
    }
  }

  return pick(targets) || null
}

Sepro.prototype.getProxy = function (target) {
  var key = getKey(target)
    , proxy = this.proxies.get(key)
    , options = { target: target }

  if (!proxy) {
    proxy = new HttpProxy(options)
    this.proxies.set(key, proxy)
  }

  return proxy
}

Sepro.prototype.handleRequest = function (req, res, next) {
  var target = this.getProxyLocation(req)

  if (!target) {
    if (next) return next()
    res.writeHead(404)
    res.end()
    return
  }

  this.getProxy(target).proxyRequest(req, res)
}

 // Connect compatibility
Sepro.prototype.handle = Sepro.prototype.handleRequest

Sepro.prototype.handleWebSocketRequest = function (req, socket, head, next) {
  var target = this.getProxyLocation(req)

  if (!target) {
    if (next) return next()
    socket.destroy()
    return
  }

  this.getProxy(target).proxyWebSocketRequest(req, socket, head)
}

Sepro.prototype.attach = function (server, options) {
  server.on('request', function (req, res) {
    self.handleRequest(req, res)
  })
  server.on('upgrade', function (req, socket, head) {
    self.handleWebSocketRequest(req, socket, head)
  })
}

Sepro.prototype.listen = function (port, options, cb) {
  if (typeof options == 'function') {
    cb = options
    options = {}
  }

  var server = http.createServer()

  this.attach(server, options)

  this.once('close', function () {
    try {
      server.close()
    } catch (err) {
      if (err.message !== 'Not running') this.emit('error', err)
    }
  })

  server.listen(port, cb)

  return server
}

Sepro.prototype.close = function() {
  this.emit('close')
}
