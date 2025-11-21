import { useState } from 'react'

function FilterSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="pt-6 border-t border-gray-200 first:pt-0 first:border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 hover:text-blue-600 transition"
      >
        <h3 className="font-medium">{title}</h3>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  )
}

export default FilterSection
