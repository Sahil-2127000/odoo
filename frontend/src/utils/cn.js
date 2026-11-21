import clsx from 'clsx'

/** Join class names conditionally: cn('a', cond && 'b') */
export const cn = (...args) => clsx(...args)
