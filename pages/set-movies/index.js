const hyperglue = require('hyperglue')
const _person   = require('../_person')
const _movie    = require('../_movie')
const xtend     = require('xtend')
const html      = require('fs').readFileSync(__dirname + '/index.html')
const pull      = require('pull-stream')
const Set       = require('es6-set')

pull.pushable = require('pull-pushable')

const debug = require('../../debug').sub('page', 'set-movies')
debug.stream = debug.sub('stream')

function page(data) {
	function render(part) {
		switch(part) {
		case 'title':
			return 'Set Movies'
		case 'body':
			return hyperglue(html, {
				'.real-movies': {
					_html: data.movies.map(function(person) {
						if(person)
							return _movie(person).outerHTML
						else
							return ''
					}).join('\n')
				},
				'.available': {
					_html: data.movies.map(function(movie) {
						return _movie(movie).outerHTML
					}).join('\n')
				}
			}).outerHTML
		default:
			return ''
		}
	}
	render.head = function(headers) {
		return xtend(headers, { status: 200 })
	}

	return render
}

page.stream = function(data) {
	const out = pull.pushable()

	const listeners = {
		people: {
			new: function(person) {
				out.push([ 'new', person.id, person.name, person.vote ])
			},
			update: function(person, newVote) {
				out.push([ 'update', person.id, newVote ])
			},
			rename: function(person, newName) {
				out.push([ 'rename', person.id, newName ])
			},
			delete: function(person) {
				out.push([ 'delete', person.id ])
			}
		}
	}

	data.people.on('new', listeners.people.new)
	data.people.on('update', listeners.people.update)
	data.people.on('rename', listeners.people.rename)
	data.people.on('delete', listeners.people.delete)

	return {
		sink: pull.drain(function(val) {
			debug.stream(val)
			const person = data.people[val[1]]
			switch(val[0]) {
			case 'update':
				if(person)
					person.update(val[2])
				break

			case 'rename':
				if(person)
					person.rename(val[2])
				break

			case 'delete':
				if(person)
					person.delete()
				break

			case 'new-id':
				out.push([ 'new-id', data.people.new('').id ])
				break

			default:
				debug.stream('unknown command: %s', val[0])
			}
		}, function() {
			data.people.removeListener('new', listeners.people.new)
			data.people.removeListener('update', listeners.people.update)
			data.people.removeListener('rename', listeners.people.rename)
			data.people.removeListener('delete', listeners.people.delete)
		}),
		source: out
	}
}

module.exports = page