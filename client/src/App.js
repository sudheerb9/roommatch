import { useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import './pages/Pages.css';

function App() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="App">
      {activePage === 'home' && (
        <HomePage onLoginClick={() => setActivePage('login')} />
      )}
      {activePage === 'login' && (
        <LoginPage onBack={() => setActivePage('home')} />
      )}
    </div>
  );
}

export default App;
