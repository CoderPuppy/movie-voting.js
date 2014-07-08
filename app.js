const MuxDemux = require('mux-demux')
const listen   = require('./listen')
const debug    = require('./debug')
const http     = require('http')
const pull     = require('pull-stream')
const stps     = require('stream-to-pull-stream')
const url      = require('url')
const co       = require('co')
const qs       = require('qs')

pull.pushable = require('pull-pushable')

const data = require('./data')

debug.shoe = debug.sub('shoe')

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

	if(pURL.pathname == '/movies.json') {
		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify(data))
	} else if(pURL.pathname == '/' || pURL.pathname == '/vote') {
		pages.draw(pages.layout(pages.vote(data)), res)
	} else if(pURL.pathname == '/results') {
		pages.draw(pages.layout(pages.results(data)), res)
	} else {
		static(req, res, function() {
			pages.draw(pages.layout(pages.notfound(req.pURL.pathname)), res)
		})
	}
})
listen(server, 3000, '0.0.0.0')

const shoe = require('shoe')(require('client-reloader')(function(conn) {
	conn.pipe(MuxDemux(function(stream) {
		const meta = stream.meta
		const ps = {
			sink: stps.sink(stream),
			source: stps.source(stream),
			meta: meta
		}
		switch(meta) {
		case 'reset':
			const push = pull.pushable()
			data.on('loaded', function() {
				push.push('reset')
			})
			pull(push, ps)
			break
		case 'vote':
			pull(ps, pages.vote.stream(data), ps)
			break
		default:
			debug.shoe('Unknown stream: %s', meta)
		}
	})).pipe(conn)
}))
shoe.install(server, '/shoe')