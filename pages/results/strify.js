module.exports = function(results) {
	if(results.length == 1) {
		return results[0] + ' won!'
	} else if(results.length == 0) {
		return 'Uh, nobody voted...'
	} else {
		return results.slice(0, -1).join(', ') + ' and ' + results.slice(-1)[0] + ' tied'
	}
}