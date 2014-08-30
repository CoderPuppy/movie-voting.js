const strifyResults = require('./strify')
const domready      = require('domready')
const conn          = require('../../browser/conn')
const EE            = require('events').EventEmitter

function eeify(o) {
	for(var k in EE.prototype) {
		o[k] = EE.prototype[k]
	}
	EE.call(o)
	return o
}

const pull    = require('pull-stream')
pull.pushable = require('pull-pushable')

const debug  = require('../../debug').sub('client', 'vote')
debug.stream = debug.sub('stream')

const $ = require('../../browser/dom')

debug('loaded')
domready(function() {
	debug('domready', $('body'))

	const main = $('.content.results')
	eeify(main)
	main.result = main.find('.result')
	main.debug = main.find('pre.debug')

	if(localStorage.resultsDebug)
		main.find('.debug-hint').style.display = 'none'
	else
		main.debug.style.display = 'none'

	connInit(main)
})

function connInit(main) {
	conn.on('connect', function(mx) {
		pull(
			mx.source('results'),
			pull.drain(function(results) {
				main.result.textContent = strifyResults(results[0])
				main.debug.textContent = results[1]
			})
		)
	})
}