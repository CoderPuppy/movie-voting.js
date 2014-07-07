const impl = require('./borda-count')

module.exports = function(data) {
	const voting = impl(data)
	voting.reset()
	data.people.forEach(function(person) {
		voting.update(person)
	})
	return voting
}