Beadboard — installable web app
================================

WHAT'S HERE
  index.html              the whole app (self-contained)
  manifest.webmanifest    name, icon and standalone display
  sw.js                   offline caching
  icon-*.png              app icons

PUTTING IT ONLINE (easiest route, ~1 minute, free)
  1. Go to app.netlify.com/drop on a computer
  2. Drag this whole folder onto the page
  3. You get a URL like https://something-random.netlify.app
  4. Rename the site in Site settings if you like

ON THE IPAD
  1. Open the URL in Safari
  2. Share -> Add to Home Screen
  3. It installs as "Beadboard" with its own icon and opens
     full screen with no browser chrome

  After the first visit it works with no connection.

UPDATING LATER
  Replace index.html, change CACHE in sw.js from "beadboard-v1"
  to "beadboard-v2", and re-upload. Without the version bump,
  installed copies keep serving the old file.

OTHER HOSTS
  Any static host works the same way: GitHub Pages, Cloudflare
  Pages, Vercel. It must be https (or localhost) or the service
  worker won't register and offline won't work.

REPLACING THE ICONS
  Swap these four files, keeping the exact names and pixel sizes:

    icon-180.png           180x180  iPhone/iPad home screen
    icon-192.png           192x192  browser tab, Android
    icon-512.png           512x512  Android, install screens
    icon-maskable-512.png  512x512  Android adaptive icon

  icon-180 and icon-maskable-512 must be full-bleed, opaque squares
  with no rounded corners: the system applies its own shape, and iOS
  turns transparent pixels black. Keep the maskable icon's artwork
  inside the central 80% circle, since Android may crop to a circle.

  Then change CACHE in sw.js to the next version number, upload, and
  on each device delete the home-screen icon and Add to Home Screen
  again. iOS keeps old icons until the shortcut is re-added.
