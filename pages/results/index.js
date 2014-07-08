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
				'.result': (function(result) {
					if(result.length == 1) {
						return data.movies[result[0]].name + ' won!'
					} else if(result.length == 0) {
						return 'Uh, noone voted...'
					} else {
						const names = result.map(function(id) {
							return data.movies[id].name
						})
						return names.slice(0, -1).join(', ') + ' and ' + names.slice(-1)[0] + ' tied'
					}
				})(data.voting.result)
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