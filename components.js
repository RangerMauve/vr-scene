/* global AFRAME THREE MODEL_LIST */
const MAX_AUTOSCALE = 6
const MIN_AUTOSCALE = 0.5

AFRAME.registerComponent('autoscale', {
  schema: { type: 'number', default: 1 },
  init: function () {
    this.scale()
    this.el.addEventListener('object3dset', () => this.scale())
  },
  scale: function () {
    const el = this.el
    const span = this.data
    const mesh = el.getObject3D('mesh')

    if (!mesh) return

    // Compute bounds.
    const bbox = new THREE.Box3().setFromObject(mesh)

    // Normalize scale.
    const scale = span / bbox.getSize().length()
    mesh.scale.set(scale, scale, scale)

    // Recenter.
    const offset = bbox.getCenter().multiplyScalar(scale)
    mesh.position.sub(offset)
  }
})

AFRAME.registerComponent('current-model', {
  init () {
    console.log('loading current model')
    this.modelIndex = -1
    this.loadNext()
  },
  loadNext () {
    console.log('loading next model')
    this.modelIndex = (this.modelIndex + 1) % MODEL_LIST.length
    this.loadCurrent()
  },
  loadPrevious () {
    console.log('loading previous model')
    this.modelIndex = this.modelIndex - 1
    if (this.modelIndex < 0) this.modelIndex = MODEL_LIST.length - 1
    this.loadCurrent()
  },
  loadCurrent () {
    const currentChild = this.getCurrentChild()
    if (currentChild) {
      console.log('removing existing child', currentChild)
      this.el.removeChild(currentChild)
    }

    const modelSrc = this.getCurrentSrc()
    console.log('adding new model', this.modelIndex, modelSrc)

    const elementType = getElementType(modelSrc)

    const newChild = document.createElement(elementType)
    newChild.setAttribute('src', modelSrc)

    newChild.setAttribute('autoscale', '1')

    newChild.setAttribute('position', "0 0.5 0")

    console.log('new child', newChild)

    this.el.appendChild(newChild)
  },
  getCurrentSrc () {
    return MODEL_LIST[this.modelIndex]
  },
  getCurrentChild () {
    return this.el.firstElementChild
  },
  placeModel () {
    const src = this.getCurrentSrc()

    const currentChild = this.getCurrentChild()

    const child3D = currentChild.object3D

    const position = child3D.getWorldPosition(new THREE.Vector3())

    const quaternion = new THREE.Quaternion()
    child3D.getWorldQuaternion(quaternion)

    const rotation = new THREE.Euler()
    rotation.setFromQuaternion(quaternion)

    spawnModel({src, position, rotation})

    window.saveScene()
  },
  grow () {
    const currentChild = this.getCurrentChild()
    if (!currentChild) return
    let autoscale = parseInt(currentChild.getAttribute('autoscale'))
    autoscale = Math.min(autoscale + 1, MAX_AUTOSCALE)
    currentChild.setAttribute('autoscale', autoscale)
    currentChild.components.autoscale.scale()
  },
  shrink () {
    const currentChild = this.getCurrentChild()
    if (!currentChild) return
    let autoscale = parseInt(currentChild.getAttribute('autoscale'))
    autoscale = Math.max(autoscale - 1, MIN_AUTOSCALE)
    currentChild.setAttribute('autoscale', autoscale)
    currentChild.components.autoscale.scale()
  }
})

AFRAME.registerComponent('placed-model', {
  init () {
    this.el.setAttribute('class', 'interactive')
    console.log('placed new model', this)
    this.el.addEventListener('click', () => {
      console.log('destroying placed model')
      this.el.parentElement.removeChild(this.el)
      this.el.destroy()
      window.saveScene()
    })
  }
})

AFRAME.registerComponent('ui-place', {
  init () {
    this.el.setAttribute('class', 'interactive')
    this.el.addEventListener('click', () => {
      currentModelComponent().placeModel()
    })
  }
})

AFRAME.registerPrimitive('ui-place', {
  defaultComponents: {
    'ui-place': {},
    'gltf-model': 'url(./models/Place.glb)'
  }
})

AFRAME.registerComponent('ui-next', {
  init () {
    this.el.setAttribute('class', 'interactive')
    this.el.addEventListener('click', () => {
      currentModelComponent().loadNext()
    })
  }
})

AFRAME.registerPrimitive('ui-next', {
  defaultComponents: {
    'ui-next': {},
    'gltf-model': 'url(./models/Next.glb)'
  }
})

AFRAME.registerComponent('ui-prev', {
  init () {
    this.el.setAttribute('class', 'interactive')
    this.el.addEventListener('click', () => {
      currentModelComponent().loadPrevious()
    })
  }
})

AFRAME.registerPrimitive('ui-prev', {
  defaultComponents: {
    'ui-prev': {},
    'gltf-model': 'url(./models/Prev.glb)'
  }
})
