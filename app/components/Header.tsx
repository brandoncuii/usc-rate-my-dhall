import Link from 'next/link'
import UserNav from './UserNav'

export default function Header() {
  return (
    <header className="bg-[#990000] text-white py-3 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold hover:opacity-90 transition-opacity">
            <span className="text-[#FFCC00]">USC</span>RateMyPlate
          </Link>
          <span className="text-white/40">|</span>
          <Link
            href="/all-menu-items"
            className="text-sm text-white hover:text-white/80 underline underline-offset-2 transition-colors"
          >
            Previous Menu Items
          </Link>
          <Link
            href="/my-ratings"
            className="text-sm text-white hover:text-white/80 underline underline-offset-2 transition-colors"
          >
            My Ratings
          </Link>
        </div>
        <UserNav />
      </div>
    </header>
  )
}
