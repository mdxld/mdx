import './globals.css'

export const metadata = {
  title: 'MDXE - MDX Development Environment',
  description: 'Full-stack MDX development environment with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  )
}
