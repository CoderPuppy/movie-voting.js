const domready = require('domready')
const debug    = require('./debug').sub('client')
const conn     = require('./browser/conn')
const pull     = require('pull-stream')

conn.on('connect', function(mx) {
	pull(
		mx.source('reset'),
		pull.drain(function() {
			window.location.reload()
		})
	)
})

debug('loaded')
domready(function() {
	debug('domready')
})