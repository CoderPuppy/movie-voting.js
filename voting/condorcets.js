const EE    = require('events').EventEmitter
const util  = require('util')

const debug = require('../debug').sub('voting', 'condorcets')
debug.titles = debug.sub('titles')

function Matrix(w, h) {
	if(!(this instanceof Matrix)) throw new Error("use new")
	this.length = w * h
	this.width = w
	this.height = h
	this.array = new Array(this.length)
}
Matrix.prototype.get = function(x, y) {
	return this.array[x + y * this.width]
}
Matrix.prototype.set = function(x, y, v) {
	this.array[x + y * this.width] = v
}
Matrix.prototype.fill = function(v) {
	for(var i = 0; i < this.length; i++) this.array[i] = 0
}
Matrix.prototype.add = function(m) {
	var width = Math.min(this.width, m.width)
	var height = Math.min(this.height, m.height)
	for(var x = 0; x < this.width; x++) {
		for(var y = 0; y < this.height; y++) {
			this.array[x + y * this.width] += m.array[x + y * m.width]
		}
	}
}

function baseMatrix(movies) {
	const matrix = new Matrix(movies.length, movies.length)
	matrix.fill(0)
	return matrix
}

module.exports = function(data) {
	const voting = new EE

	var titles = []

	function updateTitles() {
		debug.titles('prev titles', titles.join(', '))
		titles = data.movies.map(function(movie) {
			return movie.name.replace(/(\W+|^)a|an|and|the|\s+(\W+|$)/gi, function($1, $2) {
				return $1 + $2
			}).replace(/[^A-Z:]/g, '')
		})

		titles.maxLength = Math.max.apply(Math, [0].concat(titles.map(function(title) {
			return title.length
		})))
		debug.titles('next titles', titles.join(', '))
	}
	updateTitles()

	function renderMatrix(matrix, numbers) {
		if(titles.length == 0)
			return ''

		var res = new Array(titles.maxLength + 2).join(' ') + titles.join(' ')
		for(var y = 0; y < matrix.height; y++) {
			if(typeof(titles[y]) != 'string') {
				debug.titles("stuff broke (y)", y, titles, content)
				debug.titles("huh", titles[y])
			}
			res += '\n' + titles[y] + new Array(titles.maxLength - titles[y].length + 2).join(' ')
			for(var x = 0; x < matrix.width; x++) {
				var num = matrix.get(x, y)
				var content = num ? '<' : ' '
				if(numbers && num)
					content = num + ''
				if(typeof(titles[x]) != 'string') {
					debug.titles("stuff broke (x)", x, titles, content)
					debug.titles("huh", titles[x])
					res += 'titles[' + x + '] = ' + util.inspect(titles[x]) + ' '
				}
				res += content + new Array(Math.max(titles[x].length + 1 - content.length, 0)).join(' ') + ' '
			}
			res = res.slice(0, res.length - 1)
		}
		return res
	}

	function generateMatrix(person) {
		const vote = person.vote

		const moviesOrder = {}
		data.movies.forEach(function(movie, id) {
			moviesOrder[id] = Infinity
		})
		vote.forEach(function(id, i) {
			moviesOrder[id] = i
		})
		debug('movies order:', moviesOrder)

		const matrix = baseMatrix(data.movies)
		var val
		for(var x = 0; x < matrix.width; x++) {
			for(var y = 0; y < matrix.height; y++) {
				if(moviesOrder[y] < moviesOrder[x]) {
					val = 1
				} else {
					val = 0
				}
				matrix.set(x, y, val)
				debug.trace('setting %d (%d), %d (%d) to %d', x, moviesOrder[x], y, moviesOrder[y], val)
			}
		}
		debug('generated matrix for %s (%d):', person.name, person.id)
		if(debug.enabled) console.log(renderMatrix(matrix))
		return matrix
	}

	function update() {
		voting.matrix = baseMatrix(data.movies)
		voting.people.forEach(function(matrix) {
			voting.matrix.add(matrix)
		})

		debug('matrix:')
		if(debug.enabled) console.log(renderMatrix(voting.matrix, true))

		voting.results = []
	
		const wins = {}
		data.movies.forEach(function(movie, id) {
			wins[id] = 0
		})

		for(var y = 0; y < voting.matrix.height; y++) {
			for(var x = 0; x < voting.matrix.width; x++) {
				if(x <= y) continue

				var runner   = voting.matrix.get(x, y)
				var opponent = voting.matrix.get(y, x)

				if(runner > opponent)
					wins[y] += 1
				else if(opponent > runner)
					wins[x] += 1

				debug.trace('%s (%d): %d | %s (%d): %d', data.movies[y].name, y, runner, data.movies[x].name, x, opponent)
			}
		}

		(function() {
			var maxWins = 0
			for(var id = 0; id < data.movies.length; id++) {
				/*if(wins[id] >= data.movies.length - 1) {
					voting.results = [ id ]
					return
				} else */
				if(wins[id] >= maxWins) {
					debug('adding %s (%d) - %d to the tie %s at %d', data.movies[id].name, id, wins[id], voting.results.map(function(id) {
						return data.movies[id].name
					}).join(', '), maxWins)
					if(wins[id] > maxWins) {
						maxWins = wins[id]
						voting.results = []
					}

					voting.results.push(id)
				}
			}
		})()

		debug('wins:', wins)

		if(voting.results.length == data.movies.length)
			voting.results = []

		voting.debugInfo = 'Result:\n' + renderMatrix(voting.matrix, true).split('\n').map(function(line) {
			return '  ' + line
		}).join('\n') + '\n\n' + voting.people.map(function(matrix, i) {
			const person = data.people[i]
			if(!person)
				return "Deleted: " + i
			return person.name + ': ' + person.vote.map(function(i) {
				return titles[i]
			}).join(' ') + '\n' + renderMatrix(matrix).split('\n').map(function(line) {
				return '  ' + line
			}).join('\n')
		}).join('\n\n')

		debug('results: %s', voting.results.map(function(id) {
			return data.movies[id].name
		}).join(', '))

		voting.emit('update')
	}
	
	voting.updateTitles = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		updateTitles()
		data.people.forEach(function(person, i) {
			if(!person) return
			voting.people[i] = generateMatrix(person)
		})
		update()
		process.nextTick(function() { cb(null) })
	} }

	voting.update = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people[person.id] = generateMatrix(person)
		update()

		process.nextTick(function() { cb(null) })
	} }

	voting.delete = function(person) { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people[person.id] = baseMatrix(data.movies)

		update()

		process.nextTick(function() { cb(null) })
	} }

	voting.reset = function() { return function(cb) {
		if(!cb) cb = function(err) { if(err) throw err }

		voting.people = []
		voting.matrix = baseMatrix(data.movies)
		voting.results = []
		debug('reseting')

		process.nextTick(function() { cb(null) })
	} }

	return voting
}
