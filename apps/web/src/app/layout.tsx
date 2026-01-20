// Root Layout - This wraps around all pages in your app
// Think of it as the master template for your entire website

import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

// Metadata shown in browser tab and search engines
export const metadata: Metadata = {
  title: 'HoopMarket - NBA Stock Trading Platform',
  description: 'Trade NBA player stocks based on real-time performance metrics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* AuthProvider makes authentication available throughout the app */}
        <AuthProvider>
          {/* This is where your page content will appear */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

