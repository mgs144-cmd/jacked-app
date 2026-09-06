'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchExerciseCatalog } from '@/lib/exerciseCatalog'
import {
  filterExerciseSuggestions,
  mergeExerciseNameList,
  normalizeExerciseKey,
  type ExerciseCatalogEntry,
} from '@/lib/exercises'

interface ExerciseAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  userId?: string
  recentExerciseNames?: string[]
}

export function ExerciseAutocomplete({
  value,
  onChange,
  placeholder = 'e.g., Bench Press',
  className = '',
  userId,
  recentExerciseNames = [],
}: ExerciseAutocompleteProps) {
  const [catalog, setCatalog] = useState<ExerciseCatalogEntry[]>([])
  const [suggestions, setSuggestions] = useState<ExerciseCatalogEntry[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const skipOpenOnFocusRef = useRef(false)

  const allExercises = useMemo(
    () => mergeExerciseNameList(catalog, recentExerciseNames),
    [catalog, recentExerciseNames]
  )

  const refreshSuggestions = useCallback(
    (query: string, allowShow: boolean) => {
      const filtered = filterExerciseSuggestions(allExercises, query)
      setSuggestions(filtered)
      setSelectedIndex(-1)
      if (!allowShow || filtered.length === 0) {
        setShowSuggestions(false)
        return
      }
      const exact = allExercises.some((e) => normalizeExerciseKey(e.name) === normalizeExerciseKey(query))
      setShowSuggestions(!exact)
    },
    [allExercises]
  )

  useEffect(() => {
    if (!userId) {
      setCatalog(mergeExerciseNameList([], recentExerciseNames))
      return
    }
    const supabase = createClient()
    fetchExerciseCatalog(supabase, userId).then(setCatalog)
  }, [userId])

  useEffect(() => {
    if (skipOpenOnFocusRef.current) {
      skipOpenOnFocusRef.current = false
      setShowSuggestions(false)
      return
    }
    const focused = document.activeElement === inputRef.current
    refreshSuggestions(value, focused)
  }, [value, allExercises, refreshSuggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSelect = (exercise: string) => {
    skipOpenOnFocusRef.current = true
    onChange(exercise)
    setShowSuggestions(false)
    setSuggestions([])
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && showSuggestions && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex].name)
      return
    }
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (skipOpenOnFocusRef.current) return
          refreshSuggestions(value, true)
        }}
        onBlur={() => {
          window.setTimeout(() => setShowSuggestions(false), 120)
        }}
        placeholder={placeholder}
        className={className || 'input-field w-full'}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="exercise-suggestions" role="listbox">
          {suggestions.map((entry, index) => (
            <button
              key={entry.name}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(entry.name)}
              className={`exercise-suggestion-item ${index === selectedIndex ? 'is-active' : ''}`}
            >
              <span>{entry.name}</span>
              {entry.logging_mode === 'prime_range' && (
                <span className="exercise-suggestion-tag">Prime</span>
              )}
            </button>
          ))}
          {!allExercises.some((e) => normalizeExerciseKey(e.name) === normalizeExerciseKey(value)) &&
            value.trim().length > 0 && (
              <p className="exercise-suggestion-hint px-4 py-2 border-t border-white/[0.06]">
                Press enter or finish logging to save &ldquo;{value.trim()}&rdquo; as a new exercise
              </p>
            )}
        </div>
      )}
    </div>
  )
}
