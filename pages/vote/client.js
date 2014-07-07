const domready = require('domready')
const debug    = require('../../debug').sub('client', 'vote')
const bean     = require('bean')

const $ = require('../../browser/dom')

debug('loaded')
domready(function() {
	debug('domready', $('body'))

	const main = $('.vote')

	const people = main.find('.people')

	const movies = main.find('.movies')
	movies.selected = movies.find('.selected')
	movies.available = movies.find('.available')

	bean.on(movies.selected, 'click', '.movie .right', function(e) {
		movies.selected.removeChild(this.parentNode)
		movies.available.appendChild(this.parentNode)
	})

	bean.on(movies.selected, 'click', '.movie .up', function(e) {
		const prev = this.parentNode.previousSibling
		movies.selected.removeChild(this.parentNode)
		movies.selected.insertBefore(this.parentNode, prev)
	})

	bean.on(movies.selected, 'click', '.movie .down', function(e) {
		const next = this.parentNode.nextSibling.nextSibling
		movies.selected.removeChild(this.parentNode)
		movies.selected.insertBefore(this.parentNode, next)
	})

	bean.on(movies.available, 'click', '.movie .left', function(e) {
		movies.available.removeChild(this.parentNode)
		movies.selected.appendChild(this.parentNode)
	})

	bean.on(people, 'click', '.person', function(e) {
		people.findAll('.person.selected').forEach(function(el) {
			el.classList.remove('selected')
		})
		this.classList.add('selected')
	})
})