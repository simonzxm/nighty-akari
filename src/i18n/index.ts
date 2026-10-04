import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: 'Nighty Akari',
    tagline: 'Light up the night with moonlight.',
    dailyNo: (no: number) => `No. ${no}`,
    archive: 'Archive',
    howToPlay: 'How to Play',
    about: 'About',
    restart: 'Restart',
    undo: 'Undo',
    clearConfirm: 'Reset this puzzle?',
    clearKeepsTime: 'The board and moves will reset. Your elapsed time will be kept.',
    clearYes: 'Reset',
    clearCancel: 'Cancel',
    play: 'Play',
    resume: 'Resume',
    playAgain: 'Play Again',
    optimalGoal: 'Optimal Moves',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    // Difficulty
    difficultyLabel: 'Difficulty',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    // In game errors / notifications (subtle, non-intrusive)
    errSeedPermanent: 'The initial celestial moon cannot be extinguished.',
    errNotLit: 'You can only place a light on an illuminated square.',
    errWallLimit: (r: number, c: number, limit: string) =>
      `Exceeds limit on block (${r}, ${c}) [max ${limit}].`,
    // Victory & Sharing
    victoryTitle: 'Night Illuminated',
    victoryOptimal: 'Optimal Solution Reached!',
    victoryGood: 'Puzzle Cleared!',
    timeLabel: 'Time',
    movesLabel: 'Moves',
    optimalLabel: 'Optimal',
    copyResult: 'Copy Result',
    copiedNotice: 'Result copied to clipboard!',
    previouslySolved: 'Previously Solved',
    shareText: (no: number, date: string, time: string, moves: number, optimal: number, url: string) =>
      `Nighty Akari No. ${no} (${date})\nTime: ${time}\nMoves: ${moves} (Optimal: ${optimal})\n${url}`,
    // Archive
    archiveTitle: 'Past Puzzles',
    archiveStatusSolved: 'Solved',
    archiveStatusUnsolved: 'Unsolved',
    archiveFutureLocked: 'Available on release date',
    perfectBadge: 'Perfect',
    clearedBadge: 'Cleared',
    playPuzzle: 'Play',
    // How to Play modal
    rulesTitle: 'Game Rules',
    rulesGoal: 'Objective: Illuminate every white square while ensuring each numbered block is hit by exactly that number of light beams.',
    rule1Title: 'Cross Beams',
    rule1Desc: 'Lamps cast straight beams horizontally and vertically, passing through other lamps until blocked by a dark block or the grid edge.',
    rule2Title: 'Borrowing Light',
    rule2Desc: 'You can only place a new lamp on a square that is currently illuminated. Use existing light to relay into the darkness.',
    rule3Title: 'Block Limits & Targets',
    rule3Desc: 'The number on a dark block is the total count of light beams shining into it (from all lamps in its row and column). Beams hitting a block can never exceed its number at any point, and must exactly match it to win.',
    rule4Title: 'Extinguish & Scaffold',
    rule4Desc: 'Click an existing lamp to extinguish it, reclaiming beams and freeing block capacity. Place temporary lamps to reach distant areas, then extinguish them once new footholds are established.',
    rule5Title: 'Permanent Celestial Moon',
    rule5Desc: 'The pure white celestial moon is the starting light source. It remains permanently lit and cannot be extinguished.',
    // Settings / Lang
    language: 'Language',
    close: 'Close',
  },
  zh: {
    appTitle: 'Nighty Akari',
    tagline: '借一弯月色，点亮静谧之夜。',
    dailyNo: (no: number) => `第 ${no} 期`,
    archive: '往期题目',
    howToPlay: '玩法说明',
    about: '关于',
    restart: '重置',
    undo: '撤销',
    clearConfirm: '确定重新开始这关吗？',
    clearKeepsTime: '棋盘和步数将重置，累计用时保留。',
    clearYes: '重开',
    clearCancel: '取消',
    play: '开始挑战',
    resume: '继续游戏',
    playAgain: '再玩一遍',
    optimalGoal: '理论最少步数',
    inProgress: '挑战中',
    notStarted: '未挑战',
    // Difficulty
    difficultyLabel: '难度',
    difficultyEasy: '简单',
    difficultyMedium: '中等',
    difficultyHard: '困难',
    // In game errors
    errSeedPermanent: '初始月亮光源无法熄灭。',
    errNotLit: '只能在已被光线照亮的格子上放灯。',
    errWallLimit: (r: number, c: number, limit: string) =>
      `第 ${r} 行第 ${c} 列的黑块超限（上限 ${limit}）。`,
    // Victory & Sharing
    victoryTitle: '夜色已全部照亮',
    victoryOptimal: '完美达成最短解！',
    victoryGood: '顺利通关！',
    timeLabel: '用时',
    movesLabel: '步数',
    optimalLabel: '最优解',
    copyResult: '复制结果',
    copiedNotice: '战报已复制到剪贴板！',
    previouslySolved: '已通关纪录',
    shareText: (no: number, date: string, time: string, moves: number, optimal: number, url: string) =>
      `Nighty Akari No. ${no} (${date})\n用时: ${time}\n步数: ${moves} (最优: ${optimal})\n${url}`,
    // Archive
    archiveTitle: '往期谜题',
    archiveStatusSolved: '已通关',
    archiveStatusUnsolved: '未挑战',
    archiveFutureLocked: '待解锁',
    perfectBadge: '完美',
    clearedBadge: '已通关',
    playPuzzle: '开始挑战',
    // How to Play modal
    rulesTitle: '游戏规则',
    rulesGoal: '核心目标：照亮所有白色格子，并让每个黑块射入的光线数量恰好等于其标明的数字。',
    rule1Title: '十字光束',
    rule1Desc: '灯泡会向上下左右四个方向射出直线光束，能穿透其他灯泡，直到被黑块或棋盘边界阻挡。',
    rule2Title: '借光放灯',
    rule2Desc: '新灯只能放在当前已被光芒照亮的白格上。通过现有的光一步步向四周接力延伸。',
    rule3Title: '黑块上限与目标',
    rule3Desc: '黑块上的数字代表直射到该黑块的光线总数（来自同行同列所有朝向它的灯）。任何时刻射入的光线都不能超过该数字；通关时必须恰好等于该数字。',
    rule4Title: '熄灯与拆桥',
    rule4Desc: '点击已放置的灯可以将其熄灭，撤回光线并释放黑块容量。可以先放临时灯把光引到远方，待远方点亮新灯后，再熄灭过渡灯。',
    rule5Title: '初始永久月亮',
    rule5Desc: '棋盘上的纯白月亮是关卡初始自带的起点光源，长亮且无法熄灭。',
    // Settings / Lang
    language: '语言',
    close: '关闭',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)['en'];
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('nighty_akari_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('nighty_akari_lang', newLang);
  };

  const t = translations[lang];

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
