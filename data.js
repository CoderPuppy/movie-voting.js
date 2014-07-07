const voting = require('./voting')
const split  = require('pull-split')
const debug  = require('./debug').sub('data')
const stps   = require('stream-to-pull-stream')
const pull   = require('pull-stream')
const path   = require('path')
const EE     = require('events').EventEmitter
const fs     = require('fs')

debug.movies = debug.sub('movies')
debug.people = debug.sub('people')

const data = new EE

const dataPath = path.join(__dirname, 'movies')

data.people = (function() {
	const people = []
	people.nextID = 0

	const Person = (function() {
		function Person(name) {
			if(!(this instanceof Person)) return new Person(name)

			this.id = people.nextID++
			people[this.id] = this

			this.name = name
			
			debug.people('new person: %s (%d)', this.name, this.id)

			this.update([])
		}

		(function() {
			this.update = function(vote) {
				debug.people('updating %s (%d)\'s vote to: %j', this.name, this.id, vote)
				this.vote = vote
				data.voting.update(this)()
				return this
			}

			this.delete = function() {
				people[id] = undefined
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
			stps.source(fs.createReadStream(dataPath)),
			split(),
			pull.filter(function(line) {
				return line.length > 0
			}),
			pull.map(function(line) {
				return line.split(' - ')
			}),
			pull.map(function(entry) {
				return {
					name: entry[0],
					desc: entry[1]
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
				return movie.name + ' - ' + movie.desc + '\n'
			}),
			stps.sink(fs.createWriteStream(dataPath).on('end', function() {
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

	par([
		data.movies.load(),
		data.voting.reset()
	])(function(err) {
		if(err) {
			debug('error', err)
			data.emit('error', err)
		} else {
			debug('loaded')
			data.emit('loaded')
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
		data.people.new('Drew'  ).update([ 3, 2, 0, 1 ])
		data.people.new('Jeremy').update([ 0, 2, 1, 3 ])
		data.people.new('Becky' ).update([ 1, 2, 0, 3 ])
	}
})

module.exports = data