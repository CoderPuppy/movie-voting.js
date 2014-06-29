const co = require('co')

const noEndTag = { 'meta': true }

function html(stream, pretty) {
	function h(tag, attrs, body) {
		if(typeof(attrs) != 'object' || attrs === null) {
			var tmp = attrs
			attrs = {}
			body = tmp
		}

		if(typeof(body) == 'string') {
			var bodyText = body
			body = function*() {
				yield h.text(bodyText)
			}
		}

		// TODO: detect if it's a generator function
		if(typeof(body) != 'function') {
			body = function*(){}
		}

		attrs = Object.keys(attrs).map(function(k) {
			return ' ' + k + '="' + attrs[k] + '"'
		})

		return function(cb) {
			stream.write('<' + tag + attrs.join('') + '>')
			if(pretty) stream.write('\n')
			co(body)()
			if(!noEndTag[tag]) {
				stream.write('</' + tag + '>')
			}
			if(pretty) stream.write('\n')
			cb()
		}
	}
	h.text = function text() {
		const text = [].slice.call(arguments).join('')
		return function(cb) {
			stream.write(text)
			if(pretty) stream.write('\n')
			cb(null)
		}
	}
	h.doctype = function doctype() {
		const text = [].slice.call(arguments).join('')
		return function(cb) {
			stream.write('<!doctype ' + text + '>')
			if(pretty) {
				stream.write('\n')
			}
			cb(null)
		}
	}
	return h
}
exports = module.exports = html