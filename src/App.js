import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './styles/app.scss';

import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>📚 Трекер обучения и прогресса по курсам</h1>
          <p>Отслеживайте свой прогресс в обучении</p>
        </header>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
