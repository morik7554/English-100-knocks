import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Game Constants ---
const GAME_DURATION = 60;        
const MAX_Q_POINTS = 150;        
const MIN_Q_POINTS = 50;         
const PENALTY_UNIT_MS = 750;     
const PENALTY_PER_UNIT = 5;      
const COMBO_BONUS = 2;   
const MAX_COMBO = 20;      

// --- Local Storage Key ---
const STORAGE_KEY = 'english_knock_v3_local_data';

// --- English Content Database ---
const INTERNAL_DATA = {
  "1年 be動詞": [
    { ja: "私は学生です。", en: "I am a student .", comment: "I am ~" },
    { ja: "あなたは親切です。", en: "You are kind .", comment: "You are ~" },
    { ja: "彼は私の友達です。", en: "He is my friend .", comment: "He is ~" },
    { ja: "私たちは幸せです。", en: "We are happy .", comment: "We are ~" },
    { ja: "これはペンです。", en: "This is a pen .", comment: "This is ~" }
  ],
  "2年 比較級": [
    { ja: "私はあなたより背が高いです。", en: "I am taller than you .", comment: "tall → taller than" },
    { ja: "この本はあの本より面白いです。", en: "This book is more interesting than that one .", comment: "more interesting" },
    { ja: "彼は私より速く走ります。", en: "He runs faster than me .", comment: "fast → faster" },
    { ja: "富士山は高尾山より高いです。", en: "Mt. Fuji is higher than Mt. Takao .", comment: "high → higher" },
    { ja: "テニスと野球では、どちらが人気ですか？", en: "Which is more popular , tennis or baseball ?", comment: "Which is more ~" },
    { ja: "彼女はクラスで一番背が高いです。", en: "She is the tallest in her class .", comment: "the tallest" },
    { ja: "英語は数学より簡単です。", en: "English is easier than math .", comment: "easy → easier" },
    { ja: "健康はお金より大切です。", en: "Health is more important than money .", comment: "more important" }
  ],
  "3年 現在完了": [
    { ja: "私はその映画を3回見たことがあります。", en: "I have seen the movie three times .", comment: "経験用法" },
    { ja: "彼はもう昼食を食べてしまいました。", en: "He has already eaten lunch .", comment: "完了用法" },
    { ja: "彼女は2年間ここに住んでいます。", en: "She has lived here for two years .", comment: "継続用法" },
    { ja: "あなたはこれまでに京都に行ったことがありますか？", en: "Have you ever been to Kyoto ?", comment: "疑問文" },
    { ja: "私はまだ宿題を終えていません。", en: "I have not finished my homework yet .", comment: "否定文" }
  ]
};

const RANKS = [
  { min: 0, label: "ノック練習生", color: "#94a3b8", icon: "🌱" },
  { min: 3000, label: "期待の新星", color: "#10b981", icon: "✨" },
  { min: 12000, label: "英語レギュラー", color: "#3b82f6", icon: "⚾" },
  { min: 40000, label: "文法職人", color: "#6366f1", icon: "🛠️" },
  { min: 100000, label: "ノックのエース", color: "#a855f7", icon: "👑" },
  { min: 250000, label: "ノックの神様", color: "#fbbf24", icon: "☀️" },
];

const Icons = {
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Speaker: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Trophy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Crown: () => <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/></svg>,
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
};

export default function App() {
  const [nickname, setNickname] = useState("");
  const [screen, setScreen] = useState('LOADING'); 
  
  // Data State
  const [localData, setLocalData] = useState({
    nickname: "",
    totalScore: 0,
    totalAttempts: 0,
    totalBestScore: 0,
    highScores: {}, // { "CategoryName": score }
    history: []
  });

  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false); 
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [sessionScore, setSessionScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [userWords, setUserWords] = useState([]); 
  const [selectableWords, setSelectableWords] = useState([]); 
  const [feedback, setFeedback] = useState(null); 
  const [qStartTime, setQStartTime] = useState(0);
  
  const [selectedGrade, setSelectedGrade] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rankViewCategory, setRankViewCategory] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);

  // --- Voice Logic ---
  const [nativeVoice, setNativeVoice] = useState(null);
  useEffect(() => {
    const initVoice = () => {
      const vs = window.speechSynthesis.getVoices();
      const best = vs.find(v => v.name.includes("Google US English")) || 
                   vs.find(v => v.lang.startsWith("en-US")) || vs[0];
      setNativeVoice(best);
    };
    window.speechSynthesis.onvoiceschanged = initVoice;
    initVoice();
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/ \./g, '.').replace(/ \?/g, '?');
    const uttr = new SpeechSynthesisUtterance(cleanText);
    if (nativeVoice) uttr.voice = nativeVoice;
    uttr.lang = 'en-US'; uttr.rate = 0.9;
    window.speechSynthesis.speak(uttr);
  }, [nativeVoice]);

  // --- Persistence: Initial Data Loading (Local Storage) ---
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

  // --- Persistence: Save to Local Storage ---
  const saveToLocal = (newData) => {
    setLocalData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const currentRankInfo = useMemo(() => {
    return [...RANKS].reverse().find(r => localData.totalScore >= r.min) || RANKS[0];
  }, [localData.totalScore]);

  // --- Actions ---
  const handleSaveNickname = (e) => {
    if (e) e.preventDefault();
    const nameToSave = nickname.trim();
    if (nameToSave.length < 2) return;
    
    const newData = { ...localData, nickname: nameToSave };
    saveToLocal(newData);
    setScreen('TITLE');
  };

  const startCategoryTransition = (cat) => {
    setSelectedCategory(cat);
    setScreen('READY_COUNTDOWN');
  };

  const startGameSequence = useCallback(() => {
    const list = INTERNAL_DATA[selectedCategory];
    if (!list) { setScreen('TITLE'); return; }
    
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setSessionQuestions(shuffled);
    setIsNewRecord(false);
    setCurrentIdx(0); setSessionScore(0); setCombo(0); setTimeLeft(GAME_DURATION); setAnswers([]); 
    
    const q = shuffled[0];
    const ws = q.en.split(' ').filter(w => w.length > 0).sort(() => Math.random() - 0.5);
    setUserWords([]); setSelectableWords(ws.map((w, i) => ({ text: w, hidden: false, id: i })));
    setQStartTime(Date.now());
    setScreen('GAME');
  }, [selectedCategory]);

  const handleTapWord = (i, type) => {
    if (feedback || isQuitModalOpen) return;
    if (type === 'user') {
      const target = userWords[i];
      const nextU = [...userWords]; nextU.splice(i, 1); setUserWords(nextU);
      setSelectableWords(prev => prev.map(w => w.id === target.id ? { ...w, hidden: false } : w));
    } else {
      const target = selectableWords[i]; if (target.hidden) return;
      speak(target.text);
      setSelectableWords(prev => prev.map((w, idx) => idx === i ? { ...w, hidden: true } : w));
      setUserWords([...userWords, target]);
    }
  };

  useEffect(() => {
    if (screen !== 'GAME' || feedback) return;
    const allSelected = selectableWords.length > 0 && selectableWords.every(w => w.hidden);
    if (allSelected) {
      const target = sessionQuestions[currentIdx];
      const userStr = userWords.map(w => w.text).join(' ');
      const isOk = userStr === target.en;
      let pts = 0;
      if (isOk) {
        speak(target.en);
        const el = Date.now() - qStartTime;
        pts = Math.max(MIN_Q_POINTS, MAX_Q_POINTS - (Math.floor(el / PENALTY_UNIT_MS) * PENALTY_PER_UNIT)) + Math.min(MAX_COMBO, combo * COMBO_BONUS);
        setSessionScore(s => s + pts); setCombo(c => c + 1);
      } else { 
        setCombo(0); 
      }
      setAnswers(prev => [...prev, { q: target, userEn: userStr, isCorrect: isOk, points: pts }]);
      setFeedback(isOk ? 'CORRECT' : 'WRONG');
      
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 < sessionQuestions.length) {
          const nIdx = currentIdx + 1;
          setCurrentIdx(nIdx);
          const nq = sessionQuestions[nIdx];
          const nws = nq.en.split(' ').filter(w => w.length > 0).sort(() => Math.random() - 0.5);
          setUserWords([]); setSelectableWords(nws.map((w, i) => ({ text: w, hidden: false, id: i })));
          setQStartTime(Date.now());
        } else { 
          endSession(); 
        }
      }, 800);
    }
  }, [userWords, selectableWords, currentIdx, sessionQuestions, screen, feedback, combo, qStartTime, speak]);

  const endSession = () => {
    setScreen('RESULT');
    const final = answers.reduce((s, a) => s + (a.points || 0), 0);
    
    // Update logic using local store
    const updatedHighScores = { ...localData.highScores };
    const currentBest = updatedHighScores[selectedCategory] || 0;
    
    if (final > currentBest) {
      setIsNewRecord(true);
      updatedHighScores[selectedCategory] = final;
    }

    const newBestSum = Object.values(updatedHighScores).reduce((acc, v) => acc + (v || 0), 0);
    const newHistory = [{
      category: selectedCategory,
      score: final,
      date: new Date().toISOString()
    }, ...localData.history].slice(0, 50);

    const newData = {
      ...localData,
      totalScore: (localData.totalScore || 0) + final,
      totalAttempts: (localData.totalAttempts || 0) + 1,
      totalBestScore: newBestSum,
      highScores: updatedHighScores,
      history: newHistory
    };

    saveToLocal(newData);
  };

  useEffect(() => {
    let t;
    if (screen === 'GAME' && timeLeft > 0 && !isQuitModalOpen) t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft === 0 && screen === 'GAME') endSession();
    return () => clearInterval(t);
  }, [screen, timeLeft, isQuitModalOpen]);

  const praiseMsg = useMemo(() => {
    const msgs = ["ABSOLUTE LEGEND!", "GOD-TIER SKILLS!", "PERFECT MASTERY!", "UNSTOPPABLE!", "HALL OF FAMER!"];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [isNewRecord]);

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 font-sans flex flex-col items-center select-none overflow-hidden touch-manipulation">
      <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden relative border-x border-indigo-100">
        
        {/* Header bar */}
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
                <button onClick={() => setScreen('GRADE_P')} className="w-full bg-indigo-700 text-white py-6 rounded-[2.5rem] shadow-xl text-2xl font-black active:scale-95 transition-all relative overflow-hidden">
                  ノック開始 ⚡
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -skew-x-12 translate-x-[-100%] animate-shine" />
                </button>
                <button onClick={() => setScreen('GRADE_R')} className="w-full bg-white text-indigo-600 py-4 rounded-3xl font-black border-2 border-indigo-100 active:scale-95 flex items-center justify-center gap-2 shadow-sm transition-all">
                  <Icons.Trophy /> 単元別自己ベスト
                </button>
                <button onClick={() => setScreen('DASHBOARD')} className="w-full bg-white text-slate-400 py-4 rounded-3xl font-bold border-2 border-slate-100 active:scale-95 text-sm shadow-sm transition-all">📊 個人学習ログ</button>
              </div>
              <button onClick={() => setScreen('NICKNAME')} className="text-slate-300 text-[10px] underline uppercase font-bold tracking-widest">選手名を変更</button>
            </div>
          )}

          {(screen === 'GRADE_P' || screen === 'GRADE_R') && (
            <div className="flex-1 flex flex-col justify-center space-y-4 animate-in slide-in-from-bottom">
              <h2 className="text-2xl text-center font-black text-indigo-900 mb-8 italic uppercase">Select Grade</h2>
              {[1, 2, 3].map(g => (
                <button key={g} onClick={() => { setSelectedGrade(g); setScreen(screen === 'GRADE_P' ? 'CAT_P' : 'CAT_R'); }} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2rem] text-xl flex justify-between items-center active:scale-95 shadow-sm transition-all hover:border-indigo-100">
                  <div className="flex items-center gap-4">
                    <span className="bg-indigo-700 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl">0{g}</span> 
                    <span className="font-black text-slate-700">中学 {g} 年生</span>
                  </div>
                  <div className="text-indigo-200">▶</div>
                </button>
              ))}
              <button onClick={() => setScreen('TITLE')} className="mt-8 text-slate-300 text-xs font-black uppercase w-full text-center py-4">Back to Home</button>
            </div>
          )}

          {screen === 'CAT_P' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">Grade {selectedGrade}</span>
                <h2 className="text-2xl mt-2 text-indigo-900 font-black italic uppercase">Choose Course</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {Object.keys(INTERNAL_DATA).filter(k => k.startsWith(`${selectedGrade}年`)).map(cat => (
                  <button key={cat} onClick={() => startCategoryTransition(cat)} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2.5rem] text-left flex justify-between items-center active:scale-95 shadow-md transition-all hover:bg-indigo-50/30 group">
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-300 group-active:text-indigo-600 transition-colors"><Icons.Zap/></div>
                      <span className="text-indigo-900 text-lg font-black italic">{cat.split(' ')[1]}</span>
                    </div>
                    <div className="text-indigo-200">▶</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('GRADE_P')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl active:scale-95 text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
            </div>
          )}

          {screen === 'CAT_R' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
              <div className="text-center mb-6">
                <h2 className="text-2xl text-indigo-900 font-black italic uppercase">Select Course</h2>
                <p className="text-slate-400 text-[10px] uppercase">自己ベストを確認する項目を選んでください</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {Object.keys(INTERNAL_DATA).filter(k => k.startsWith(`${selectedGrade}年`)).map(cat => (
                  <button key={cat} onClick={() => { setRankViewCategory(cat); setScreen('RANK_DETAIL'); }} className="w-full bg-white border-2 border-indigo-100 p-6 rounded-3xl flex justify-between items-center active:scale-95 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-black">{cat}</span>
                      <span className="text-[10px] text-indigo-500 font-bold">BEST: {(localData.highScores[cat] || 0).toLocaleString()} pt</span>
                    </div>
                    <Icons.Trophy />
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('GRADE_R')} className="mt-4 w-full bg-slate-100 py-5 rounded-2xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Icons.Back /> Return</button>
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
              <button onClick={() => setScreen('CAT_R')} className="mt-6 w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Back to List</button>
            </div>
          )}

          {screen === 'READY_COUNTDOWN' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in">
              <CountdownTimer onComplete={startGameSequence} />
            </div>
          )}

          {screen === 'GAME' && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-end px-1">
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 uppercase font-black">Now Playing</span>
                   <span className="text-indigo-600 font-black italic">{selectedCategory}</span>
                </div>
                <div className="text-orange-600 text-3xl font-black tracking-tighter drop-shadow-sm italic">
                  {(sessionScore || 0).toLocaleString()} <span className="text-[10px] not-italic">pt</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl text-center min-h-[70px] flex items-center justify-center border-4 border-slate-50 shadow-md leading-snug relative overflow-hidden">
                <h2 className="text-xl font-black text-slate-700 z-10">{sessionQuestions[currentIdx]?.ja}</h2>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              </div>

              <div className={`min-h-[135px] p-4 border-4 border-indigo-50 border-dashed rounded-3xl flex flex-wrap content-start justify-center gap-2 bg-indigo-50/10 relative transition-all duration-300 ${feedback === 'CORRECT' ? 'bg-emerald-50 border-emerald-300' : feedback === 'WRONG' ? 'bg-rose-50 border-rose-300' : ''}`}>
                {userWords.length === 0 && !feedback && (
                  <span className="text-slate-300 text-xs font-bold absolute top-1/2 -translate-y-1/2">組み立てた英文がここに表示されます</span>
                )}
                {userWords.map((w, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleTapWord(i, 'user')} 
                    className="bg-white border-2 border-indigo-600 px-3.5 py-2 rounded-xl font-black shadow-sm text-indigo-700 text-base animate-in zoom-in active:bg-indigo-50"
                  >
                    {w.text}
                  </button>
                ))}
                
                {feedback === 'CORRECT' && <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-xl animate-bounce">💮</div>}
                {feedback === 'WRONG' && <div className="absolute inset-0 flex items-center justify-center text-7xl text-rose-500 animate-pulse drop-shadow-xl">×</div>}
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm flex flex-col">
                <div className="text-[10px] text-slate-400 text-center uppercase font-black mb-3 tracking-[0.2em]">Select Words</div>
                <div className="flex flex-wrap gap-2.5 justify-center content-start">
                  {selectableWords.map((w, idx) => (
                    <button 
                      key={w.id} 
                      onClick={() => handleTapWord(idx, 'select')} 
                      className={`px-4 py-2.5 rounded-xl font-black text-lg leading-none transition-all border-4 shadow-sm active:scale-90 ${w.hidden ? 'invisible pointer-events-none opacity-0' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-700'}`}
                    >
                      {w.text}
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
                <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${isNewRecord ? 'text-white' : 'text-indigo-900'}`}>{isNewRecord ? "LEGENDARY RECORD!" : "Session Finished"}</h2>
                <div className={`text-8xl font-black tracking-tighter italic drop-shadow-md my-2 ${isNewRecord ? 'text-amber-400 scale-110 drop-shadow-[0_0_30px_rgba(251,191,36,1)]' : 'text-slate-800'}`}>
                  {(sessionScore || 0).toLocaleString()}
                </div>
                <div className="inline-block px-6 py-2 rounded-full text-white text-[11px] font-black shadow-lg" style={{ backgroundColor: currentRankInfo.color }}>{currentRankInfo.icon} {currentRankInfo.label}</div>
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

              <button onClick={() => setScreen('GLOBAL_RANK')} className="w-full bg-indigo-50 text-indigo-700 py-5 rounded-[2rem] font-black text-xs border-2 border-indigo-100 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2">
                <Icons.Trophy /> 単元別のベスト記録を確認
              </button>

              <div className="flex-1 bg-white rounded-[2rem] border-2 border-slate-50 p-5 overflow-hidden flex flex-col shadow-inner">
                <p className="text-[10px] text-slate-400 border-b border-slate-50 pb-2 mb-3 font-black uppercase tracking-widest">Recent Activity (Local Only)</p>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {(localData.history || []).length === 0 ? <p className="text-center text-slate-200 text-xs py-10">まだ記録がありません</p> :
                    localData.history.map((log, i) => {
                      const date = new Date(log.date);
                      return (
                        <div key={i} className="flex justify-between items-center text-[11px] p-3 bg-slate-50 rounded-2xl font-bold">
                          <span className="text-slate-400 font-black">{`${date.getMonth()+1}/${date.getDate()}`}</span>
                          <span className="truncate flex-1 px-4 text-slate-600 italic">{log.category}</span>
                          <span className="text-indigo-700 font-black">{(log.score || 0).toLocaleString()} <span className="text-[8px] opacity-40">pt</span></span>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              <button onClick={() => setScreen('TITLE')} className="mt-2 w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95">Back to Home</button>
            </div>
          )}

          {screen === 'GLOBAL_RANK' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4 animate-in slide-in-from-bottom">
              <h2 className="text-2xl text-center text-indigo-900 italic font-black uppercase">Best Records</h2>
              <p className="text-center text-[10px] text-slate-400 -mt-2 uppercase font-black tracking-widest">Category Wise Personal Best</p>
              
              <div className="flex-1 bg-indigo-50/30 rounded-[2.5rem] p-5 overflow-hidden flex flex-col border border-indigo-100 shadow-inner">
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {Object.entries(localData.highScores || {}).length === 0 ? <p className="text-center text-slate-300 py-10 font-bold">データがありません</p> :
                    Object.entries(localData.highScores)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, score], i) => (
                        <div key={cat} className="flex items-center justify-between p-4 rounded-2xl border-2 bg-white border-indigo-50 text-slate-700 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black bg-slate-100 text-slate-400">{i+1}</span>
                            <span className="text-sm font-bold truncate max-w-[150px]">{cat}</span>
                          </div>
                          <span className="text-sm font-black tabular-nums">{score.toLocaleString()} pt</span>
                        </div>
                      ))
                  }
                </div>
              </div>
              <button onClick={() => setScreen('DASHBOARD')} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase active:scale-95 shadow-lg">戻る</button>
            </div>
          )}

          {isQuitModalOpen && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
              <div className="bg-white rounded-[2.5rem] p-8 w-full text-center shadow-2xl border-4 border-indigo-50 animate-in zoom-in">
                <div className="text-4xl mb-4">⚾</div>
                <p className="font-black text-xl mb-6 leading-relaxed text-slate-700">ゲームを中断して<br/>ホームに戻りますか？</p>
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
      const t = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(t);
    } else { 
      const t = setTimeout(() => { if (onComplete) onComplete(); }, 1000);
      return () => clearTimeout(t);
    }
  }, [count, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div key={count} className={`text-[12rem] leading-none drop-shadow-2xl animate-in zoom-in font-black text-indigo-700`}>
        {count}
      </div>
      <p className="text-slate-400 uppercase tracking-[0.6em] text-xs font-black animate-pulse">Wait Field...</p>
    </div>
  );
}
