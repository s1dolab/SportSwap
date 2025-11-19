import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ComingSoon from './pages/ComingSoon'
import AuthPage from './pages/AuthPage'
import CreateListingPage from './pages/CreateListingPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailPage from './pages/ListingDetailPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/favorites" element={<ComingSoon title="My Favorites" />} />
            <Route path="/messages" element={<ComingSoon title="Messages" />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
