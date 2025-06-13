import React from 'react'
import { Layout } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head />
      <body>
        <Layout pageMap={await getPageMap()}>{children}</Layout>
      </body>
    </html>
  )
}
