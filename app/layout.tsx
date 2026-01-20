import './globals.css'

export const metadata = {
  title: 'USC Dining Ratings',
  description: 'Rate USC dining hall meals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
