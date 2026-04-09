import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './app/AppLayout';
import HomeRedirect from './pages/HomeRedirect';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

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
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/preferences"
          element={<Placeholder title="Roommate preferences" />}
        />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
