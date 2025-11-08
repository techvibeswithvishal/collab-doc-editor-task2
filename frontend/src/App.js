import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import { v4 as uuidV4 } from 'uuid';

function HomeRedirect() {
  window.location.href = `/documents/${uuidV4()}`;
  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/documents/:id" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
