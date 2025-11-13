import { Link } from 'react-router-dom'
import { useState } from 'react'

function Header() {
  const [user, setUser] = useState(null) // We'll implement auth later

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              SportSwap
            </div>
          </Link>

          {/* Middle: Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <input
              type="text"
              placeholder="Search for sports equipment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-6">
            <Link to="/favorites" className="text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            <Link to="/messages" className="text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>

            <Link
              to="/listings/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Post an Ad
            </Link>

            {user ? (
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Log In / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Megamenu - We'll add this in Phase 2 */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 h-12 text-sm">
            <Link to="/browse" className="text-gray-700 hover:text-blue-600 font-medium">
              All Categories
            </Link>
            <Link to="/browse?category=basketball" className="text-gray-600 hover:text-blue-600">
              Basketball
            </Link>
            <Link to="/browse?category=soccer" className="text-gray-600 hover:text-blue-600">
              Soccer
            </Link>
            <Link to="/browse?category=swimming" className="text-gray-600 hover:text-blue-600">
              Swimming
            </Link>
            <Link to="/browse?category=tennis" className="text-gray-600 hover:text-blue-600">
              Tennis
            </Link>
            <Link to="/browse?category=volleyball" className="text-gray-600 hover:text-blue-600">
              Volleyball
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
