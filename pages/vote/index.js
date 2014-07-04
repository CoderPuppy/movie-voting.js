const xtend = require('xtend')

module.exports = function(data) { return function(req, res) {
	function render(part) {
		switch(part) {
		case 'title':
			res.write('Vote')
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