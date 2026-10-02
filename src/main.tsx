import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadPuzzleIndex, loadPuzzle } from './data/puzzles';
import { getDailyPuzzle } from './utils/daily';
import './index.css';

async function startGame(): Promise<void> {
  await loadPuzzleIndex();
  const daily = getDailyPuzzle();
  if (!daily) return;
  const initialPuzzle = await loadPuzzle(daily);
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App initialPuzzle={initialPuzzle} />
    </React.StrictMode>
  );
}

startGame().catch(error => console.error('Unable to load puzzles:', error));
