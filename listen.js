module.exports = function(server) {
	var args = [].slice.call(arguments, 1)
	var cb = function(){}
	if(args.length >= 1 && typeof(args[args.length - 1]) == 'function') {
		cb = args[args.length - 1]
		args.pop()
	}
	args.push(function() {
		var addr = server.address()
		console.log('Listening on %s:%d', addr.address, addr.port)
		cb()
	})
	server.listen.apply(server, args)
}