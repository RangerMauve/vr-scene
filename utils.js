
function $ (selector) {
  return document.querySelector(selector)
}
function $$ (selector) {
  return [...document.querySelectorAll(selector)]
}

function spawnModel (attributes) {
  if (!attributes.autoscale) {
    attributes.autoscale = '1'
  }
  const { rotation, src, position, autoscale } = attributes

  const entityType = getElementType(src)

  const newChild = document.createElement(entityType)
  newChild.setAttribute('placed-model', '')

  if (rotation instanceof THREE.Euler) {
    newChild.object3D.rotation.copy(rotation)
  } else {
    newChild.setAttribute('rotation', rotation)
  }

  newChild.setAttribute('position', position)

  newChild.setAttribute('src', src)

  newChild.setAttribute('autoscale', autoscale)

  $('a-scene').appendChild(newChild)
}

function getElementType (modelSrc) {
  return modelSrc.endsWith('obj') ? `a-obj-model` : 'a-gltf-model'
}

function currentModelComponent () {
  return $('[current-model]').components['current-model']
}
