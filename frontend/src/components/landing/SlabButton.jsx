import { Link } from 'react-router-dom'

// Colour styles for the button.
const STYLES = {
  solid: 'bg-primary-500 text-white hover:bg-primary-600',
  dark: 'bg-slate-900 text-white hover:bg-slate-700',
  outline: 'border border-white/60 text-white hover:bg-white hover:text-slate-900',
}

/**
 * Square button with an arrow, used on the landing page.
 *   <SlabButton href="#enquiry">Get a free quote</SlabButton>   -> link on the same page
 *   <SlabButton to="/track">Track my order</SlabButton>         -> link to another page
 *   <SlabButton type="submit">Send</SlabButton>                 -> normal button
 */
export default function SlabButton({ to, href, variant = 'solid', className = '', children, ...props }) {
  const classes = `group inline-flex h-12 items-center justify-between gap-4 px-6 text-sm font-semibold transition-colors disabled:opacity-60 ${STYLES[variant]} ${className}`

  const content = (
    <>
      <span>{children}</span>
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </>
  )

  if (to) {
    return <Link to={to} className={classes}>{content}</Link>
  }
  if (href) {
    return <a href={href} className={classes}>{content}</a>
  }
  return <button className={classes} {...props}>{content}</button>
}
