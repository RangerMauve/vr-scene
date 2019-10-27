const VALID_TYPES = ['.obj', '.gltf']
const IGNORE_LIST = ['Place.glb', 'Next.glb', 'Prev.glb']

function isValidType (file) {
  return VALID_TYPES.some((type) => file.endsWith(type))
}

function isntIgnored (file) {
  return !IGNORE_LIST.includes(file)
}

const fs = require('fs')

const files = fs.readdirSync(__dirname)

const models = files.filter(isValidType).filter(isntIgnored)

const urls = models.map((model) => `./models/${model}`)

console.log(urls)

const listText = JSON.stringify(urls, null, '\t')

const listData = `
// Generated via genlist.js
const MODEL_LIST = ${listText}
`

const listLocation = require('path').join(__dirname, 'list.js')

fs.writeFileSync(listLocation, listData)
