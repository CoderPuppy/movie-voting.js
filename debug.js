const debug = require('debug')

const debugFns = {}

function getDebug() {
	const nameParts = [].slice.call(arguments)
	const name = nameParts.join(':')
	if(debugFns[name]){
		return debugFns[name]
	} else {
		const debugFn = debug(name)
		debugFn.name = name
		debugFn.nameParts = nameParts
		if(nameParts.length > 1)
			debugFn.parent = getDebug.apply(null, nameParts.slice(0, nameParts.length - 1))
		debugFn.sub = function() {
			return getDebug.apply(null, nameParts.concat([].slice.call(arguments)))
		}
		debugFns[name] = debugFn
		return debugFn
	}
}
module.exports = getDebug('movie-voting')