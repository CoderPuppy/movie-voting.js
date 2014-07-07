const domready = require('domready')
const _person  = require('../_person')
const bean     = require('bean')
const conn     = require('../../browser/conn').duplex('vote')

const pull    = require('pull-stream')
pull.pushable = require('pull-pushable')

const debug  = require('../../debug').sub('client', 'vote')
debug.stream = debug.sub('stream')

const $ = require('../../browser/dom')

debug('loaded')
domready(function() {
	debug('domready', $('body'))

	const main = $('.vote')

	const movies = moviesInit(main)
	const people = peopleInit(main, movies)

	conn.out = pull.pushable()
	pull(
		conn,
		{
			sink: pull.drain(function(val) {
				debug.stream(val)
				switch(val[0]) {
				case 'rename':
					people.rename(people.get(val[1]), val[2])
					break

				default:
					debug.stream('unknown command: %s', val[0])
				}
			}),
			source: conn.out
		},
		conn
	)
})

function peopleInit(main, movies) {
	const people = main.find('.people')
	people.real = people.find('.real-people')

	people.rename = function(person, newName) {
		person.dataset.name = newName
		person.find('.name').textContent = newName
	}

	people.delete = function(person) {
		people.removeChild(person)
	}

	people.get = function(id) {
		return people.find('.person[data-id="' + id + '"]')
	}

	bean.on(people, 'click', '.person', function(e) {
		people.findAll('.person.selected').forEach(function(el) {
			el.classList.remove('selected')
		})

		// todo: movies.selected.clear()
		$.wrap(movies.selected.children).forEach(function(el) {
			movies.selected.removeChild(el)
			movies.available.insert(el)
		})
		this.classList.add('selected')
	})

	bean.on(people, 'click', '.person .edit', function(e) {
		const person = $.wrap(this.parentNode)
		person.classList.add('editing')
		person.find('form .name').value = person.dataset.name
	})

	bean.on(people, 'submit', '.person form', function(e) {
		const person = $.wrap(this.parentNode)
		person.classList.remove('editing')
		people.rename(person, person.find('form .name').value)
		conn.out.push([ 'rename', person.dataset.id, person.dataset.name ])
		e.preventDefault()
	})

	bean.on(people, 'click', '.person .delete', function(e) {
		const person = $.wrap(this.parentNode)
		conn.out.push([ 'delete', person.dataset.id ])
		people.delete(person)
	})

	bean.on(people.find('.new'), 'click', function(e) {
		const data = {
			id: -1,
			name: '',
			vote: []
		}
		const person = $.wrap(_person(data))
		person.dataset.id = data.id
		person.dataset.name = data.name
		people.real.appendChild(person)
		conn.out.push([ 'new' ])
	})

	return people
}

function moviesInit(main) {
	const movies = main.find('.movies')
	movies.selected = movies.find('.selected')
	movies.available = movies.find('.available')

	movies.available.insert = function(el) {
		movies.available.insertBefore(el, movies.available.get(parseInt(el.dataset.id) + 1))
	}

	movies.available.get = function(id) {
		return movies.available.find('.movie[data-id="' + id + '"]')
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