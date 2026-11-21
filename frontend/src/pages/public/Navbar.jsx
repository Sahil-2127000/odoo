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
  const boxStyle = transparent
    ? 'border-white/60 hover:bg-white hover:text-slate-900'
    : 'border-slate-900 hover:bg-slate-900 hover:text-white'

  const staffLink = isAuthenticated ? homePath : '/login'
  const staffText = isAuthenticated ? 'Dashboard' : 'Staff login'

  return (
    <header className={`${onHome ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 transition-colors duration-300 ${barStyle}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-3xl font-extrabold uppercase">
          <Sun className="h-6 w-6 text-amber-400" />
          SolarConnect
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-9 text-[15px] font-semibold lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-amber-400">
              {link.label}
            </a>
          ))}
          <Link to="/track" className={pathname === '/track' ? 'text-amber-500' : 'hover:text-amber-400'}>
            Track my order
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-5">
          <Link to={staffLink} className="hidden text-[15px] font-semibold hover:text-amber-400 sm:block">
            {staffText}
          </Link>
          <a href="/#enquiry" className={`hidden h-12 items-center gap-3 border px-5 text-[15px] font-semibold transition-colors sm:flex ${boxStyle}`}>
            Get a quote <span>→</span>
          </a>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-2 lg:hidden" aria-label="Open menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-5 pb-6 lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-slate-100 py-4 font-display text-3xl font-extrabold uppercase"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/track"
            onClick={() => setMenuOpen(false)}
            className="block border-b border-slate-100 py-4 font-display text-3xl font-extrabold uppercase"
          >
            Track my order
          </Link>
          <Link to={staffLink} className="mt-6 flex h-12 items-center justify-center bg-amber-400 font-semibold text-slate-950">
            {staffText}
          </Link>
        </nav>
      )}
    </header>
  )
}
