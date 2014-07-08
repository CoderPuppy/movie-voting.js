const debug = require('../debug').sub('voting', 'borda-count')
const EE    = require('events').EventEmitter

module.exports = function(data) {
	const voting = new EE

	function update() {
		voting.result = []

		const scores = voting.people.reduce(function(acc, val) {
			const res = []
			acc.forEach(function(score, i) {
				res[i] = (score || 0) + (val[i] || 0)
			})
			return res
		}, new Array(data.movies.length).join().split(',').map(function() { return 0 }))
		debug('final scores: %j', scores)

		var maxScore = 0
		scores.forEach(function(score, id) {
			if(score > maxScore) {
				maxScore = score
				voting.result = []
			}
			if(score >= maxScore) {
				voting.result.push(id)
			}
		})
		debug('result: %s', voting.result.map(function(id) {
			return data.movies[id].name
		}).join(', '))

		voting.emit('update')
	}

	voting.update = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }
		
		const scores = []
		person.vote.forEach(function(id, place) {
			debug.trace('%s (%d) [%d] = %d (%d)', person.name, person.id, id, data.movies.length - place, place)
			scores[id] = data.movies.length - place
		})
		voting.people[person.id] = scores
		update()

		process.nextTick(function() { cb(null) })
	} }

	voting.remove = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people[person.id] = new Array(data.movies.length).join().split(',').map(function() { return 0 })

		process.nextTick(function() { cb(null) })
	} }

	voting.reset = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people = []

		update()

		process.nextTick(function() { cb(null) })
	} }

	return voting
}