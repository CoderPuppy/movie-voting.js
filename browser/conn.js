const debug = require('../debug').sub('shoe')
const pull  = require('pull-stream')
const stps  = require('stream-to-pull-stream')
const psts  = require('pull-stream-to-stream')

const conn = require('shoe')('/shoe')
const mx = require('mux-demux')()
conn.pipe(mx).pipe(conn)

exports.mx = mx

exports.source = function(meta) {
	return stps.source(mx.createReadStream(meta))
}

exports.sink = function(meta) {
	return stps.sink(mx.createWriteStream(meta))
}

exports.duplex = function(meta) {
	const stream = mx.createStream(meta)
	return {
		sink: stps.sink(stream),
		source: stps.source(stream)
	}
}

exports.through = pull.Through(function(read, meta) {
	const stream = mx.createStream(meta)
	psts(read).pipe(stream)
	return stps.source(stream)
})