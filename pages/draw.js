module.exports = function(page, req, res) {
	const render = page(req, res)
	const headers = render.head({})
	console.log(headers)
	res.writeHead(headers.status || 500, headers)
	render('root')(function(err) {
		if(err)
			throw err // TODO: this is bad
		else
			res.end()
	})
}