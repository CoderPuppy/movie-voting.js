const domready = require('domready')
const debug    = require('./debug').sub('client')

debug('loaded')
domready(function() {
	debug('domready')
})