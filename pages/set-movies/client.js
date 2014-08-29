const domready = require('domready')
const between  = require('between')
const _movie   = require('../_movie')
const bean     = require('bean')
const conn     = require('../../browser/conn')
const xhr      = require('xhr')

const pull    = require('pull-stream')
pull.pushable = require('pull-pushable')

const debug  = require('../../debug').sub('client', 'set-movies')
debug.stream = debug.sub('stream')

const $ = require('../../browser/dom')

debug('loaded')
domready(function() {
	debug('domready', $('body'))

	const main = $('.content.set-movies')

	const movies = main.find('.movies')
	movies.real = movies.find('.real-movies')

	;(function() {
		// var last = between.lo
		// between.mid = between(between.lo, between.hi)
		movies.list = movies.real.findAll('.movie')
		// movies.list.forEach(function(el) {
		// 	last = el.dataset.id = between(last, between.mid)
		// })

		// movies.sortList = function() {
		// 	movies.list.sort(function(a, b) {
		// 		return between.strord(a.dataset.id, b.dataset.id)
		// 	})
		// 	console.log(movies.list.map(function(el) {
		// 		return el.dataset.id + ' - ' + el.dataset.name
		// 	}))
		// }
		// movies.sortList()
	})()

	movies.new = function(name) {
		const lastMovie = movies.list[movies.list.length - 1]
		const id = between(lastMovie ? lastMovie.dataset.id : between.lo, between.hi)
		const movie = $.wrap(_movie({
			id: id,
			name: name
		}))

		movie.dataset.id = id
		movie.dataset.name = name

		movies.real.appendChild(movie)
		movies.list.push(movie)
		// movies.sortList()

		return movie
	}

	movies.rename = function(movie, newName) {
		movie.dataset.name = newName
		movie.find('.name').textContent = newName
	}

	movies.delete = function(movie) {
		movies.real.removeChild(movie)
		if(~movies.list.indexOf(movie)) {
			movies.list.splice(movies.list.indexOf(movie), 1)
			// movies.sortList()
		}
	}

	movies.startEditing = function(movie) {
		movie.classList.add('editing')
		const nameField = movie.find('form .name')
		nameField.value = movie.dataset.name
		nameField.focus()
	}

	movies.endEditing = function(movie) {
		movie.classList.remove('editing')
		movies.rename(movie, movie.find('form .name').value)
		if(movie.dataset.name.replace(/\s+/g, '').length == 0)
			movies.delete(movie)
	}

	bean.on(movies, 'click', '.movie .edit', function(e) {
		movies.startEditing($.wrap(this.parentNode))
	})

	bean.on(movies, 'submit', '.movie form', function(e) {
		e.preventDefault()

		const movie = $.wrap(this.parentNode)
		movies.endEditing(movie)

		const newMovie = movies.new('')
		movies.startEditing(newMovie)
	})

	bean.on(movies, 'click', '.movie .delete', function(e) {
		const movie = $.wrap(this.parentNode)
		movies.delete(movie)
	})

	bean.on(movies.find('.new'), 'click', function(e) {
		const movie = movies.new('')
		movies.startEditing(movie)
	})

	bean.on(movies.find('.save'), 'click', function(e) {
		movies.real.findAll('.movie.editing').forEach(function(movie) {
			movies.endEditing(movie)
		})

		const moviesData = movies.list.map(function(el) {
			return {
				id: movies.list.indexOf(el),
				name: el.dataset.name
			}
		}).filter(function(movie) {
			return movie.name.replace(/\s+/g, '').length > 0
		})
		// console.log(e, moviesData)
		xhr({
			method: 'PUT',
			uri: '/movies/set',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(moviesData)
		}, function(res) {
			// console.log(res)
		})
	})
})