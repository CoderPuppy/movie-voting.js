const debug = require('debug')

const traceDebugFns = {}
function getTraceDebug(name) {
	if(traceDebugFns[name]) {
		return traceDebugFns[name]
	} else {
		return traceDebugFns[name] = debug('trace:' + name)
	}
}

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
		debugFn.trace = getTraceDebug(name)
		debugFns[name] = debugFn
		return debugFn
	}
}
module.exports = getDebug('movie-voting')