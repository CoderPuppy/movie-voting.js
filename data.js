const voting = require('./voting')
const split  = require('pull-split')
const debug  = require('./debug').sub('data')
const stps   = require('stream-to-pull-stream')
const pull   = require('pull-stream')
const path   = require('path')
const util   = require('util')
const EE     = require('events').EventEmitter
const fs     = require('fs')

debug.movies = debug.sub('movies')
debug.people = debug.sub('people')

const data = new EE

data.path = path.join(__dirname, 'movies')

data.people = (function() {
	const people = []
	people.nextID = 0

	for(var k in EE.prototype) {
		people[k] = EE.prototype[k]
	}
	EE.call(people)

	const Person = (function() {
		function Person(name) {
			if(!(this instanceof Person)) return new Person(name)

			EE.call(this)

			this.id = people.nextID++
			people[this.id] = this

			this.name = name
			
			debug.people('new person: %s (%d)', this.name, this.id)

			this.update([])

			const self = this
			process.nextTick(function() { people.emit('new', self) })
		}
		util.inherits(Person, EE)

		;(function() {
			this.rename = function(name) {
				debug.people('renaming %s (%d) to %s', this.name, this.id, name)

				const oldName = this.name
				this.name = name
				this.emit('rename', name, oldName)
				people.emit('rename', this, name, oldName)

				return this
			}

			this.update = function(vote) {
				debug.people('updating %s (%d)\'s vote to: %j', this.name, this.id, vote)

				const oldVote = this.vote
				this.vote = vote
				this.emit('update', vote, oldVote)
				people.emit('update', this, vote, oldVote)

				data.voting.update(this)()

				return this
			}

			this.delete = function() {
				debug.people('deleting %s (%d)', this.name, this.id)

				people[this.id] = undefined
				this.vote = []

				data.voting.delete(this)()

				this.emit('delete')
				people.emit('delete', this)

				return this
			}
		}).call(Person.prototype)

		return Person
	})()

	people.reset = function() {
		people.splice(0, people.nextID)
		debug.people('reset')
	}

	people.new = function(name) {
		return new Person(name)
	}

	return people
})()

data.movies = (function() {
	const movies = []

	for(var k in EE.prototype) {
		movies[k] = EE.prototype[k]
	}
	EE.call(movies)

	movies.reset = function() {
		movies.splice(0, movies.length)
		debug.movies('reset')
	}

	movies.load = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }
		
		movies.reset()

		debug.movies('loading')

		pull(
			stps.source(fs.createReadStream(data.path)),
			split(),
			pull.filter(function(line) {
				return line.length > 0
			}),
			pull.map(function(entry) {
				return {
					name: entry
				}
			}),
			pull.drain(function(movie) {
				movie.id = movies.length
				movies.push(movie)
			}, function() {
				debug.movies('loaded')
				movies.emit('loaded')
				cb(null, data)
			})
		)
	} }

	movies.save = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		debug.movies('saving')
		pull(
			pull.values(movies),
			pull.map(function(movie) {
				return movie.name + '\n'
			}),
			sink(fs.createWriteStream(data.path).on('end', function() {
				debug.movies('saved')
				cb(null)
			}).on('error', function(err) {
				debug.movies('error while saving', err)
				cb(err)
			}))
		)
	} }

	return movies
})()

data.voting = voting(data)

data.loaded = function() {
	data.voting.updateTitles()()
	data.emit('loaded')
}

function par(thunks) {
	const results = []
	const cbs = []
	var done = 0
	var isDone = false

	thunks.forEach(function(thunk, i) {
		thunk(function(err, res) {
			done += 1
			if(!isDone && done >= thunks.length) {
				isDone = true
				process.nextTick(function() {
					cbs.forEach(function(cb) {
						if(err)
							cb(err)
						else
							cb(null, results)
					})
				})
			}
		})
	})

	return function(cb) {
		cbs.push(cb)
	}
}

data.load = function() { return function(cb) {
	if(!cb) cb = function(err) { if(err) throw err }

	data.people.reset()
	// data.movies.reset()

	par([
		data.movies.load(),
		data.voting.reset()
	])(function(err) {
		if(err) {
			debug('error', err)
			data.emit('error', err)
		} else {
			debug('loaded')
			data.loaded()
		}
		cb(err)
	})
} }

data.save = function() {
	data.movies.save()
}

data.load()(function(err) {
	if(err)
		throw err
	else {
		data.save()

		data.people.new('MIA Jar-emiah Binks')
		data.people.new('Becka Fish'         )
		data.people.new('The Drewduo x64'    )
		data.people.new('Papapaya'           )
		data.people.new('MIPS Dead Egyptian' )
	}
})

module.exports = data
