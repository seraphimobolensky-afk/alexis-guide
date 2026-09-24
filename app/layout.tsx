import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Alexis's Guide",
  description: 'A guide to living alone — from Sera',
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
