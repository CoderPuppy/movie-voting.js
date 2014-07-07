const xtend = require('xtend')

module.exports = function(pathname) {
	function render(part) {
		switch(part) {
		case 'title':
			return 'Page not found: ' + pathname
		default:
			return ''
		}
	}
	render.head = function(headers) {
		return xtend(headers, { status: 404 })
	}

	return render
}