import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import AppLayout from './app/AppLayout';
import ChatPage from './pages/ChatPage';
import GroupAllotmentPage from './pages/GroupAllotmentPage';
import GroupDetailPage from './pages/GroupDetailPage';
import GroupHousingPreferencesPage from './pages/GroupHousingPreferencesPage';
import GroupInvitationComposePage from './pages/GroupInvitationComposePage';
import GroupInvitationsInboxPage from './pages/GroupInvitationsInboxPage';
import GroupsPage from './pages/GroupsPage';
import HomePage from './pages/HomePage';
import GroupMatchesPage from './pages/GroupMatchesPage';
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
      <Route path="/" element={<HomeSection />} />
      <Route path="/login" element={<ProtectedLoginRoute />} />
      <Route path="/home/*" element={<HomeSection />} />
      {/* Routes wrapped by app chrome/navigation for signed-in experience. */}
      <Route element={<AppLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
        <Route path="/groups/:groupId/allotment" element={<GroupAllotmentPage />} />
        <Route path="/housing-units" element={<Navigate to="/groups" replace />} />
        <Route path="/group-housing" element={<Navigate to="/groups" replace />} />
        <Route path="/group-invitations" element={<Navigate to="/groups" replace />} />
        <Route path="/invitations" element={<GroupInvitationsInboxPage />} />
        <Route
          path="/groups/:groupId/invite"
          element={<GroupInvitationComposePage />}
        />
        <Route
          path="/groups/:groupId/housing-preferences"
          element={<GroupHousingPreferencesPage />}
        />
        <Route path="/groups/:groupId/matches" element={<GroupMatchesPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route
          path="/chat"
          element={
            isAuthenticated() ? <ChatPage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
