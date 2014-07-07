const hyperglue = require('hyperglue')
const xtend     = require('xtend')
const html      = require('fs').readFileSync(__dirname + '/index.html')
const co        = require('co')

module.exports = function(page) {
	function render(part) {
		switch(part) {
		case 'root':
			return hyperglue(html, {
				'.title': page('title') + ' - Movie Voting',
				'#content': { _html: page('body') }
			}).outerHTML
		default:
			return ''
		}
	}
	render.head = function(headers) {
		return page.head(xtend(headers, { 'Content-Type': 'text/html' }))
	}

	return render
}