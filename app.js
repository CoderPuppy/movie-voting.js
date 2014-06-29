const listen = require('./listen')
const http   = require('http')
const log    = require('./logging')
const co     = require('co')

const views = require('./views')

const server = http.createServer(co(function*(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html' })
	yield views.layout(res, views.vote)
	res.end()
}))
listen(server, 3000, '0.0.0.0')