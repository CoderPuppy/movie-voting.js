const xtend = require('xtend')

module.exports = function() { return function(req, res) {
	function render(part) {
		switch(part) {
		case 'title':
			res.write('Page not found: ' + req.pURL.pathname)
			break
		case 'body':
			// res.write('<h1>Page not found: ' + req.pURL.pathname + '</h1>')
			break
		}

		return function(cb) {
			process.nextTick(function() {
				cb(null)
			})
		}
	}
	render.head = function(headers) {
		return xtend(headers, { status: 404 })
	}

	return render
} }