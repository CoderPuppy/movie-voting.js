const MuxDemux = require('mux-demux')
const debug    = require('../debug').sub('shoe')
const pull     = require('pull-stream')
const stps     = require('stream-to-pull-stream')
const psts     = require('pull-stream-to-stream')
const EE       = require('events').EventEmitter

exports = module.exports = new EE

const conn = require('reconnect-core')(require('shoe'))(require('client-reloader')(function(stream) {
	const mx = MuxDemux()
	stream.pipe(mx).pipe(stream)

	mx.source = function(meta) {
		return stps.source(mx.createReadStream(meta))
	}

	mx.sink = function(meta) {
		return stps.sink(mx.createWriteStream(meta))
	}

	mx.duplex = function(meta) {
		const stream = mx.createStream(meta)
		return {
			sink: stps.sink(stream),
			source: stps.source(stream)
		}
	}

	mx.through = pull.Through(function(read, meta) {
		const stream = mx.createStream(meta)
		psts(read).pipe(stream)
		return stps.source(stream)
	})

	exports.emit('connect', mx)
})).connect('/shoe')