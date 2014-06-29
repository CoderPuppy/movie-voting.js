const http = require('http')

function basicServer(handler) {
	const server = http.createServer(handler)
	server.listen()
}

exports = module.exports = basicServer