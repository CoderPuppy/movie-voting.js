const split = require('pull-split')
const stps  = require('stream-to-pull-stream')
const pull  = require('pull-stream')
const path  = require('path')
const EE    = require('events').EventEmitter
const fs    = require('fs')

const data = new EE
data.people = []
data.movies = []

const dataPath = path.join(__dirname, 'movies')

data.load = function(cb) {
	if(!cb) cb = function(err) { if(err) throw err }

	data.people.splice(0, data.people.length)

	data.movies.splice(0, data.movies.length)
	pull(
		stps.source(fs.createReadStream(dataPath)),
		split(),
		pull.filter(function(line) {
			return line.length > 0
		}),
		pull.map(function(line) {
			return line.split(' - ')
		}),
		pull.map(function(entry) {
			return {
				name: entry[0],
				desc: entry[1]
			}
		}),
		pull.drain(function(movie) {
			movie.id = data.movies.length
			data.movies.push(movie)
		}, function() {
			data.emit('loaded')
			cb(null, data)
		})
	)
}

data.save = function() {
	pull(
		pull.values(data.movies),
		pull.map(function(movie) {
			return movie.name + ' - ' + movie.desc + '\n'
		}),
		stps.sink(fs.createWriteStream(dataPath))
	)
}

module.exports = data