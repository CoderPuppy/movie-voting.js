const html = require('../html')
const path = require('path')
const each = require('co-foreach')
const fs   = require('co-fs')

module.exports = {
	name: 'Vote',
	render: function*(stream) {
		const h = html(stream)
		// const entries = JSON.parse(yield fs.readFile(path.join(__dirname, '../options.json')))
		yield h('ul', function*() {
			// yield each(entries, function*(entry) {
			// 	yield h('li', entry)
			// })
		})
		// console.log(entries)
	}
}