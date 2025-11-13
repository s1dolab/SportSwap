import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ComingSoon from './pages/ComingSoon'

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<ComingSoon title="Browse Listings" />} />
            <Route path="/listings/new" element={<ComingSoon title="Create Listing" />} />
            <Route path="/favorites" element={<ComingSoon title="My Favorites" />} />
            <Route path="/messages" element={<ComingSoon title="Messages" />} />
            <Route path="/auth" element={<ComingSoon title="Login / Register" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
