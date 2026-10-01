# Nighty Akari

A minimalist daily light relay puzzle inspired by Daily Akari's clean, pitch-black visual aesthetic, featuring a dynamic pathfinding and capacity-scheduling mechanic.

## Game Rules

1. **Light Beams**: Lights cast rays horizontally and vertically across white squares until blocked by a dark wall or grid edge.
2. **Relay Placement**: You can only place a new light on an already illuminated square. Lights can shine through each other.
3. **Wall Capacity**: Numbers on dark blocks indicate exactly how many lights must shine directly into that block. Light rays hitting that block can **never** exceed this limit.
4. **Extinguish & Scaffold**: Click any existing light to extinguish it. Use temporary lights to reach far corners, then extinguish them to free up wall capacity for subsequent paths.
5. **Initial Seed Light**: The star-marked bulb (✳) is permanent and cannot be extinguished.
6. **Victory Condition**: Illuminate all white squares and satisfy all numbered blocks simultaneously.

## Controls

- **Mouse / Touch**:
  - Click on an illuminated white square to place a light.
  - Click on an existing light to extinguish it.
  - Hover over a cell to preview light beams and wall hit transitions.
- **Keyboard Shortcuts**:
  - `Z` or `U`: Undo last move
  - `R`: Restart puzzle
  - `Esc`: Close modals

## Features

- **Daily Puzzles**: Curated daily challenge with past puzzle archive.
- **Optimal Benchmark**: BFS solver calculates the theoretical minimum moves for every puzzle.
- **Clean Dark Aesthetics**: Pitch-black interface focusing solely on the puzzle, with zero distracting in-game clutter.
- **Bilingual i18n**: Full Chinese (`zh`) and English (`en`) support with instant language switching.
- **Minimal Text Sharing**: One-click minimal text result copy to clipboard:
  ```text
  Nighty Akari No. 1 (2026-10-01)
  Time: 01:23
  Moves: 7 (Optimal: 7)
  https://<user>.github.io/nighty-akari/
  ```
- **Local Persistence**: Saves completed puzzles, moves, and time records to LocalStorage.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build locally
npm run preview
```

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the site to GitHub Pages whenever changes are pushed to `main`.

In your repository on GitHub:
1. Go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
3. Push to `main` branch to trigger automatic deployment.
