import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwasthSetu',
  description: 'SwasthSetu',
  generator: 'SwasthSetu',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
