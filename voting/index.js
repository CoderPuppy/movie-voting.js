const impl = require('./condorcets')

module.exports = function(data) {
	const voting = impl(data)
	voting.reset()
	data.people.forEach(function(person) {
		if(!person) return
		voting.update(person)
	})
	return voting
}
