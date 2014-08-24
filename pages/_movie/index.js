const hyperglue = require('hyperglue')
const html      = require('fs').readFileSync(__dirname + '/index.html').toString()

module.exports = function(movie) {
	return hyperglue(html, {
		'.name': movie.name,
		'.desc': movie.desc,
		'.movie': {
			'data-id': movie.id.toString(),
			'data-name': movie.name
		}
	})
}