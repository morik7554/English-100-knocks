import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { grammarQuestionSets } from './data/grammarQuestionSets';
import { basicSentences } from './data/basicSentences';

const GAME_DURATION = 60;
const MAX_Q_POINTS = 150;
const MIN_Q_POINTS = 50;
const PENALTY_UNIT_MS = 750;
const PENALTY_PER_UNIT = 5;
const COMBO_BONUS = 2;
const MAX_COMBO = 20;

const STORAGE_KEY = 'english_knock_v3_local_data';

const MODE_COPY = {
  training: {
    title: 'トレーニング',
    description: '学年ごとの文法単元を選んで、いつもの並べ替えで練習します。',
    accent: 'from-indigo-600 to-sky-500',
    icon: '⚡',
  },
  review: {
    title: '総復習',
    description: '学年の文法をまとめてランダム出題します。',
    accent: 'from-emerald-500 to-teal-500',
    icon: '🧠',
  },
  basic: {
    title: '基本文',
    description: '中学英語の基本文を学年別に練習します。',
    accent: 'from-amber-500 to-orange-500',
    icon: '📘',
  },
};

const BASIC_SCOPE_ITEMS = [
  { key: '基本文 1年', gradeLabel: '1年', title: '1年の基本文' },
  { key: '基本文 2年', gradeLabel: '2年', title: '2年の基本文' },
  { key: '基本文 3年', gradeLabel: '3年', title: '3年の基本文' },
  { key: '基本文 全学年', gradeLabel: '全学年', title: '全学年の基本文' },
];

const PRAISE_MESSAGES = ['ABSOLUTE LEGEND!', 'GOD-TIER SKILLS!', 'PERFECT MASTERY!', 'UNSTOPPABLE!', 'HALL OF FAMER!'];

const RANKS = [
  { min: 0, label: 'ノック練習生', color: '#94a3b8', icon: '🌱' },
  { min: 3000, label: '期待の新星', color: '#10b981', icon: '✨' },
  { min: 12000, label: '英語レギュラー', color: '#3b82f6', icon: '⚾' },
  { min: 40000, label: '文法職人', color: '#6366f1', icon: '🛠️' },
  { min: 100000, label: 'ノックのエース', color: '#a855f7', icon: '👑' },
  { min: 250000, label: 'ノックの神様', color: '#fbbf24', icon: '☀️' },
];

const Icons = {
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Trophy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  Crown: () => <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" /></svg>,
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>,
};

const reviewQuestionSets = buildReviewQuestionSets(grammarQuestionSets);
const basicQuestionSets = buildBasicQuestionSets(basicSentences);
const allQuestionSets = {
  ...grammarQuestionSets,
  ...reviewQuestionSets,
  ...basicQuestionSets,
};

export default function App() {
  const [nickname, setNickname] = useState('');
  const [screen, setScreen] = useState('LOADING');
  const [flowType, setFlowType] = useState('play');
  const [selectedMode, setSelectedMode] = useState('training');
  const [selectedGrade, setSelectedGrade] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [rankViewCategory, setRankViewCategory] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [resultSummary, setResultSummary] = useState({ correctCount: 0, totalCount: 0, accuracy: 0 });

  const [localData, setLocalData] = useState({
    nickname: '',
    totalScore: 0,
    totalAttempts: 0,
    totalBestScore: 0,
    highScores: {},
    history: []
  });

  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [sessionScore, setSessionScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [userWords, setUserWords] = useState([]);
  const [selectableWords, setSelectableWords] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [qStartTime, setQStartTime] = useState(0);

  const [nativeVoice, setNativeVoice] = useState(null);
  useEffect(() => {
    const initVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const best = voices.find((v) => v.name.includes('Google US English')) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices[0];
      setNativeVoice(best);
    };
    window.speechSynthesis.onvoiceschanged = initVoice;
    initVoice();
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/ \./g, '.').replace(/ \?/g, '?');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (nativeVoice) utterance.voice = nativeVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [nativeVoice]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setLocalData(parsed);
      if (parsed.nickname) {
        setNickname(parsed.nickname);
        setScreen('TITLE');
      } else {
        setScreen('NICKNAME');
      }
    } else {
      setScreen('NICKNAME');
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveToLocal = (newData) => {
    setLocalData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const currentRankInfo = useMemo(() => {
    return [...RANKS].reverse().find((rank) => localData.totalScore >= rank.min) || RANKS[0];
  }, [localData.totalScore]);

  const trainingCategories = useMemo(() => {
    return Object.keys(grammarQuestionSets).filter((key) => key.startsWith(`${selectedGrade}年`));
  }, [selectedGrade]);

  const dashboardHighScores = useMemo(() => {
    return Object.entries(localData.highScores || {}).sort((a, b) => b[1] - a[1]);
  }, [localData.highScores]);

  const praiseMsg = useMemo(() => {
    const seed = sessionScore + selectedCategory.length;
    return PRAISE_MESSAGES[seed % PRAISE_MESSAGES.length];
  }, [selectedCategory, sessionScore]);

  const handleSaveNickname = (e) => {
    if (e) e.preventDefault();
    const nameToSave = nickname.trim();
    if (nameToSave.length < 2) return;

    const newData = { ...localData, nickname: nameToSave };
    saveToLocal(newData);
    setScreen('TITLE');
  };

  const openModeSelect = (nextFlowType) => {
    setFlowType(nextFlowType);
    setScreen('MODE_SELECT');
  };

  const handleModeSelect = (modeKey) => {
    setSelectedMode(modeKey);

    if (flowType === 'play') {
      if (modeKey === 'basic') {
        setScreen('BASIC_PLAY');
        return;
      }
      setScreen('GRADE_PLAY');
      return;
    }

    if (modeKey === 'basic') {
      setScreen('BASIC_RANK');
      return;
    }
    setScreen('GRADE_RANK');
  };

  const openTrainingCategoryList = (grade) => {
    setSelectedGrade(grade);
    if (selectedMode === 'training') {
      setScreen(flowType === 'play' ? 'CATEGORY_PLAY' : 'CATEGORY_RANK');
      return;
    }

    const reviewCategory = `${grade}年 総復習`;
    if (flowType === 'play') {
      startSelectedSet(reviewCategory);
      return;
    }
    setRankViewCategory(reviewCategory);
    setScreen('RANK_DETAIL');
  };

  const startSelectedSet = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setScreen('READY_COUNTDOWN');
  };

  const prepareQuestion = useCallback((question) => {
    const words = question.en.split(' ').filter((word) => word.length > 0);
    const shuffledWords = shuffleWords(words);
    setUserWords([]);
    setSelectableWords(shuffledWords.map((word, idx) => ({ text: word, hidden: false, id: idx })));
    setQStartTime(Date.now());
  }, []);

  const startGameSequence = useCallback(() => {
    const list = allQuestionSets[selectedCategory];
    if (!list || list.length === 0) {
      setScreen('TITLE');
      return;
    }

    const shuffled = shuffleQuestions(list);
    setSessionQuestions(shuffled);
    setIsNewRecord(false);
    setCurrentIdx(0);
    setSessionScore(0);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setAnswers([]);
    setResultSummary({ correctCount: 0, totalCount: 0, accuracy: 0 });
    prepareQuestion(shuffled[0]);
    setScreen('GAME');
  }, [prepareQuestion, selectedCategory]);

  const handleTapWord = (index, type) => {
    if (feedback || isQuitModalOpen) return;

    if (type === 'user') {
      const target = userWords[index];
      const nextUserWords = [...userWords];
      nextUserWords.splice(index, 1);
      setUserWords(nextUserWords);
      setSelectableWords((prev) => prev.map((word) => word.id === target.id ? { ...word, hidden: false } : word));
      return;
    }

    const target = selectableWords[index];
    if (target.hidden) return;
    speak(target.text);
    setSelectableWords((prev) => prev.map((word, idx) => idx === index ? { ...word, hidden: true } : word));
    setUserWords([...userWords, target]);
  };

  const endSession = useCallback((finalAnswers) => {
    setScreen('RESULT');
    const finalScore = finalAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    const correctCount = finalAnswers.filter((answer) => answer.isCorrect).length;
    const totalCount = finalAnswers.length;
    const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
    setSessionScore(finalScore);
    setResultSummary({ correctCount, totalCount, accuracy });

    const updatedHighScores = { ...localData.highScores };
    const currentBest = updatedHighScores[selectedCategory] || 0;

    if (finalScore > currentBest) {
      setIsNewRecord(true);
      updatedHighScores[selectedCategory] = finalScore;
    }

    const newBestSum = Object.values(updatedHighScores).reduce((acc, value) => acc + (value || 0), 0);
    const newHistory = [{
      category: selectedCategory,
      score: finalScore,
      date: new Date().toISOString()
    }, ...localData.history].slice(0, 50);

    const newData = {
      ...localData,
      totalScore: (localData.totalScore || 0) + finalScore,
      totalAttempts: (localData.totalAttempts || 0) + 1,
      totalBestScore: newBestSum,
      highScores: updatedHighScores,
      history: newHistory
    };

    saveToLocal(newData);
  }, [localData, selectedCategory]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (screen !== 'GAME' || feedback) return;
    const allSelected = selectableWords.length > 0 && selectableWords.every((word) => word.hidden);
    if (!allSelected) return;

    const target = sessionQuestions[currentIdx];
    const userStr = userWords.map((word) => word.text).join(' ');
    const isCorrect = userStr === target.en;
    let points = 0;

    if (isCorrect) {
      speak(target.en);
      const elapsed = Date.now() - qStartTime;
      points = Math.max(
        MIN_Q_POINTS,
        MAX_Q_POINTS - (Math.floor(elapsed / PENALTY_UNIT_MS) * PENALTY_PER_UNIT)
      ) + Math.min(MAX_COMBO, combo * COMBO_BONUS);
      setSessionScore((score) => score + points);
      setCombo((currentCombo) => currentCombo + 1);
    } else {
      setCombo(0);
    }

    const nextAnswers = [...answers, {
      q: target,
      userEn: userStr,
      isCorrect,
      points
    }];

    setAnswers(nextAnswers);
    setFeedback(isCorrect ? 'CORRECT' : 'WRONG');

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 < sessionQuestions.length) {
        const nextIndex = currentIdx + 1;
        setCurrentIdx(nextIndex);
        prepareQuestion(sessionQuestions[nextIndex]);
      } else {
        endSession(nextAnswers);
      }
    }, 800);
  }, [userWords, selectableWords, currentIdx, sessionQuestions, screen, feedback, combo, qStartTime, speak, answers, prepareQuestion, endSession]);

  useEffect(() => {
    let timer;
    if (screen === 'GAME' && timeLeft > 0 && !isQuitModalOpen) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && screen === 'GAME') {
      endSession(answers);
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft, isQuitModalOpen, answers, endSession]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 font-sans flex flex-col items-center select-none overflow-hidden touch-manipulation">
      <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden relative border-x border-indigo-100">
        <div className="bg-indigo-700 px-4 py-3 text-white flex justify-between items-center shadow-md z-[60]">
          <span className="italic font-black text-xs tracking-widest uppercase">ENGLISH KNOCK v3 (Local)</span>
          {screen === 'GAME' && <div className="bg-orange-500 px-4 py-1 rounded-full text-sm font-black border-2 border-white/30">{timeLeft}s</div>}
          {screen === 'GAME' && <button onClick={() => setIsQuitModalOpen(true)} className="ml-2 text-2xl font-bold p-1">×</button>}
        </div>

        <div className="flex-1 overflow-hidden relative p-4 flex flex-col">
          {screen === 'LOADING' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-5xl animate-bounce">⚾</div>
              <p className="animate-pulse text-slate-400 uppercase tracking-widest font-bold text-sm">Initializing Local Store...</p>
            </div>
          )}

          {screen === 'NICKNAME' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
              <div className="text-center">
                <h2 className="text-4xl text-indigo-900 font-black italic mb-2">ENTRY</h2>
                <p className="text-slate-400 text-xs">選手名を入力してください</p>
              </div>
              <form onSubmit={handleSaveNickname} className="w-full space-y-4">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Player Name"
                  className="w-full p-5 bg-slate-50 rounded-3xl text-center font-black text-2xl border-4 border-indigo-50 focus:border-indigo-200 outline-none transition-all shadow-inner"
                  maxLength={10}
                  required
                />
                <button type="submit" className="w-full bg-indigo-700 text-white py-5 rounded-3xl shadow-xl text-xl font-black active:scale-95 transition-all">アリーナへ入る</button>
              </form>
            </div>
          )}

          {screen === 'TITLE' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in">
              <div className="text-center">
                <p className="text-indigo-700 text-4xl font-black italic mb-3">Hi, {localData.nickname}!</p>
                <div className="mx-auto text-white px-5 py-2 rounded-full text-xs font-black shadow-lg inline-flex items-center gap-2" style={{ backgroundColor: currentRankInfo.color }}>
                  <span>{currentRankInfo.icon}</span> {currentRankInfo.label}
                </div>
              </div>
              <div className="w-full space-y-3">
                <button onClick={() => openModeSelect('play')} className="w-full bg-indigo-700 text-white py-6 rounded-[2.5rem] shadow-xl text-2xl font-black active:scale-95 transition-all relative overflow-hidden">
                  学習をはじめる ⚡
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -skew-x-12 translate-x-[-100%] animate-shine" />
                </button>
                <button onClick={() => openModeSelect('rank')} className="w-full bg-white text-indigo-600 py-4 rounded-3xl font-black border-2 border-indigo-100 active:scale-95 flex items-center justify-center gap-2 shadow-sm transition-all">
                  <Icons.Trophy /> 単元別自己ベスト
                </button>
                <button onClick={() => setScreen('DASHBOARD')} className="w-full bg-white text-slate-400 py-4 rounded-3xl font-bold border-2 border-slate-100 active:scale-95 text-sm shadow-sm transition-all">📊 個人学習ログ</button>
              </div>
              <button onClick={() => setScreen('NICKNAME')} className="text-slate-300 text-[10px] underline uppercase font-bold tracking-widest">選手名を変更</button>
            </div>
          )}

          {screen === 'MODE_SELECT' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">
                  {flowType === 'play' ? 'Learning Mode' : 'Best Score'}
                </span>
                <h2 className="text-2xl mt-2 text-indigo-900 font-black italic uppercase">
                  {flowType === 'play' ? 'Choose Genre' : 'Select Genre'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {Object.entries(MODE_COPY).map(([modeKey, mode]) => (
                  <button
                    key={modeKey}
                    onClick={() => handleModeSelect(modeKey)}
                    className="w-full text-left rounded-[2rem] overflow-hidden bg-white border-4 border-indigo-50 shadow-md active:scale-95 transition-all"
                  >
                    <div className={`bg-gradient-to-r ${mode.accent} px-5 py-4 text-white flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mode.icon}</span>
                        <span className="text-xl font-black">{mode.title}</span>
                      </div>
                      <span className="text-white/80">▶</span>
                    </div>
                    <div className="px-5 py-4 text-sm text-slate-500 font-bold leading-relaxed">
                      {mode.description}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('TITLE')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl active:scale-95 text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
            </div>
          )}

          {(screen === 'GRADE_PLAY' || screen === 'GRADE_RANK') && (
            <div className="flex-1 flex flex-col justify-center space-y-4 animate-in slide-in-from-bottom">
              <h2 className="text-2xl text-center font-black text-indigo-900 mb-2 italic uppercase">
                {selectedMode === 'training' ? 'Select Grade' : 'Review Grade'}
              </h2>
              <p className="text-center text-slate-400 text-[10px] uppercase font-black tracking-widest mb-6">
                {selectedMode === 'training' ? '学年ごとの文法を選びます' : '学年ごとの総復習を行います'}
              </p>
              {[1, 2, 3].map((grade) => (
                <button key={grade} onClick={() => openTrainingCategoryList(grade)} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2rem] text-xl flex justify-between items-center active:scale-95 shadow-sm transition-all hover:border-indigo-100">
                  <div className="flex items-center gap-4">
                    <span className="bg-indigo-700 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl">0{grade}</span>
                    <span className="font-black text-slate-700">中学 {grade} 年生</span>
                  </div>
                  <div className="text-indigo-200">▶</div>
                </button>
              ))}
              <button onClick={() => setScreen('MODE_SELECT')} className="mt-8 text-slate-300 text-xs font-black uppercase w-full text-center py-4">Back to Genre</button>
            </div>
          )}

          {screen === 'CATEGORY_PLAY' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">Grade {selectedGrade}</span>
                <h2 className="text-2xl mt-2 text-indigo-900 font-black italic uppercase">Choose Course</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {trainingCategories.map((category) => (
                  <button key={category} onClick={() => startSelectedSet(category)} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2.5rem] text-left flex justify-between items-center active:scale-95 shadow-md transition-all hover:bg-indigo-50/30 group">
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-300 group-active:text-indigo-600 transition-colors"><Icons.Zap /></div>
                      <span className="text-indigo-900 text-lg font-black italic">{category.split(' ')[1]}</span>
                    </div>
                    <div className="text-indigo-200">▶</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('GRADE_PLAY')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl active:scale-95 text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
            </div>
          )}

          {screen === 'CATEGORY_RANK' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <h2 className="text-2xl text-indigo-900 font-black italic uppercase">Select Course</h2>
                <p className="text-slate-400 text-[10px] uppercase">自己ベストを確認する項目を選んでください</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {trainingCategories.map((category) => (
                  <button key={category} onClick={() => { setRankViewCategory(category); setScreen('RANK_DETAIL'); }} className="w-full bg-white border-2 border-indigo-100 p-6 rounded-3xl flex justify-between items-center active:scale-95 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-black">{category}</span>
                      <span className="text-[10px] text-indigo-500 font-bold">BEST: {(localData.highScores[category] || 0).toLocaleString()} pt</span>
                    </div>
                    <Icons.Trophy />
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('GRADE_RANK')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
            </div>
          )}

          {(screen === 'BASIC_PLAY' || screen === 'BASIC_RANK') && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">Basic Sentences</span>
                <h2 className="text-2xl mt-2 text-indigo-900 font-black italic uppercase">
                  {flowType === 'play' ? 'Choose Grade' : 'Select Grade'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {BASIC_SCOPE_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (screen === 'BASIC_PLAY') {
                        startSelectedSet(item.key);
                      } else {
                        setRankViewCategory(item.key);
                        setScreen('RANK_DETAIL');
                      }
                    }}
                    className="w-full bg-white border-4 border-amber-50 p-6 rounded-[2rem] text-left flex justify-between items-center active:scale-95 shadow-sm transition-all hover:border-amber-100"
                  >
                    <div className="flex items-center gap-4">
                      <span className="bg-amber-500 text-white min-w-12 h-12 px-3 rounded-full flex items-center justify-center font-black text-sm">{item.gradeLabel}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-lg">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-bold">英文と日本文の基本文を並べ替えで確認します</span>
                      </div>
                    </div>
                    <div className="text-amber-200">▶</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('MODE_SELECT')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
            </div>
          )}

          {screen === 'RANK_DETAIL' && (
            <div className="flex-1 flex flex-col animate-in fade-in">
              <div className="text-center mb-6">
                <h2 className="text-xl text-indigo-900 font-black uppercase italic tracking-tight">{rankViewCategory}</h2>
                <p className="text-[10px] text-slate-400 uppercase mt-1 font-black">Personal Best Record</p>
              </div>
              <div className="flex-1 bg-indigo-50/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-indigo-100 shadow-inner overflow-hidden">
                <div className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Your Best Score</div>
                <div className="text-7xl font-black italic text-indigo-700 drop-shadow-sm">{(localData.highScores[rankViewCategory] || 0).toLocaleString()}</div>
                <div className="text-indigo-300 mt-2">Points</div>
              </div>
              <button
                onClick={() => {
                  if (selectedMode === 'basic') setScreen('BASIC_RANK');
                  else if (selectedMode === 'review') setScreen('GRADE_RANK');
                  else setScreen('CATEGORY_RANK');
                }}
                className="mt-6 w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
              >
                Back to List
              </button>
            </div>
          )}

          {screen === 'READY_COUNTDOWN' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in">
              <CountdownTimer onComplete={startGameSequence} />
            </div>
          )}

          {screen === 'GAME' && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-end px-1 gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Now Playing</span>
                  <span className="text-indigo-600 font-black italic truncate">{selectedCategory}</span>
                </div>
                <div className="text-orange-600 text-3xl font-black tracking-tighter drop-shadow-sm italic whitespace-nowrap">
                  {(sessionScore || 0).toLocaleString()} <span className="text-[10px] not-italic">pt</span>
                </div>
              </div>

              {sessionQuestions[currentIdx]?.context && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl px-4 py-3 shadow-sm">
                  <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mb-1">前の文</p>
                  <p className="text-sm text-slate-700 font-black leading-snug">{sessionQuestions[currentIdx].context}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-3xl text-center min-h-[84px] flex items-center justify-center border-4 border-slate-50 shadow-md leading-snug relative overflow-hidden">
                <h2 className="text-xl font-black text-slate-700 z-10">{sessionQuestions[currentIdx]?.ja}</h2>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              </div>

              <div className={`min-h-[135px] p-4 border-4 border-indigo-50 border-dashed rounded-3xl flex flex-wrap content-start justify-center gap-2 bg-indigo-50/10 relative transition-all duration-300 ${feedback === 'CORRECT' ? 'bg-emerald-50 border-emerald-300' : feedback === 'WRONG' ? 'bg-rose-50 border-rose-300' : ''}`}>
                {userWords.length === 0 && !feedback && (
                  <span className="text-slate-300 text-xs font-bold absolute top-1/2 -translate-y-1/2 px-4 text-center">組み立てた英文がここに表示されます</span>
                )}
                {userWords.map((word, index) => (
                  <button
                    key={`${word.id}-${index}`}
                    onClick={() => handleTapWord(index, 'user')}
                    className="bg-white border-2 border-indigo-600 px-3.5 py-2 rounded-xl font-black shadow-sm text-indigo-700 text-base animate-in zoom-in active:bg-indigo-50"
                  >
                    {word.text}
                  </button>
                ))}

                {feedback === 'CORRECT' && <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-xl animate-bounce">💮</div>}
                {feedback === 'WRONG' && <div className="absolute inset-0 flex items-center justify-center text-7xl text-rose-500 animate-pulse drop-shadow-xl">×</div>}
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm flex flex-col">
                <div className="text-[10px] text-slate-400 text-center uppercase font-black mb-3 tracking-[0.2em]">Select Words</div>
                <div className="flex flex-wrap gap-2.5 justify-center content-start">
                  {selectableWords.map((word, index) => (
                    <button
                      key={`${word.id}-${word.text}`}
                      onClick={() => handleTapWord(index, 'select')}
                      className={`px-4 py-2.5 rounded-xl font-black text-lg leading-none transition-all border-4 shadow-sm active:scale-90 ${word.hidden ? 'invisible pointer-events-none opacity-0' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-700'}`}
                    >
                      {word.text}
                    </button>
                  ))}
                </div>
              </div>

              {combo > 1 && (
                <div className="text-center text-orange-500 italic font-black animate-bounce flex items-center justify-center gap-1 text-sm mt-auto">
                  <span>🔥</span> {combo} COMBO!
                </div>
              )}
            </div>
          )}

          {screen === 'RESULT' && (
            <div className="flex-1 flex flex-col space-y-5 animate-in fade-in relative">
              {isNewRecord && (
                <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-amber-400/20 to-indigo-900/40 animate-rainbow-pulse rounded-[3rem]">
                  <Icons.Crown />
                  <div className="text-white text-3xl font-black italic animate-pulse mt-4 text-center px-4 drop-shadow-2xl">{praiseMsg}</div>
                </div>
              )}

              <div className="text-center z-10 pt-4">
                <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${isNewRecord ? 'text-white' : 'text-indigo-900'}`}>{isNewRecord ? 'LEGENDARY RECORD!' : 'Session Finished'}</h2>
                <div className={`text-8xl font-black tracking-tighter italic drop-shadow-md my-2 ${isNewRecord ? 'text-amber-400 scale-110 drop-shadow-[0_0_30px_rgba(251,191,36,1)]' : 'text-slate-800'}`}>
                  {(sessionScore || 0).toLocaleString()}
                </div>
                <div className="inline-block px-6 py-2 rounded-full text-white text-[11px] font-black shadow-lg" style={{ backgroundColor: currentRankInfo.color }}>{currentRankInfo.icon} {currentRankInfo.label}</div>
              </div>

              <div className="grid grid-cols-3 gap-3 z-10">
                <div className="bg-white border border-indigo-100 rounded-2xl py-3 text-center">
                  <div className="text-[9px] uppercase font-black text-slate-400">Correct</div>
                  <div className="text-xl font-black text-indigo-700">{resultSummary.correctCount}/{resultSummary.totalCount}</div>
                </div>
                <div className="bg-white border border-indigo-100 rounded-2xl py-3 text-center">
                  <div className="text-[9px] uppercase font-black text-slate-400">Accuracy</div>
                  <div className="text-xl font-black text-emerald-600">{resultSummary.accuracy}%</div>
                </div>
                <div className="bg-white border border-indigo-100 rounded-2xl py-3 text-center">
                  <div className="text-[9px] uppercase font-black text-slate-400">Mode</div>
                  <div className="text-sm font-black text-slate-700">{MODE_COPY[selectedMode].title}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 z-10">
                <button onClick={() => setScreen('READY_COUNTDOWN')} className="col-span-2 bg-indigo-700 text-white py-5 rounded-[2rem] shadow-xl text-xl font-black active:scale-95 transition-all">もう一度挑む ⚾</button>
                <button onClick={() => setScreen('TITLE')} className="bg-white text-slate-500 py-3 rounded-2xl font-black text-xs border border-slate-200 active:scale-95">TOPへ</button>
                <button onClick={() => setScreen('DASHBOARD')} className="bg-white text-slate-500 py-3 rounded-2xl font-black text-xs border border-slate-200 active:scale-95">学習履歴</button>
              </div>

              <div className="flex-1 bg-indigo-50/40 rounded-[2.5rem] p-5 flex flex-col border border-indigo-100 z-10 overflow-hidden">
                <p className="text-[10px] text-indigo-400 uppercase font-black mb-3 pb-2 border-b border-indigo-100/50">🏆 {selectedCategory} Summary</p>
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <p className="text-slate-500 text-sm font-bold">Your Best: {(localData.highScores[selectedCategory] || 0).toLocaleString()} pt</p>
                  <p className="text-slate-400 text-[10px]">個人ランキング機能のみ有効です</p>
                </div>
              </div>
            </div>
          )}

          {screen === 'DASHBOARD' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4 animate-in slide-in-from-bottom">
              <h2 className="text-2xl text-center text-indigo-900 italic font-black uppercase">Personal Stats</h2>

              <div className="bg-indigo-900 p-8 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden group">
                <p className="text-[10px] opacity-60 uppercase font-black tracking-widest mb-1">Total Cumulative Points</p>
                <div className="text-6xl font-black italic drop-shadow-lg tracking-tighter">{(localData.totalScore || 0).toLocaleString()}</div>
                <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black shadow-lg border border-white/20 transition-transform group-hover:scale-105" style={{ backgroundColor: currentRankInfo.color }}>
                  <span>{currentRankInfo.icon}</span> {currentRankInfo.label}
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12 pointer-events-none">🎓</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-5 rounded-[2rem] border-2 border-amber-50 shadow-sm text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Best Score Sum</p>
                  <p className="text-amber-600 text-2xl font-black italic">{(localData.totalBestScore || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border-2 border-orange-50 shadow-sm text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Total Sessions</p>
                  <p className="text-orange-600 text-2xl font-black italic">{localData.totalAttempts || 0} <span className="text-[10px] not-italic">回</span></p>
                </div>
              </div>

              <button onClick={() => openModeSelect('rank')} className="w-full bg-indigo-50 text-indigo-700 py-5 rounded-[2rem] font-black text-xs border-2 border-indigo-100 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2">
                <Icons.Trophy /> 単元別のベスト記録を確認
              </button>

              <div className="flex-1 bg-white rounded-[2rem] border-2 border-slate-50 p-5 overflow-hidden flex flex-col shadow-inner">
                <p className="text-[10px] text-slate-400 border-b border-slate-50 pb-2 mb-3 font-black uppercase tracking-widest">Recent Activity (Local Only)</p>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {(localData.history || []).length === 0 ? <p className="text-center text-slate-200 text-xs py-10">まだ記録がありません</p> :
                    localData.history.map((log, index) => {
                      const date = new Date(log.date);
                      return (
                        <div key={`${log.category}-${index}`} className="flex justify-between items-center text-[11px] p-3 bg-slate-50 rounded-2xl font-bold gap-3">
                          <span className="text-slate-400 font-black whitespace-nowrap">{`${date.getMonth() + 1}/${date.getDate()}`}</span>
                          <span className="truncate flex-1 text-slate-600 italic">{log.category}</span>
                          <span className="text-indigo-700 font-black whitespace-nowrap">{(log.score || 0).toLocaleString()} <span className="text-[8px] opacity-40">pt</span></span>
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              {dashboardHighScores.length > 0 && (
                <div className="bg-indigo-50/30 rounded-[2rem] border border-indigo-100 p-4 shadow-inner">
                  <p className="text-[10px] uppercase font-black text-indigo-400 mb-3">Top Records</p>
                  <div className="space-y-2">
                    {dashboardHighScores.slice(0, 3).map(([category, score], index) => (
                      <div key={category} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 text-sm font-black text-slate-700">
                        <span className="truncate">{index + 1}. {category}</span>
                        <span className="text-indigo-700 whitespace-nowrap">{score.toLocaleString()} pt</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setScreen('TITLE')} className="mt-2 w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95">Back to Home</button>
            </div>
          )}

          {isQuitModalOpen && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
              <div className="bg-white rounded-[2.5rem] p-8 w-full text-center shadow-2xl border-4 border-indigo-50 animate-in zoom-in">
                <div className="text-4xl mb-4">⚾</div>
                <p className="font-black text-xl mb-6 leading-relaxed text-slate-700">ゲームを中断して<br />ホームに戻りますか？</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setIsQuitModalOpen(false)} className="bg-slate-100 py-4 rounded-2xl font-black text-slate-500 active:scale-95 transition-all">続ける</button>
                  <button onClick={() => { setIsQuitModalOpen(false); setScreen('TITLE'); }} className="bg-rose-500 py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all">中断する</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownTimer({ onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 1) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div key={count} className="text-[12rem] leading-none drop-shadow-2xl animate-in zoom-in font-black text-indigo-700">
        {count}
      </div>
      <p className="text-slate-400 uppercase tracking-[0.6em] text-xs font-black animate-pulse">Wait Field...</p>
    </div>
  );
}

function buildReviewQuestionSets(questionSets) {
  const reviewSets = {};

  [1, 2, 3].forEach((grade) => {
    const merged = Object.entries(questionSets)
      .filter(([category]) => category.startsWith(`${grade}年`))
      .flatMap(([, questions]) => questions.map((question) => ({ ...question })));

    reviewSets[`${grade}年 総復習`] = merged;
  });

  return reviewSets;
}

function buildBasicQuestionSets(sentences) {
  const gradeMap = {
    '基本文 1年': sentences.filter((sentence) => sentence.grade === 1),
    '基本文 2年': sentences.filter((sentence) => sentence.grade === 2),
    '基本文 3年': sentences.filter((sentence) => sentence.grade === 3),
    '基本文 全学年': sentences,
  };

  return Object.fromEntries(
    Object.entries(gradeMap).map(([key, sentenceList]) => [
      key,
      sentenceList.map((sentence) => ({
        ja: sentence.japanese,
        en: sentence.english,
        context: sentence.context,
        comment: `${sentence.grade}年の基本文`,
      }))
    ])
  );
}

function shuffleQuestions(questions) {
  const shuffled = [...questions];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 1; i < shuffled.length; i += 1) {
    if (shuffled[i].en === shuffled[i - 1].en || shuffled[i].ja === shuffled[i - 1].ja) {
      const swapIndex = shuffled.findIndex((item, idx) => idx > i && item.en !== shuffled[i - 1].en && item.ja !== shuffled[i - 1].ja);
      if (swapIndex !== -1) {
        [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
      }
    }
  }

  return shuffled;
}

function shuffleWords(words) {
  const shuffled = [...words];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
