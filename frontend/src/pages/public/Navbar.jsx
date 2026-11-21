import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_LINKS } from '@/components/landing/landingData'

// Top menu for the public pages (landing page and Track my order).
export default function Navbar() {
  const { pathname } = useLocation()
  const { isAuthenticated, homePath } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const onHome = pathname === '/'

  // Remember if the page has been scrolled down a little
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // On the home page the bar is see-through on top of the hero photo.
  const transparent = onHome && !scrolled && !menuOpen
  const barStyle = transparent
    ? 'bg-transparent text-white'
    : 'bg-white/95 text-slate-900 border-b border-slate-200 backdrop-blur'

  return (
    <header className={`${onHome ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 transition-colors ${barStyle}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Sun className="h-6 w-6 text-primary-500" />
          SunPower
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-500">
              {link.label}
            </a>
          ))}
          <Link to="/track" className={pathname === '/track' ? 'text-primary-500' : 'hover:text-primary-500'}>
            Track my order
          </Link>
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={isAuthenticated ? homePath : '/login'}
            className="hidden h-10 items-center bg-primary-500 px-4 text-sm font-semibold text-white hover:bg-primary-600 sm:flex"
          >
            {isAuthenticated ? 'Open dashboard' : 'Staff login'}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 lg:hidden"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 pb-6 lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-slate-100 py-4 text-lg font-semibold"
            >
              {link.label}
            </a>
          ))}
          <Link to="/track" onClick={() => setMenuOpen(false)} className="block border-b border-slate-100 py-4 text-lg font-semibold">
            Track my order
          </Link>
          <Link
            to={isAuthenticated ? homePath : '/login'}
            className="mt-6 flex h-12 items-center justify-center bg-primary-500 font-semibold text-white"
          >
            {isAuthenticated ? 'Open dashboard' : 'Staff login'}
          </Link>
        </nav>
      )}
    </header>
  )
}
