const debug = require('./debug')
const path  = require('path')

const static = require('inertia').createHandler()

static.encoding = 'utf-8'
static.useCache = debug.enabled
static.useCompression = debug.enabled

static.addFileHandler('js')

static.addDirHandler(path.join(__dirname, 'public'))

module.exports = static