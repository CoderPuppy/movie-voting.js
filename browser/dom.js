const flatten = require('flatten')
const Set     = require('es6-set')

function normalizeRoot(root) {
	if(!root) return document
	if(typeof(root) == 'string') return $(root)
	return root
}

function $(selector, root) {
	root = normalizeRoot(root)
	return wrapNode(root.querySelector(selector))
}

$.all = function $$(selector, root) {
	root = normalizeRoot(root)
	return [].slice.call(root.querySelectorAll(selector)).map(function(node) {
		return wrapNode(node)
	})
}

$.wrap = function(node) {
	if(typeof(node.length) == 'number') {
		return [].slice.call(node).map(function(node) {
			return wrapNode(node)
		})
	} else {
		return wrapNode(node)
	}
}

function wrapNode(node) {
	if(!node) return null

	node.find = function(sel) {
		return $(sel, node)
	}
	node.findAll = function(sel) {
		return $.all(sel, node)
	}
	return node
}

module.exports = $