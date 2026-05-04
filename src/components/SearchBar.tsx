import { useEffect, useRef, useState } from 'react'
import { completeAddress, searchAddress } from '../services/geocoding'
import type { AddressSuggestion } from '../types'
import './SearchBar.css'

interface Props {
  onSelect: (suggestion: AddressSuggestion) => void
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const blurTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([])
      return
    }
    const handle = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        let res = await completeAddress(query, ctrl.signal)
        // Fallback to /search if completion returns nothing (more permissive)
        if (res.length === 0) {
          res = await searchAddress(query, ctrl.signal)
        }
        setSuggestions(res)
        setHighlight(-1)
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          console.error(err)
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query])

  const choose = (s: AddressSuggestion) => {
    setQuery(s.label)
    setOpen(false)
    setSuggestions([])
    onSelect(s)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = highlight >= 0 ? highlight : 0
      if (suggestions[idx]) choose(suggestions[idx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="searchbar">
      <div className="searchbar-input-wrap">
        <svg className="searchbar-icon" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
          />
        </svg>
        <input
          type="text"
          value={query}
          placeholder="Rechercher une adresse en France…"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <div className="searchbar-spinner" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="searchbar-suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lon}-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={i === highlight ? 'is-highlighted' : ''}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
                choose(s)
              }}
            >
              <div className="suggestion-main">{s.label}</div>
              {(s.postcode || s.city) && (
                <div className="suggestion-sub">
                  {[s.postcode, s.city].filter(Boolean).join(' · ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
