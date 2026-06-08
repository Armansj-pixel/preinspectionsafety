import './globals.css'

export const metadata = {
  title: 'Pre-Inspection Checklist | Elsewedy Winding',
  description: 'Pre-Inspection Checklist Crane & Forklift - PT Elsewedy Electric Indonesia Dept. Winding',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#f0a500',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Inspection" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
