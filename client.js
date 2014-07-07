const domready = require('domready')
const debug    = require('./debug').sub('client')
const conn     = require('./browser/conn')
const pull     = require('pull-stream')

pull(conn.source('reset'), pull.drain(function() {
	window.location.reload()
}))

debug('loaded')
domready(function() {
	debug('domready')
})