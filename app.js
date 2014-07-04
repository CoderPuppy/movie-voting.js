const listen = require('./listen')
const debug  = require('./debug')
const http   = require('http')
const url    = require('url')
const co     = require('co')
const qs     = require('qs')

const data = require('./data')
data.load(function(err) {
	if(err)
		throw err
	else
		data.save()
})

const pages = {
	vote: require('./pages/vote'),
	results: require('./pages/results'),
	notfound: require('./pages/notfound'),
	layout: require('./pages/layout'),
	draw: require('./pages/draw')
}

const static = require('./static')

const server = http.createServer(function(req, res) {
	const pURL = url.parse(req.url)
	const query = qs.parse(pURL.query)
	pURL.query = query
	req.pURL = pURL

	if(static.serve(req, res)) return

	if(pURL.pathname == '/movies.json') {
		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify(data))
	} else if(pURL.pathname == '/' || pURL.pathname == '/vote') {
		pages.draw(pages.layout(pages.vote(data)), req, res)
	} else if(pURL.pathname == '/results') {
		pages.draw(pages.layout(pages.results(data)), req, res)
	} else {
		pages.draw(pages.layout(pages.notfound()), req, res)
	}
})
listen(server, 3000, '0.0.0.0')