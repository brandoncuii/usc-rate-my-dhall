'use client'

import { useState } from 'react'

interface DishCardProps {
  name: string
  ingredients: string[]
}

export default function DishCard({ name, ingredients }: DishCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800">{name}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && ingredients.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-2 mb-2">Ingredients</p>
          <ul className="space-y-1">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#990000] rounded-full flex-shrink-0"></span>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
