const ndarray = require('ndarray')
const debug   = require('../debug').sub('voting', 'condorcets')
const EE      = require('events').EventEmitter

ndarray.zeros = require('zeros')
ndarray.show  = require('ndarray-show')
ndarray.ops   = require('ndarray-ops')

function baseMatrix(movies) {
	return ndarray.zeros([ movies.length, movies.length ])
}

module.exports = function(data) {
	const voting = new EE

	function update() {
		voting.matrix = voting.people.reduce(function(acc, val) {
			ndarray.ops.add(acc, acc, val)
			return acc
		}, baseMatrix(data.movies))

		debug('matrix:')
		if(debug.enabled) console.log(ndarray.show(voting.matrix))

		voting.result = []
	
		var maxVotes = 0
		for (var y = 0; y < voting.matrix.shape[1]; y++) {
			var votes = 0
			for(var x = 0; x < voting.matrix.shape[0]; x++) {
				votes += voting.matrix.get(x, y)
			}

			if(votes > maxVotes) {
				maxVotes = votes
				voting.result = []
			}
			if(votes >= maxVotes) {
				voting.result.push(y)
			}
		}
		debug('result: %s', voting.result.map(function(id) {
			return data.movies[id].name
		}).join(', '))

		voting.emit('update')
	}

	voting.update = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people[person.id] = generateMatrix(person, data.movies)
		update()

		process.nextTick(function() { cb(null) })
	} }

	voting.remove = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people[person.id] = baseMatrix(data)

		process.nextTick(function() { cb(null) })
	} }

	voting.reset = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people = []
		voting.matrix = baseMatrix(data.movies)
		voting.result = -1
		debug('reseting')

		process.nextTick(function() { cb(null) })
	} }

	return voting
}

function generateMatrix(person, movies) {
	const vote = person.vote

	const moviesOrder = {}
	movies.forEach(function(movie, id) {
		moviesOrder[id] = 10
	})
	vote.forEach(function(id, i) {
		moviesOrder[id] = i
	})
	debug(moviesOrder)

	const matrix = baseMatrix(movies)
	var val
	for(var x = 0; x < matrix.shape[0]; x++) {
		for(var y = 0; y < matrix.shape[1]; y++) {
			if(moviesOrder[y] < moviesOrder[x]) {
				val = 1
			} else {
				val = 0
			}
			matrix.set(x, y, val)
			debug.trace('setting %d (%d), %d (%d) to %d', x, moviesOrder[x], y, moviesOrder[y], val)
		}
	}
	debug('generated matrix for %s (%d):', person.name, person.id)
	if(debug.enabled) console.log(ndarray.show(matrix))
	return matrix
}