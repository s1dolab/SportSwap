import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordInput from '../components/PasswordInput'

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        if (!email || !password) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }
        await signIn(email, password)
        navigate('/')
      } else {
        // Register
        if (!email || !password || !confirmPassword || !username) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        if (username.length < 3) {
          setError('Username must be at least 3 characters')
          setLoading(false)
          return
        }

        // Check if username contains only allowed characters
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('Username can only contain letters, numbers, and underscores')
          setLoading(false)
          return
        }

        await signUp(email, password, username)
        setMessage('Account created successfully! Please check your email to verify your account.')

        // Clear form
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setUsername('')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setMessage('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setUsername('')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-center font-medium transition ${
              isLogin
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-center font-medium transition ${
              !isLogin
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Log In to Your Account' : 'Create Your Account'}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username (Register only) */}
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., johnsmith"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your public name (e.g., @{username || 'johnsmith'}). No spaces or special characters.
              </p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Switch Mode Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={switchMode}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isLogin ? 'Register here' : 'Log In here'}
          </button>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
