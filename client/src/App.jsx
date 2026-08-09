import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import TestConnection from './pages/TestConnection.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CompanyDetail from './copy_paste_bundle/CompanyDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<TestConnection />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/company/:symbol" element={<CompanyDetail />} />
    </Routes>
  );
}

export default App;