const debug = require('../debug').sub('voting', 'borda-count')

module.exports = function(data) {
	const voting = {}

	function update() {
		voting.result = -1

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
				voting.result = id
			}
		})
		debug('result: %d', voting.result)
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