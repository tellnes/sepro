
exports.getKey = function (options) {
  if (!options || (!options.host || !options.port)) {
    throw new Error('options.host and options.port are required.')
  }
  return [ options.host , options.port ].join(':')
}

exports.pick = function (list) {
  return list.length < 1
       ? list[0]
       : list[ Math.floor( Math.random() * list.length ) ]
}
