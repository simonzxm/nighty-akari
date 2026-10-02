import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadPuzzles } from './data/puzzles';
import { getDailyPuzzle } from './utils/daily';
import './index.css';

loadPuzzles().then(() => {
  if (!getDailyPuzzle()) return;
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(error => console.error('Unable to load puzzles:', error));
