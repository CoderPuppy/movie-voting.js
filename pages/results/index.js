const xtend = require('xtend')

module.exports = function() { return function(req, res) {
	function render(part) {
		switch(part) {
		case 'title':
			res.write('Results')
			break
		case 'body':
			break
		}

		return function(cb) {
			process.nextTick(function() {
				cb(null)
			})
		}
	}
	render.head = function(headers) {
		return xtend(headers, { status: 200 })
	}

	return render
} }