import './globals.css'
import { AuthProvider } from './components/AuthProvider'

export const metadata = {
  title: 'USC Dining Ratings',
  description: 'Rate USC dining hall meals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
