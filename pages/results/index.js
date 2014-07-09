const strifyResults = require('./strify')
const hyperglue     = require('hyperglue')
const xtend         = require('xtend')
const html          = require('fs').readFileSync(__dirname + '/index.html')

const debug = require('../../debug').sub('page', 'results')

const pull    = require('pull-stream')
pull.pushable = require('pull-pushable')

function page(data) {
	function render(part) {
		switch(part) {
		case 'title':
			return 'Results'
		case 'body':
			return hyperglue(html, {
				'.result': strifyResults(data.voting.results.map(function(id) {
					return data.movies[id].name
				}))
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
page.stream = function(data) {
	const out = pull.pushable()
	data.voting.on('update', function() {
		out.push(data.voting.results.map(function(id) {
			return data.movies[id].name
		}))
	})
	return out
}

module.exports = page