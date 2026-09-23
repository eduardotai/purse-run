const { app, BrowserWindow } = require("electron")
const path = require("path")

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { contextIsolation: true },
  })
  window.loadFile(path.join(__dirname, "..", "dist", "index.html"))
}

app.whenReady().then(() => {
  try {
    const steamworks = require("steamworks.js")
    steamworks.init(480)
  } catch (error) {
    console.error("Steam app 480 did not start. The local page still opens.", error)
  }
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
