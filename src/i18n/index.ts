import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: 'Nighty Akari',
    tagline: 'Light up the night.',
    dailyNo: (no: number) => `No. ${no}`,
    archive: 'Archive',
    howToPlay: 'How to Play',
    about: 'About',
    restart: 'Restart',
    undo: 'Undo',
    clearConfirm: 'Reset this puzzle?',
    clearYes: 'Reset',
    clearCancel: 'Cancel',
    // In game errors / notifications (subtle, non-intrusive)
    errSeedPermanent: 'The initial seed light cannot be extinguished.',
    errNotLit: 'You can only place a light on an illuminated square.',
    errWallLimit: (r: number, c: number, limit: string) =>
      `Exceeds limit on block (${r}, ${c}) [max ${limit}].`,
    // Victory & Sharing
    victoryTitle: 'Night Illuminated',
    victoryOptimal: 'Optimal Solution Reached',
    victoryGood: 'Puzzle Cleared',
    timeLabel: 'Time',
    movesLabel: 'Moves',
    optimalLabel: 'Optimal',
    copyResult: 'Copy Result',
    copiedNotice: 'Result copied to clipboard!',
    shareText: (no: number, date: string, time: string, moves: number, optimal: number, url: string) =>
      `Nighty Akari No. ${no} (${date})\nTime: ${time}\nMoves: ${moves} (Optimal: ${optimal})\n${url}`,
    // Archive
    archiveTitle: 'Past Puzzles',
    archiveStatusSolved: 'Solved',
    archiveStatusUnsolved: 'Unsolved',
    playPuzzle: 'Play',
    // How to Play modal
    rulesTitle: 'How to Play Nighty Akari',
    rulesGoal: 'Goal: Illuminate all white squares and satisfy all numbered blocks.',
    rule1: '1. Light Beams: Lights shine horizontally and vertically across white squares until blocked by a dark wall or grid edge.',
    rule2: '2. Relay Placement: You can only place a new light on an already illuminated square. Lights can shine through each other.',
    rule3: '3. Capacity Limits: Numbers on dark blocks indicate exactly how many lights must shine directly into that block. Light rays hitting that block can NEVER exceed this limit.',
    rule4: '4. Extinguish & Bridge: Click an existing light to extinguish it. Use temporary lights to reach far corners, then extinguish them to free up wall capacity for other paths.',
    rule5: '5. Seed Light: The initial star light (✳) cannot be extinguished.',
    // Settings / Lang
    language: 'Language',
    close: 'Close',
  },
  zh: {
    appTitle: 'Nighty Akari',
    tagline: '点亮静谧之夜。',
    dailyNo: (no: number) => `第 ${no} 期`,
    archive: '往期题目',
    howToPlay: '玩法说明',
    about: '关于',
    restart: '重置',
    undo: '撤销',
    clearConfirm: '确定重新开始这关吗？',
    clearYes: '重开',
    clearCancel: '取消',
    // In game errors
    errSeedPermanent: '初始的起始灯无法熄灭。',
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
    shareText: (no: number, date: string, time: string, moves: number, optimal: number, url: string) =>
      `Nighty Akari No. ${no} (${date})\n用时: ${time}\n步数: ${moves} (最优: ${optimal})\n${url}`,
    // Archive
    archiveTitle: '往期谜题',
    archiveStatusSolved: '已通关',
    archiveStatusUnsolved: '未挑战',
    playPuzzle: '开始挑战',
    // How to Play modal
    rulesTitle: '游戏规则 · 光的接力',
    rulesGoal: '目标：照亮所有白色格子，并恰好满足所有黑块上的数字。',
    rule1: '1. 直射光线：灯沿横向和纵向投射光线，直到被黑块或边界挡住。',
    rule2: '2. 借光开路：只能在「已被照亮」的白格放灯。灯之间可以互相照亮。',
    rule3: '3. 黑块容量：黑块上的数字代表必须恰好照到它的灯数。任何时候照到它的灯都不能超过此数字！',
    rule4: '4. 过桥拆桥：点击已有的灯可以将其熄灭。利用临时灯把光送到远处后，及时熄灭它以释放黑块容量。',
    rule5: '5. 初始光种：带星芒标记（✳）的起始灯无法被熄灭。',
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
