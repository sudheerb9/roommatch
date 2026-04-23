import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import AppLayout from './app/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import HomeRedirect from './pages/HomeRedirect';
import ChatPage from './pages/ChatPage';
import MatchesPage from './pages/MatchesPage';
import PreferencesPage from './pages/PreferencesPage';
import ProfilePage from './pages/ProfilePage';
import './pages/Pages.css';

/** Marketing home + nested routes under `/home` (no app chrome). */
function HomeSection() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={<HomePage onLoginClick={() => navigate('/login')} />}
      />
      <Route
        path="login"
        element={<LoginPage onBack={() => navigate('/home')} />}
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  return <LoginPage onBack={() => navigate('/home')} />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/home/*" element={<HomeSection />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
