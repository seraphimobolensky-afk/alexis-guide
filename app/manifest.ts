import type { MetadataRoute } from 'next'

// Web app manifest, for "Add to Home Screen" / "Install app" (mainly
// Android and desktop Chrome; iOS uses the apple-touch-icon + appleWebApp
// settings in app/layout.tsx). Manifests can't switch icons by colour
// scheme, so this uses the light-mode seal (cream on green), which reads
// well on both light and dark home screens.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alexis's Guide",
    short_name: "Alexis's Guide",
    description: 'A guide to living alone — from Sera',
    start_url: '/guide/welcome',
    display: 'standalone',
    background_color: '#EBEBEB',
    theme_color: '#EBEBEB',
    icons: [
      { src: '/favicons/icon-light-mode-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicons/icon-light-mode-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
