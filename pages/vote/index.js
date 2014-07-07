const hyperglue = require('hyperglue')
const _movie    = require('../_movie')
const xtend     = require('xtend')
const html      = require('fs').readFileSync(__dirname + '/index.html')

module.exports = function(data) {
	function render(part) {
		switch(part) {
		case 'title':
			return 'Vote'
		case 'body':
			return hyperglue(html, {
				'.person': data.people.map(function(person) {
					return {
						'.name': person.name
					}
				}),
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