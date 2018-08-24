const { app, BrowserWindow } = require('electron')
const vr = require('node-openvr')
const VROverlay = require('node-openvr/overlay')

app.disableHardwareAcceleration()

class VRWindow extends BrowserWindow {
  constructor (opts, ...args) {
    opts.frame = false
    opts.transparent = true
    opts.show = false
    opts.webPreferences = {
      ...(opts.webPreferences || {}),
      offscreen: opts.vr.devMode || true
    }

    const vrOpts = opts.vr
    opts.vr = undefined

    super(opts, ...args)

    this.__vrHasNewFrame = true

    this.__setupOverlay(vrOpts)
  }

  __setupOverlay ({ key, name = 'Electron VR App', fps = 60 } = {}) {
    this.__vrSystem = vr.system.VR_Init(vr.EVRApplicationType.VRApplication_Overlay)
    this.__overlay = new VROverlay({ system: this.__vrSystem, key: `electronvr:${Date.now()}:${key}`, name: name })
    this.webContents.setFrameRate(fps)
    
    this.webContents.on('paint', (...args) => {
      this.__vrDraw()
    })

    this.webContents.on('dom-ready', () => {
      // setup overlay further
      this.__overlay.transformTrackedDeviceRelative(0, { x: 0, y: 0, z: -1 })
      this.__overlay.show()

      // initial force draw, this is usually empty but fuck it.
      this.__vrDraw()

      // force draw after a second, too
      setTimeout(() => {
        this.__vrDraw()
      }, 1000)
    })
  }

  __vrDraw (force = false) {
    this.webContents.capturePage((image) => {
      const buf = image.toBitmap()
      
      if (buf.length === 0) {
        return
      }
      
      this.__overlay.setTextureFromBuffer(buf, { ...image.getSize() })
    })
  }
}

module.exports = {VRWindow}
