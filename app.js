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
pull.split    = require('pull-split')

const data = require('./data')

debug.shoe = debug.sub('shoe')

const pages = {
	vote: require('./pages/vote'),
	results: require('./pages/results'),
	notfound: require('./pages/notfound'),
	layout: require('./pages/layout'),
	draw: require('./pages/draw'),
	setMovies: require('./pages/set-movies')
}

const static = require('./static')

const server = http.createServer(function(req, res) {
	const pURL = url.parse(req.url)
	const query = qs.parse(pURL.query)
	pURL.query = query
	req.pURL = pURL

	debug('%s %s', req.method, pURL.pathname)

	switch(pURL.pathname) {
	case '/':
	case '/vote':
		pages.draw(pages.layout(pages.vote(data)), res)
		break

	case '/results':
		pages.draw(pages.layout(pages.results(data)), res)
		break

	case '/movies.json':
		res.writeHead(200, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify(data))
		break

	case '/movies/set':
		switch(req.method) {
		case 'GET':
			pages.draw(pages.layout(pages.setMovies(data)), res)
			break

		case 'PUT':
			var sent = ''
			pull(
				stps.source(req),
				pull.split(),
				pull.drain(function(v) {
					sent += v
				}, function() {
					data.people.forEach(function(person) {
						person.update([])
					})
					data.voting.reset()
					const movies = JSON.parse(sent)
					data.movies.reset()
					movies.forEach(function(movie) {
						movie.id = data.movies.length
						data.movies.push(movie)
					})
					data.movies.emit('loaded')
					data.emit('loaded')
					res.end()
				})
			)

		default:
			res.writeHead(303, { 'Location': '/' })
		}
		break

	default:
		static(req, res, function() {
			pages.draw(pages.layout(pages.notfound(req.pURL.pathname)), res)
		})
	}
})
listen(server, process.env.PORT || 3000, process.env.IP || '0.0.0.0')

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

		case 'results':
			pull(pages.results.stream(data), ps)
			break

		default:
			debug.shoe('Unknown stream: %s', meta)
		}
	})).pipe(conn)
}))
shoe.install(server, '/shoe')