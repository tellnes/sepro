module.exports = Memory

function Memory(ttl) {
  this.store = {}
  this.keys = []
  this.ttl = (ttl || 60) * 1000
}

Memory.prototype.touch = function(key) {
  if (!this.store[key]) return

  clearTimeout(this.store[key].timeout)

  var self = this

  this.store[key].timeout = setTimeout(function() {
    delete self.store[key]
  }, this.ttl)
}

Memory.prototype.remove = function(key, cb) {
  delete this.store[key]
  cb()
}

Memory.prototype.get = function(key, cb) {
  if (!this.store[key]) return cb()
  this.touch(key)
  cb(null, this.store[key].value)
}

Memory.prototype.set = function(key, value, cb) {
  this.store[key] = { value: value }
  this.touch(key)
  cb()
}
