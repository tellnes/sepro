
exports.getKey = function (options) {
  if (!options || (!options.host || !options.port)) {
    throw new Error('options.host and options.port are required.')
  }
  return [ options.host , options.port ].join(':')
}
