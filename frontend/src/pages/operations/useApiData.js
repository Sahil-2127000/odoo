import { useCallback, useEffect, useRef, useState } from 'react'

// Calls an api/operations function and tracks { data, loading, error, reload }.
// `key` re-runs the fetch when it changes (e.g. a search term or filter string).
export function useApiData(fetcher, key = '') {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    fetcherRef
      .current()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ data: null, loading: false, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [key, tick])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setTick((t) => t + 1)
  }, [])

  return { ...state, reload }
}
