import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Sun } from 'lucide-react'
import { NAV_LINKS } from '@/components/landing/landingData'

// Footer for the public pages: about, links and contact details.
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-3">
        {/* About */}
        <div>
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <Sun className="h-6 w-6 text-primary-500" />
            SunPower Solutions
          </p>
          <p className="mt-4 text-sm leading-relaxed">
            Rooftop solar for homes and small factories. From the first enquiry to the 20-year warranty.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-sm font-semibold text-white">Explore</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-white">{link.label}</a>
              </li>
            ))}
            <li><Link to="/track" className="hover:text-white">Track my order</Link></li>
            <li><Link to="/login" className="hover:text-white">Staff login</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold text-white">Contact us</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary-500" /> +91 98765 43210</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary-500" /> hello@sunpower.example</li>
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary-500" /> Solar Tech Park, New Delhi</li>
          </ul>
          <p className="mt-4 text-xs">Mon to Sat, 9 am – 7 pm</p>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SunPower Solutions · Track your order at /track with your phone number and order ID.
      </div>
    </footer>
  )
}
