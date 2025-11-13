import { Link } from 'react-router-dom'

function ComingSoon({ title = "Coming Soon" }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">
        This page is under construction and will be available in the next phase!
      </p>
      <Link
        to="/"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Back to Home
      </Link>
    </div>
  )
}

export default ComingSoon
