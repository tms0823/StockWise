import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import TestConnection from './pages/TestConnection.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stock from './pages/Stock.jsx';
import MarketOverview from './pages/MarketOverview.jsx';
import StockChart from './pages/StockChart.jsx';
import StockSearch from './pages/StockSearch.jsx';
import DummyInvestmentPage from './pages/DummyInvestmentPage.jsx';
import Portfolio from './pages/Portfolio.jsx';
import NewsExplainer from './pages/NewsExplainer.jsx';
import CueCards from './pages/CueCards.jsx';
import Quiz from './pages/Quiz.jsx';
import LearningDashboard from './pages/LearningDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CompanyDetail from './components/CompanyDetail.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<TestConnection />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/learn/cue-cards" element={<CueCards />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stocks"
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stocks/chart"
        element={
          <ProtectedRoute>
            <StockChart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/market-overview"
        element={
          <ProtectedRoute>
            <MarketOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <StockSearch />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dummy-investment"
        element={
          <ProtectedRoute>
            <DummyInvestmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        }
      />

      {/* Module 3 — Beginner Market News Explanation */}
      <Route
        path="/learn/news-explainer"
        element={
          <ProtectedRoute>
            <NewsExplainer />
          </ProtectedRoute>
        }
      />

      {/* Module 3 — Cue card quiz */}
      <Route
        path="/quiz/:topic"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />

      {/* Module 3 — Learning progress dashboard */}
      <Route
        path="/learn/progress"
        element={
          <ProtectedRoute>
            <LearningDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/:symbol"
        element={
          <ProtectedRoute>
            <CompanyDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;