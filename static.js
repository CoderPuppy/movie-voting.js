const debug = require('./debug')
const path  = require('path')
const send  = require('send')

module.exports = function(req, res, cb) {
	const s = send(req, req.pURL.pathname, {
		root: path.join(__dirname, 'public')
	})
	s.on('error', function(err) {
		if(typeof(err) == 'object' && err !== null && err.status == 404)
			cb()
		else
			throw err // TODO: error stuff
	})
	s.pipe(res)
}