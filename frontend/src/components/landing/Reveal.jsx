import { motion } from 'framer-motion'

/**
 * Fades its content in and slides it up a little when it scrolls into view.
 *   <Reveal><h2>Title</h2></Reveal>
 * `delay` (in seconds) lets items in a list appear one after another.
 */
export default function Reveal({ delay = 0, className = '', children }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}
