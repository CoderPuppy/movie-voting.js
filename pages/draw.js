module.exports = function(page, res) {
	const headers = page.head({})
	res.writeHead(headers.status || 500, headers)
	res.end(page('root'))
}