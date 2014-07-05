const domready = require('domready')
const debug    = require('../../debug').sub('client', 'vote')

const $ = document.querySelector.bind(document)

debug('loaded')
domready(function() {
	debug('domready')
})