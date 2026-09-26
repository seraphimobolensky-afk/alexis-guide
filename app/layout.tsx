import type { Metadata, Viewport } from 'next'
import './globals.css'

// SeraSays seal icons (public/favicons/), in two variants picked by the
// device's colour scheme: cream-on-green for light mode, green-on-cream for
// dark mode. These follow the device, not the in-app theme toggle, because
// they sit in the browser's own chrome (tab bar, home screen), not the page.
const light = '(prefers-color-scheme: light)'
const dark = '(prefers-color-scheme: dark)'

export const metadata: Metadata = {
  title: "Alexis's Guide",
  description: 'A guide to living alone — from Sera',
  icons: {
    icon: [
      { url: '/favicons/favicon-light-mode.svg', type: 'image/svg+xml', media: light },
      { url: '/favicons/favicon-dark-mode.svg', type: 'image/svg+xml', media: dark },
      // PNG/ICO fallbacks for browsers without SVG favicon support.
      { url: '/favicons/favicon-light-mode-32.png', sizes: '32x32', type: 'image/png', media: light },
      { url: '/favicons/favicon-dark-mode-32.png', sizes: '32x32', type: 'image/png', media: dark },
      { url: '/favicons/favicon-light-mode.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/favicons/apple-touch-icon-light-mode.png', sizes: '180x180', media: light },
      { url: '/favicons/apple-touch-icon-dark-mode.png', sizes: '180x180', media: dark },
    ],
  },
  // Added to an iPhone home screen, it opens full-screen like an app, named
  // "Alexis's Guide" under the icon.
  appleWebApp: {
    capable: true,
    title: "Alexis's Guide",
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  // viewport-fit=cover lets the page use the full screen in home-screen mode;
  // the layout already pads for the notch/home bar with safe-area insets.
  viewportFit: 'cover',
  // Browser UI (Safari's bars, Android's status bar) matches the page
  // background rather than the logo, so the chrome blends into the app.
  themeColor: [
    { media: light, color: '#EBEBEB' },
    { media: dark, color: '#23262b' },
  ],
}

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The init script sets data-theme before React hydrates (to avoid a
    // flash of the wrong theme), so the attribute legitimately differs from
    // the server HTML — suppressHydrationWarning covers only this element.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
