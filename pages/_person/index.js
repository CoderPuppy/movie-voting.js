const hyperglue = require('hyperglue')
const html      = require('fs').readFileSync(__dirname + '/index.html').toString()

module.exports = function(person) {
	return hyperglue(html, {
		'.name': person.name,
		'.person': {
			// data: {
			// 	id: person.id.toString(),
			// 	name: person.name
			// }
			'data-id': person.id.toString(),
			'data-name': person.name
		}
	})
}