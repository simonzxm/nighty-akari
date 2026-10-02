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
    play: 'Play',
    resume: 'Resume',
    optimalGoal: 'Optimal Moves',
    // In game errors / notifications (subtle, non-intrusive)
    errSeedPermanent: 'The initial star light (✦) cannot be extinguished.',
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
    playPuzzle: 'Play',
    // How to Play modal
    rulesTitle: 'Rules of the Night',
    rulesGoal: 'Objective: Illuminate every white square while satisfying all numbered blocks.',
    rule1Title: 'Cross Beams',
    rule1Desc: 'Lights cast beams horizontally and vertically across white squares until blocked by a dark wall or grid edge. Beams pass freely through other lights.',
    rule2Title: 'Relay Placement',
    rule2Desc: 'You can only place a new light on an already illuminated square. Use existing light to scaffold and relay deeper into the darkness.',
    rule3Title: 'Strict Capacity Ceiling',
    rule3Desc: 'The number on a dark block is both the final goal and a hard upper limit. The number of lights shining directly into it can NEVER exceed this limit at any moment.',
    rule4Title: 'Extinguish & Bridge',
    rule4Desc: 'Click an existing light to extinguish it, releasing capacity for the blocks along its path. Place temporary lights to reach far spots, then extinguish them to clear bottlenecks.',
    rule5Title: 'Permanent Seed Light',
    rule5Desc: 'The white star (✦) is the permanent starting seed. It cannot be extinguished.',
    rule6Title: 'Victory',
    rule6Desc: 'Illuminate every white square while all numbered blocks are simultaneously and exactly satisfied.',
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
    play: '开始挑战',
    resume: '继续游戏',
    optimalGoal: '理论最少步数',
    // In game errors
    errSeedPermanent: '初始星芒起始灯（✦）无法熄灭。',
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
    playPuzzle: '开始挑战',
    // How to Play modal
    rulesTitle: '游戏规则 · 光的接力',
    rulesGoal: '目标：照亮所有白色格子，并恰好满足所有黑块上的数字。',
    rule1Title: '十字直射',
    rule1Desc: '灯沿横向和纵向投射直线光芒，穿透白格与其他灯，直至被黑块或棋盘边界阻挡。',
    rule2Title: '借光放灯',
    rule2Desc: '只能在「当前已被照亮」的白格上放置新灯。通过现有光芒，一步步将光路接力延伸至死角。',
    rule3Title: '严苛容量上限',
    rule3Desc: '黑块上的数字既是目标，也是绝对上限。任何时候照射到该黑块的灯数均不能超过此数字（超限操作会被拦截）。',
    rule4Title: '熄灯与过桥',
    rule4Desc: '点击已放置的灯可将其熄灭，释放它占用的黑块容量。先放临时过渡灯开辟远方灯位，待远方灯建立后及时熄灭过渡灯（过桥拆桥），是核心解谜技巧。',
    rule5Title: '永久起始光种',
    rule5Desc: '棋盘上的纯白星芒（✦）为初始给定的永久光源，无法熄灭。',
    rule6Title: '通关条件',
    rule6Desc: '当所有白格全部亮起，且每个黑块上的数字都恰好满足时，即可通关！',
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
