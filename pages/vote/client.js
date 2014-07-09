const domready = require('domready')
const _person  = require('../_person')
const bean     = require('bean')
const conn     = require('../../browser/conn')
const EE       = require('events').EventEmitter

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

	const main = $('.content.vote')
	eeify(main)

	window.voteMain = main

	const people = main.people = peopleInit(main)
	const movies = main.movies = moviesInit(main)

	connInit(main)
})

function peopleInit(main) {
	const people = main.find('.people')
	people.real = people.find('.real-people')
	eeify(people)

	people.selected = null

	people.new = function(id, name, vote) {
		const person = $.wrap(_person({
			id: id,
			name: name,
			vote: vote
		}))

		person.dataset.id = id
		person.dataset.name = name
		people.setVote(person, vote)

		people.real.appendChild(person)

		return person
	}

	people.rename = function(person, newName) {
		person.dataset.name = newName
		person.find('.name').textContent = newName
	}

	people.delete = function(person) {
		people.real.removeChild(person)

		if(people.selected && people.selected.dataset.id == person.dataset.id) {
			people.selected = null
		}
	}

	people.select = function(person) {
		people.findAll('.person.selected').forEach(function(el) {
			el.classList.remove('selected')
		})

		main.movies.selected.clear()
		person.classList.add('selected')
		people.selected = person

		main.movies.selected.clear()
		people.getVote(person).forEach(function(id) {
			main.movies.select(main.movies.available.get(id), true)
		})
	}

	people.startEditing = function(person) {
		person.classList.add('editing')
		const nameField = person.find('form .name')
		nameField.value = person.dataset.name
		nameField.focus()
	}

	people.endEditing = function(person, save) {
		person.classList.remove('editing')
		if(save)
			people.rename(person, person.find('form .name').value)
	}

	people.getVote = function(person) {
		if(person.dataset.vote.length == 0)
			return []
		else
			return person.dataset.vote.split(',').map(function(v) {
				return parseInt(v)
			})
	}

	people.setVote = function(person, vote, uiOnly) {
		person.dataset.vote = vote.join(',')

		if(people.selected && person.dataset.id == people.selected.dataset.id) {
			main.movies.selected.clear()
			vote.forEach(function(id) {
				main.movies.select(main.movies.available.get(id), true)
			})
		}

		if(!uiOnly)
			people.emit('update', person)

		return person
	}

	people.get = function(id) {
		return people.find('.person[data-id="' + id + '"]')
	}

	bean.on(people, 'click', '.person', function(e) {
		people.select($.wrap(this))
	})

	bean.on(people, 'click', '.person .edit', function(e) {
		people.startEditing($.wrap(this.parentNode))
	})

	bean.on(people, 'submit', '.person form', function(e) {
		e.preventDefault()

		const person = $.wrap(this.parentNode)
		people.endEditing(person, true)
		people.emit('rename', person)
	})

	bean.on(people, 'click', '.person .delete', function(e) {
		const person = $.wrap(this.parentNode)
		people.emit('delete', person)
		people.delete(person)
	})

	bean.on(people.find('.new'), 'click', function(e) {
		people.emit('new', people.new(-1, '', []))
	})

	return people
}

function moviesInit(main) {
	const movies = main.find('.movies')
	eeify(movies)

	movies.select = function(movie, uiOnly) {
		movies.available.removeChild(movie)
		movies.selected.appendChild(movie)

		if(!uiOnly && main.people.selected) {
			const vote = main.people.getVote(main.people.selected)
			vote.push(parseInt(movie.dataset.id))
			main.people.setVote(main.people.selected, vote)
		}
	}

	movies.unselect = function(movie) {
		movies.selected.removeChild(movie)
		movies.available.insert(movie)

		if(main.people.selected) {
			const vote = main.people.getVote(main.people.selected)
			vote.splice(vote.indexOf(parseInt(movie.dataset.id)), 1)
			main.people.setVote(main.people.selected, vote)
		}
	}

	// Selected
	movies.selected = movies.find('.selected')
	eeify(movies.selected)

	movies.selected.clear = function() {
		$.wrap(movies.selected.children).forEach(function(el) {
			movies.selected.removeChild(el)
			movies.available.insert(el)
		})
	}

	movies.selected.moveUp = function(movie) {
		const prev = movie.previousSibling
		movies.selected.removeChild(movie)
		movies.selected.insertBefore(movie, prev)

		if(main.people.selected) {
			const vote = main.people.getVote(main.people.selected)
			const id = parseInt(movie.dataset.id)
			const index = vote.indexOf(id)
			vote.splice(index, 1)
			vote.splice(index - 1, 0, id)
			main.people.setVote(main.people.selected, vote)
		}
	}

	movies.selected.moveDown = function(movie) {
		const next = movie.nextSibling.nextSibling
		movies.selected.removeChild(movie)
		movies.selected.insertBefore(movie, next)

		if(main.people.selected) {
			const vote = main.people.getVote(main.people.selected)
			const id = parseInt(movie.dataset.id)
			const index = vote.indexOf(id)
			vote.splice(index, 1)
			vote.splice(index + 1, 0, id)
			main.people.setVote(main.people.selected, vote)
		}
	}

	bean.on(movies.selected, 'click', '.movie .right', function(e) {
		movies.unselect($.wrap(this.parentNode))
	})

	bean.on(movies.selected, 'click', '.movie .up', function(e) {
		movies.selected.moveUp($.wrap(this.parentNode))
	})

	bean.on(movies.selected, 'click', '.movie .down', function(e) {
		movies.selected.moveDown($.wrap(this.parentNode))
	})

	// Available
	movies.available = movies.find('.available')
	eeify(movies.available)

	movies.available.insert = function(el) {
		movies.available.insertBefore(el, movies.available.get(parseInt(el.dataset.id) + 1))
	}

	movies.available.get = function(id) {
		return movies.available.find('.movie[data-id="' + id + '"]')
	}

	bean.on(movies.available, 'click', '.movie, .movie .left, .movie .name', function(e) {
		movies.select($.wrap(this.parentNode))
	})

	return movies
}

function connInit(main) {
	conn.on('connect', function(mx) {
		const conn = mx.duplex('vote')

		const listeners = {
			people: {
				new: function(person) {
					conn.out.push([ 'new-id' ])
				},
				update: function(person) {
					conn.send(person.dataset.id, 'update', main.people.getVote(person))
				},
				rename: function(person) {
					conn.send(person.dataset.id, 'rename', person.dataset.name)
				},
				delete: function(person) {
					conn.send(person.dataset.id, 'delete')
				}
			}
		}

		main.people.on('new', listeners.people.new)
		main.people.on('update', listeners.people.update)
		main.people.on('rename', listeners.people.rename)
		main.people.on('delete', listeners.people.delete)

		conn.out  = pull.pushable()
		conn.send = function(id, cmd) {
			id = parseInt(id)
			if(id != -1) {
				conn.out.push([ cmd, id ].concat([].slice.call(arguments, 2)))
			}
		}

		pull(
			conn,
			{
				sink: pull.drain(function(val) {
					debug.stream(val)
					var person
					switch(val[0]) {
					case 'new':
						if(!main.people.get(val[1]))
							main.people.new(val[1], val[2], val[3])
						break

					case 'rename':
						main.people.rename(main.people.get(val[1]), val[2])
						break

					case 'update': {
						person = main.people.get(val[1])
						if(person)
							main.people.setVote(person, val[2], true)
						break }

					case 'delete': {
						person = main.people.get(val[1])
						if(person)
							main.people.delete(person)
						break }

					case 'new-id': {
						person = main.people.get(-1)
						person.dataset.id = val[1]
						conn.send(person.dataset.id, 'rename', person.dataset.name)
						conn.send(person.dataset.id, 'update', main.people.getVote(person))
						break }

					default:
						debug.stream('unknown command: %s', val[0])
					}
				}, function() {
					main.people.removeListener('new', listeners.people.new)
					main.people.removeListener('update', listeners.people.update)
					main.people.removeListener('rename', listeners.people.rename)
					main.people.removeListener('delete', listeners.people.delete)
				}),
				source: conn.out
			},
			conn
		)
	})
}