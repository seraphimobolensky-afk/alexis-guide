import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Alexis's Guide",
  description: 'A guide to living alone — from Sera',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
