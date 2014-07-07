const domready = require('domready')
const debug    = require('../../debug').sub('client', 'vote')
const bean     = require('bean')
const pull     = require('pull-stream')
const conn     = require('../../browser/conn').duplex('vote')

pull.pushable = require('pull-pushable')

conn.out = pull.pushable()
pull(
	conn,
	{
		sink: pull.drain(function(val) {

		}),
		source: conn.out
	},
	conn
)

const $ = require('../../browser/dom')

debug('loaded')
domready(function() {
	debug('domready', $('body'))

	const main = $('.vote')

	const movies = moviesInit(main)
	const people = peopleInit(main, movies)
})

function peopleInit(main, movies) {
	const people = main.find('.people')

	bean.on(people, 'click', '.person', function(e) {
		people.findAll('.person.selected').forEach(function(el) {
			el.classList.remove('selected')
		})
		$.wrap(movies.selected.children).forEach(function(el) {
			movies.selected.removeChild(el)
			movies.available.insert(el)
		})
		this.classList.add('selected')
	})

	return people
}

function moviesInit(main) {
	const movies = main.find('.movies')
	movies.selected = movies.find('.selected')
	movies.available = movies.find('.available')

	movies.available.insert = function(el) {
		const id = parseInt(el.dataset.id)
		movies.available.insertBefore(el, movies.available.findAll('.movie').filter(function(el) {
			return parseInt(el.dataset.id) == id + 1
		})[0])
	}

	bean.on(movies.selected, 'click', '.movie .right', function(e) {
		movies.selected.removeChild(this.parentNode)
		movies.available.insert(this.parentNode)
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

	return movies
}