'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface ExerciseAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Common exercises list
const COMMON_EXERCISES = [
  // Upper Body
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Press',
  'Overhead Press', 'Shoulder Press', 'Lateral Raises', 'Front Raises',
  'Cable Flyes', 'Push-ups', 'Dips', 'Tricep Extensions', 'Tricep Dips',
  'Bicep Curls', 'Hammer Curls', 'Preacher Curls', 'Pull-ups', 'Chin-ups',
  'Lat Pulldowns', 'Rows', 'Bent Over Rows', 'T-Bar Rows', 'Cable Rows',
  'Face Pulls', 'Rear Delt Flyes', 'Shrugs', 'Upright Rows',
  
  // Lower Body
  'Squat', 'Back Squat', 'Front Squat', 'Bulgarian Split Squat', 'Leg Press',
  'Romanian Deadlift', 'Deadlift', 'Sumo Deadlift', 'Conventional Deadlift',
  'Lunges', 'Walking Lunges', 'Leg Curls', 'Leg Extensions', 'Calf Raises',
  'Hip Thrusts', 'Glute Bridges', 'Good Mornings', 'Stiff Leg Deadlift',
  
  // Core
  'Plank', 'Side Plank', 'Russian Twists', 'Crunches', 'Sit-ups',
  'Leg Raises', 'Hanging Leg Raises', 'Ab Wheel', 'Mountain Climbers',
  
  // Full Body / Compound
  'Clean', 'Snatch', 'Power Clean', 'Thruster', 'Burpees',
  'Kettlebell Swings', 'Turkish Get-ups',
  
  // Cardio / Conditioning
  'Running', 'Sprinting', 'Rowing', 'Cycling', 'Jump Rope',
  
  // Accessory
  'Farmer\'s Walk', 'Suitcase Carry', 'Pallof Press', 'Cable Crunches',
].sort()

export function ExerciseAutocomplete({ value, onChange, placeholder = 'e.g., Bench Press', className = '' }: ExerciseAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim()) {
      const filtered = COMMON_EXERCISES.filter(exercise =>
        exercise.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8) // Show max 8 suggestions
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSelect = (exercise: string) => {
    onChange(exercise)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
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
          if (suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        placeholder={placeholder}
        className={className || 'input-field w-full'}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
        >
          {suggestions.map((exercise, index) => (
            <button
              key={exercise}
              type="button"
              onClick={() => handleSelect(exercise)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${
                index === selectedIndex ? 'bg-gray-800' : ''
              } ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <span className="text-white font-medium">{exercise}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

