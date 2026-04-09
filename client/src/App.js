import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import AppLayout from './app/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import HomeRedirect from './pages/HomeRedirect';
import PreferencesPage from './pages/PreferencesPage';
import ProfilePage from './pages/ProfilePage';
import './pages/Pages.css';

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage onLoginClick={() => navigate('/login')} />}
      />
      <Route
        path="/login"
        element={<LoginPage onBack={() => navigate('/')} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <div className="pageHeader">
        <h1 className="pageTitle">{title}</h1>
        <p className="pageSubtitle">
          Coming soon. This will be implemented in a separate PR.
        </p>
      </div>
      <div className="card">
        <p style={{ margin: 0, color: 'rgba(232, 238, 252, 0.72)' }}>
          Use the top navigation to switch pages.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/preferences"
            element={<Placeholder title="Roommate preferences" />}
          />
          <Route path="/chat" element={<Placeholder title="Chat" />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Route>
        <Route path="/home/*" element={<AppRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;
