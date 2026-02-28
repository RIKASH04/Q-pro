import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'Q-Pro — Smart Queue Management Platform',
    description:
        'Q-Pro is a professional SaaS platform that helps hospitals, government offices, and public services manage digital queues with real-time updates and seamless public access.',
    keywords: ['queue management', 'digital queue', 'token system', 'hospital queue', 'government queue'],
    openGraph: {
        title: 'Q-Pro — Smart Queue Management Platform',
        description: 'Professional multi-tenant queue management for hospitals, government offices, and public services.',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    )
}
