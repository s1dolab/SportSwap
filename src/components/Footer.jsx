import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Help */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Browse */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Browse</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse?category=basketball" className="hover:text-white transition">
                  Basketball
                </Link>
              </li>
              <li>
                <Link to="/browse?category=soccer" className="hover:text-white transition">
                  Soccer
                </Link>
              </li>
              <li>
                <Link to="/browse?category=swimming" className="hover:text-white transition">
                  Swimming
                </Link>
              </li>
              <li>
                <Link to="/browse?category=tennis" className="hover:text-white transition">
                  Tennis
                </Link>
              </li>
              <li>
                <Link to="/browse?category=volleyball" className="hover:text-white transition">
                  Volleyball
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 SportSwap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
