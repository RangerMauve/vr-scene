/* global AFRAME localStorage prompt alert DatArchive spawnModel $$ */
const SCENE_FILE = '/scene.json'
const ARCHIVE_LIST_KEY = 'scenes'
const SCENE_TITLE_PROMPT = 'What should your scene be called?'
const SCENE_SEARCH_KEY = 'scene'
const RAW_IP_REGEX = /\d+\.\d+\.\d+\.\d+/
const PLACE_SAVE_DELAY = 2000

let currentArchive = null

if (window.DatArchive) {
  // Logic specific to Beaker
} else {
  // Logic specific to regular browsers
  const SDK = require('dat-sdk/promise')
  const DatPeers = require('dat-peers')

  const options = {
    driveOpts: {
      // This enables the extension messages we need for datPeers to work
      extensions: DatPeers.EXTENSIONS
    }
  }

  // Detect if hostname is an IP address (probably on local network)
  // Configure swarm to use it for discovery-swarm-web proxy and WebRTC signaling
  const url = new URL(window.location)
  const { hostname } = url

  console.log('checking if loading on local server', hostname)
  if (hostname.match(RAW_IP_REGEX)) {
    console.log('Matched, setting swarm opts')
    options.swarmOpts = {
      signalhub: [`ws://${hostname}:3300`],
      discovery: `ws://${hostname}:3472`
    }
  }

  const { DatArchive } = SDK(options)

  DatArchive.load('dat://a1470144d44cee0e530d4156943508be8addb6425e1e49e45dcea45acea72ce6').then((archive) => {
    const datPeers = new DatPeers(archive._archive)
    window.experimental = {
      datPeers
    }
  })

  window.DatArchive = DatArchive

  // Generate an `experimental.datPeers` global with a known dat URL for peer discovery
}

function getPlacedModels () {
  return $$('[placed-model]')
}

function getSavedScenes () {
  try {
    const currentRaw = localStorage.getItem(ARCHIVE_LIST_KEY)
    if (!currentRaw) return []
    return JSON.parse(currentRaw)
  } catch (e) {
    console.warn(e)
    return []
  }
}

function saveSceneList (list) {
  localStorage.setItem(ARCHIVE_LIST_KEY, JSON.stringify(list, null, '\t'))
}

function addSavedScene (url) {
  const existing = getSavedScenes()
  const final = existing.concat(url)

  saveSceneList(final)
}

async function saveScene (archive) {
  console.log('Saving scene')

  // Find all placed models
  const entities = getPlacedModels()

  console.log('Got entities', entities)

  // Build Array of objects with {position, rotation, src}
  const models = entities.map((el) => {
    const position = el.getAttribute('position')
    const rotation = el.getAttribute('rotation')
    const src = el.getAttribute('src')

    return { position, rotation, src }
  })

  const descriptions = {
    models
  }

  console.log('Built description', descriptions)

  // Write JSON file to scene
  const toSave = JSON.stringify(descriptions, null, '\t')

  await archive.writeFile(SCENE_FILE, toSave)

  console.log('Saved')
}

async function saveCurrentScene () {
  await saveScene(currentArchive)
}

async function loadScene (url) {
  console.log('Loading scene', url)

  const archive = await DatArchive.load(url)

  // Load JSON file from archive
  const rawScene = await archive.readFile(SCENE_FILE, 'utf8')
  const parsedScene = JSON.parse(rawScene)

  console.log('Got saved scene', parsedScene)

  // Iterate through objects and spawn models
  for (let attributes of parsedScene.models) {
    spawnModel(attributes)
  }

  currentArchive = archive
}

async function forkScene (archive) {
  // Ask for a title for the scene
  const title = prompt(SCENE_TITLE_PROMPT)

  // Fork archive
  const forked = await DatArchive.fork(archive.url, {
    title
  })

  // Add to list of saved archives
  addSavedScene(forked.url)
}

async function createScene () {
  // Ask for a title for the scene
  const title = prompt(SCENE_TITLE_PROMPT)

  // Initialize empty scene file and specify title
  const archive = await DatArchive.create({
    title
  })

  const toWrite = '{"models":[]}'

  await archive.writeFile(SCENE_FILE, toWrite)

  const { url } = archive

  // Add to list of saved archives
  addSavedScene(url)

  return url
}

async function promptScene (current) {
  // Ask for number of the archive to load
  const loaded = []
  for (let url of current) {
    const archive = await DatArchive.load(url)
    const { title } = await archive.getInfo()
    loaded.push(title)
  }

  const promptText = `
Choose a scene:
${loaded.map((title, index) => `${index}: ${title}`)}
`

  const chosenIndex = prompt(promptText)

  const chosenURL = current[chosenIndex]

  if (!chosenURL) throw alert('Please choose a valid scene number.')

  return chosenURL
}

async function chooseScene () {
  // List known archives in localStorage
  const current = getSavedScenes()
  let chosen = null

  if (!current.length) {
    // If there are none, create a new one
    chosen = await createScene()
  } else if (current.length === 1) {
    // If there is only one, skip asking
    chosen = current[0]
  } else {
    chosen = await promptScene()
  }

  // Set URL of chosen scene in the search params
  window.location.search = `?${SCENE_SEARCH_KEY}=${encodeURI(chosen)}`
}

function detectScene () {
  // Check if there is a Dat URL in the search params
  const url = new URL(window.location.href)
  const scene = url.searchParams.get(SCENE_SEARCH_KEY)

  if (scene) {
    // If there is, load it
    loadScene(scene)
  } else {
    // If there isn't choose a scene
    chooseScene()
  }
}

AFRAME.registerComponent('scene-loader', {
  init () {
    detectScene()
    discoverScenes()
  }
})

function discoverScenes () {
  // Listen for session data from datPeers
  // Add new URLs to a Set for later
  // If new URLs were found, update sessionData with the new Set
}

function chooseDiscoveredScene () {
  // Get set of URLs
  // Iterate through them and load the titles (with timeout)
  // Render prompt with titles, asking for integer
}

function advertiseScene () {
  // Add own URL to set of discovered scenes
  // Update sessionData in datPeers with set
}

let saveTimer = null

window.saveScene = function () {
  clearInterval(saveTimer)

  saveTimer = setTimeout(saveCurrentScene, PLACE_SAVE_DELAY)
}
