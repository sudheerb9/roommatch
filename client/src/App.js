import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import AppLayout from './app/AppLayout';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import HomeRedirect from './pages/HomeRedirect';
import LoginPage from './pages/LoginPage';
import MatchesPage from './pages/MatchesPage';
import './pages/Pages.css';
import PreferencesPage from './pages/PreferencesPage';
import ProfilePage from './pages/ProfilePage';
import { isAuthenticated } from './utils/authHelper';

/** Marketing home + nested routes under `/home` (no app chrome). */
function HomeSection() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <HomePage
            onLoginClick={() => {
              if (isAuthenticated()) {
                navigate('/profile');
              } else {
                navigate('/login');
              }
            }}
          />
        }
      />
      <Route
        path="login"
        element={
          isAuthenticated() ? (
            <Navigate to="/profile" replace />
          ) : (
            <LoginPage onBack={() => navigate('/home')} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function ProtectedLoginRoute() {
  const navigate = useNavigate();
  // If already authenticated, redirect to profile
  if (isAuthenticated()) {
    return <Navigate to="/profile" replace />;
  }
  return <LoginPage onBack={() => navigate('/home')} />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<ProtectedLoginRoute />} />
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
