const html = require('../html')

module.exports = function*(stream, page) {
	const h = html(stream)
	yield h.doctype('html')
	yield h('html', function*() {
		yield h('head', function*() {
			yield h('meta', { 'charset': 'utf-8' })
			yield h('title', function*() {
				yield h.text(page.name + ' - Movie Voting')
			})
		})
		yield h('body', function*() {
			yield page.render(stream)
		})
	})
}