const xtend = require('xtend')
const co    = require('co')

module.exports = function(page) { return function(req, res) {
	const subRender = page(req, res)
	function render(part) { return co(function*() {
		switch(part) {
		case 'root':
			res.write('<!doctype html>\n')
			res.write('<meta charset=utf-8>\n')
			res.write('<title>')
			yield subRender('title')
			res.write(' - Movie Voting</title>\n')
			res.write('<script src=index.js></script>')
			yield subRender('head')
			res.write('<h1>')
			yield subRender('title')
			res.write(' - Movie Voting</h1>')
			yield subRender('body')
			break
		}
	}) }
	render.head = function(headers) {
		return subRender.head(xtend(headers, { 'Content-Type': 'text/html' }))
	}

	return render
} }