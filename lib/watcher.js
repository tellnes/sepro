var Router = require('./router')
  , inherits = require('util').inherits
  , fs = require('fs')
  , debug = require('debug')('sepro:watcher')


module.exports = WatchRouter

function WatchRouter(options) {
  if (!(this instanceof WatchRouter)) return new WatchRouter(options)

  Router.call(this, options)

  this._watchOptions = options.watch ? typeof options.watch == 'object' ? options.watch : {} : false
  this._watchers = []
}

inherits(WatchRouter, Router)

WatchRouter.prototype.watch = function(filename) {
  if (!this._watchOptions) return

  debug('Start watching %s', filename)
  var self = this
  var w = fs.watch(filename, this._watchOptions, function() {
    debug('%s changed', filename)
    self.emit('change')
  })
  this._watchers.push(w)
}

WatchRouter.prototype.closeWatchers = function() {
  debug('Closing watchers')
  this._watchers.forEach(function(watcher) {
    watcher.close()
  })
  this._watchers.length = 0
}

WatchRouter.prototype.close = function() {
  this.closeWatchers()
}
