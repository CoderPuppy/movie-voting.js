const fs = require('fs')

fs.readdirSync(__dirname).map(function(name) {
	return name.replace(/\.js$/, '')
}).forEach(function(name) {
	Object.defineProperty(exports, name, {
		value: require('./' + name),
		writable: false,
		enumerable: true
	})
})