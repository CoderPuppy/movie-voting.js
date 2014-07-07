const hyperglue = require('hyperglue')
const xtend     = require('xtend')
const data      = require('../../data')
const stps      = require('stream-to-pull-stream')
const html      = require('fs').readFileSync(__dirname + '/index.html')

module.exports = function() {
	function render(part) {
		switch(part) {
		case 'title':
			return 'Results'
		case 'body':
			return hyperglue(html, {
				'.result': data.movies[data.voting.result].name
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