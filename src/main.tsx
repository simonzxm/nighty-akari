import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadPuzzleIndex, loadPuzzle, PUZZLE_INDEX } from './data/puzzles';
import { cleanPuzzleStorage } from './utils/storage';
import { getDailyPuzzle } from './utils/daily';
import './index.css';

async function startGame(): Promise<void> {
  await loadPuzzleIndex();
  const daily = getDailyPuzzle();
  if (!daily) return;
  const initialPuzzle = await loadPuzzle(daily);
  cleanPuzzleStorage(PUZZLE_INDEX);
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App initialPuzzle={initialPuzzle} />
    </React.StrictMode>
  );
}

startGame().catch(error => console.error('Unable to load puzzles:', error));
