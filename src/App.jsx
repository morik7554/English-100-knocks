import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  increment, 
  serverTimestamp
} from 'firebase/firestore';

/**
 * ============================================================
 * 【1. 問題データ】
 * ============================================================
 */
const INTERNAL_DATA = {
  "1年 be動詞": [
    { ja: "私は学生です。", en: "I am a student .", comment: "I am ~" },
    { ja: "あなたは親切です。", en: "You are kind .", comment: "You are ~" },
    { ja: "彼は私の友達です。", en: "He is my friend .", comment: "He is ~" },
    { ja: "私たちは幸せです。", en: "We are happy .", comment: "We are ~" },
    { ja: "これはペンです。", en: "This is a pen .", comment: "This is ~" }
  ],
  "2年 過去形": [
    { ja: "私は昨日、映画を見ました。", en: "I watched a movie yesterday .", comment: "watched a movie" },
    { ja: "私たちはテニスをしました。", en: "We played tennis .", comment: "played tennis" },
    { ja: "彼は昨日、忙しかったです。", en: "He was busy yesterday .", comment: "was busy" },
    { ja: "彼女はリンゴを食べました。", en: "She ate an apple .", comment: "ate an apple" },
    { ja: "それは良い考えでした。", en: "It was a good idea .", comment: "a good idea" },
    { ja: "彼らは学校にいました。", en: "They were at school .", comment: "at school" },
    { ja: "私は昨夜、勉強しました。", en: "I studied last night .", comment: "studied last night" },
    { ja: "あなたは昨日、ここにいましたか？", en: "Were you here yesterday ?", comment: "were you" },
    { ja: "ケンは数学を教えました。", en: "Ken taught math .", comment: "taught math" },
    { ja: "私は朝食を食べませんでした。", en: "I did not eat breakfast .", comment: "eat breakfast" },
    { ja: "私たちは公園へ行きました。", en: "We went to the park .", comment: "went to the park" },
    { ja: "彼女は先生でしたか？", en: "Was she a teacher ?", comment: "was she" },
    { ja: "彼らはサッカーを楽しみました。", en: "They enjoyed soccer .", comment: "enjoyed soccer" },
    { ja: "私は本を読みました。", en: "I read a book .", comment: "read a book" },
    { ja: "あなたも昨日、忙しかった。", en: "You were busy yesterday .", comment: "were busy" },
    { ja: "彼は速く走りました。", en: "He ran fast .", comment: "ran fast" },
    { ja: "それは面白かったです。", en: "It was interesting .", comment: "was interesting" },
    { ja: "彼女は歌を歌いました。", en: "She sang a song .", comment: "sang a song" },
    { ja: "私たちは写真を撮りました。", en: "We took pictures .", comment: "took pictures" },
    { ja: "あなたは昨日、何をしましたか？", en: "What did you do yesterday ?", comment: "what did you do" },
    { ja: "彼はここに来ませんでした。", en: "He did not come here .", comment: "come here" },
    { ja: "私は昨日、疲れました。", en: "I was tired yesterday .", comment: "was tired" },
    { ja: "彼女は上手にピアノを弾きました。", en: "She played the piano well .", comment: "play the piano" },
    { ja: "それは私のカバンでした。", en: "It was my bag .", comment: "my bag" },
    { ja: "彼らは昨日、幸せでしたか？", en: "Were they happy yesterday ?", comment: "were they happy" },
    { ja: "私の父は昨日、家にいました。", en: "My father was at home yesterday .", comment: "at home" },
    { ja: "彼は新しい車を買いました。", en: "He bought a new car .", comment: "bought a new car" },
    { ja: "彼女は昨夜、手紙を書きました。", en: "She wrote a letter last night .", comment: "wrote a letter" },
    { ja: "私たちは昨日、駅で会いました。", en: "We met at the station yesterday .", comment: "at the station" },
    { ja: "あなたは昨日、テレビを見ましたか？", en: "Did you watch TV yesterday ?", comment: "watch TV" },
    { ja: "私は放課後、友達とテニスをしました。", en: "I played tennis with my friends .", comment: "with my friends" },
    { ja: "彼は昨夜、テレビで映画を見ました。", en: "He watched a movie on TV .", comment: "on TV" },
    { ja: "彼女は昨日の朝、早く起きました。", en: "She got up early yesterday morning .", comment: "got up early" },
    { ja: "私たちは昨日の午後、図書館へ行きました。", en: "We went to the library yesterday .", comment: "go to the library" },
    { ja: "ケンは先週、家族に夕食を作りました。", en: "Ken cooked dinner for his family .", comment: "for his family" },
    { ja: "彼らは昨夜、音楽を聴きました。", en: "They listened to music last night .", comment: "listen to" },
    { ja: "私は先週の日曜日、公園で走りました。", en: "I ran in the park last Sunday .", comment: "in the park" },
    { ja: "彼女は昨日、学校でカバンを失くしました。", en: "She lost her bag at school .", comment: "lost her bag" },
    { ja: "私は今朝、朝食にリンゴを食べました。", en: "I ate an apple for breakfast .", comment: "for breakfast" },
    { ja: "私たちは昨日、夕方彼に会いました。", en: "We met him yesterday evening .", comment: "yesterday evening" },
    { ja: "彼は昨日、自分の部屋で勉強しました。", en: "He studied in his room yesterday .", comment: "in his room" },
    { ja: "私の母は先週、このドレスを買いました。", en: "My mother bought this dress last week .", comment: "bought this dress" },
    { ja: "彼らは昨日、海で泳ぎました。", en: "They swam in the sea yesterday .", comment: "swim in the sea" },
    { ja: "私は動物園でたくさんの動物を見ました。", en: "I saw many animals at the zoo .", comment: "at the zoo" },
    { ja: "彼女は駅の近くで私を待ちました。", en: "She waited for me near the station .", comment: "wait for" },
    { ja: "昨日の午後、空に雲がありました。", en: "There were clouds in the sky yesterday .", comment: "in the sky" },
    { ja: "彼は数分前に窓を壊しました。", en: "He broke the window a few minutes ago .", comment: "a few minutes ago" },
    { ja: "私は昨夜、友達に手紙を書きました。", en: "I wrote a letter to my friend .", comment: "write a letter" },
    { ja: "彼女は昨日、私たちに写真を見せました。", en: "She showed us pictures yesterday .", comment: "show us" },
    { ja: "私はそのレストランで昼食を食べました。", en: "I ate lunch at the restaurant .", comment: "eat lunch" }
  ],
  "2年 接続詞 When": [
    { ja: "私が家に来たとき、母はいました。", en: "When I came home , my mother was there .", comment: "came home" },
    { ja: "あなたが暇なとき、私を助けてください。", en: "When you are free , please help me .", comment: "you are free" },
    { ja: "私が子供だったとき、私は幸せでした。", en: "When I was a child , I was happy .", comment: "was a child" },
    { ja: "雨が降っているとき、私は家にいます。", en: "When it rains , I stay at home .", comment: "stay at home" },
    { ja: "ケンが起きたとき、それは7時でした。", en: "When Ken got up , it was seven .", comment: "got up" },
    { ja: "私が彼を見たとき、彼は走っていました。", en: "When I saw him , he was running .", comment: "saw him" },
    { ja: "あなたは疲れているとき、何をしますか？", en: "What do you do when you are tired ?", comment: "when you are tired" },
    { ja: "私が本を読んでいるとき、電話が鳴りました。", en: "When I was reading , the phone rang .", comment: "the phone rang" },
    { ja: "彼女がここに来たとき、私は忙しかったです。", en: "When she came here , I was busy .", comment: "came here" },
    { ja: "暗いときは、気をつけてください。", en: "When it is dark , please be careful .", comment: "be careful" }
  ],
  "2年 SVC": [
    { ja: "あなたは幸せそうに見えます。", en: "You look happy .", comment: "look happy" },
    { ja: "その考えは良さそうに聞こえます。", en: "That idea sounds good .", comment: "sounds good" },
    { ja: "彼は若く見えます。", en: "He looks young .", comment: "looks young" },
    { ja: "それは面白そうに聞こえます。", en: "It sounds interesting .", comment: "sounds interesting" },
    { ja: "この花は美しく見えます。", en: "This flower looks beautiful .", comment: "looks beautiful" }
  ],
  "2年 比較級": [
    { ja: "私はあなたより背が高いです。", en: "I am taller than you .", comment: "tall → taller than" },
    { ja: "この本はあの本より面白いです。", en: "This book is more interesting than that one .", comment: "more interesting" },
    { ja: "彼は私より速く走ります。", en: "He runs faster than me .", comment: "fast → faster" },
    { ja: "富士山は高尾山より高いです。", en: "Mt. Fuji is higher than Mt. Takao .", comment: "high → higher" },
    { ja: "テニスと野球では、どちらが人気ですか？", en: "Which is more popular , tennis or baseball ?", comment: "Which is more ~" }
  ],
  "3年 現在完了": [
    { ja: "私はその映画を3回見たことがあります。", en: "I have seen the movie three times .", comment: "経験用法" },
    { ja: "彼はもう昼食を食べてしまいました。", en: "He has already eaten lunch .", comment: "完了用法" },
    { ja: "彼女は2年間ここに住んでいます。", en: "She has lived here for two years .", comment: "継続用法" },
    { ja: "あなたはこれまでに京都に行ったことがありますか？", en: "Have you ever been to Kyoto ?", comment: "疑問文" },
    { ja: "私はまだ宿題を終えていません。", en: "I have not finished my homework yet .", comment: "否定文" }
  ]
};

/**
 * ============================================================
 * 【2. 定数・設定】
 * ============================================================
 */
const getImportMetaEnv = () => {
  try {
    return import.meta?.env ?? {};
  } catch (e) {
    return {};
  }
};

const readEnv = (key, fallback = undefined) => {
  const env = getImportMetaEnv();
  if (env && Object.prototype.hasOwnProperty.call(env, key)) return env[key];
  return fallback;
};

const firebaseConfigRaw =
  (typeof __firebase_config !== 'undefined' && __firebase_config) ||
  readEnv('VITE_FIREBASE_CONFIG', null);

const forceLocal = String(readEnv('VITE_LOCAL_ONLY', 'false')).toLowerCase() === 'true';

const appId = typeof __app_id !== 'undefined'
  ? __app_id
  : (readEnv('VITE_APP_ID', 'english-100-knock-v3'));
let firebaseConfig = {};
let hasFirebaseConfig = false;
if (!forceLocal && firebaseConfigRaw) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigRaw);
    hasFirebaseConfig = true;
  } catch (e) {
    firebaseConfig = {};
    hasFirebaseConfig = false;
  }
}

let app = null;
let auth = null;
let db = null;
if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const localKey = (suffix) => `${appId}:${suffix}`;
const loadLocalJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};
const saveLocalJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};
const getLocalUserId = () => {
  let uid = localStorage.getItem(localKey('uid'));
  if (!uid) {
    const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    uid = rand;
    localStorage.setItem(localKey('uid'), uid);
  }
  return uid;
};

const GAME_DURATION = 60;
const MAX_Q_POINTS = 150;
const MIN_Q_POINTS = 50;
const PENALTY_UNIT_MS = 750;
const PENALTY_PER_UNIT = 5;
const COMBO_BONUS = 2;
const MAX_COMBO = 20;
const COURSE_RANK_LIMIT = 20;

const RANKS = [
  { min: 0, label: "ノック練習生", color: "#94a3b8", icon: "🌱" },
  { min: 3000, label: "期待の新星", color: "#10b981", icon: "✨" },
  { min: 12000, label: "英語レギュラー", color: "#3b82f6", icon: "⚾" },
  { min: 40000, label: "文法職人", color: "#6366f1", icon: "🛠️" },
  { min: 100000, label: "ノックのエース", color: "#a855f7", icon: "👑" },
  { min: 250000, label: "ノックの神様", color: "#fbbf24", icon: "☀️" },
];

/**
 * ============================================================
 * 【3. UI部品】
 * ============================================================
 */
const Icons = {
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Trophy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Crown: () => <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/></svg>,
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
};

const LoadingScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
    <div className="text-5xl animate-bounce">⚾</div>
    <p className="animate-pulse text-slate-400 uppercase tracking-widest font-bold text-sm">Now Loading...</p>
  </div>
);

const RankingList = ({ list, type, currentUserId }) => (
  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
    {(!list || list.length === 0) ? <p className="text-center text-slate-300 py-10 font-bold">データがありません</p> :
      list.map((r, i) => {
        let val = 0;
        if (type === 'sessions') val = r.totalAttempts || 0;
        else if (type === 'best') val = r.totalBestScore || 0;
        else val = r.score || r.totalScore || 0;
        return (
          <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${r.userId === currentUserId ? 'bg-indigo-700 border-indigo-800 text-white shadow-lg' : 'bg-white border-indigo-50 text-slate-700 shadow-sm'}`}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${i < 3 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>{i+1}</span>
              <span className="text-sm font-bold truncate max-w-[120px]">{r.nickname}</span>
            </div>
            <span className="text-sm font-black tabular-nums">{val.toLocaleString()}{type === 'sessions' ? ' 回' : ' pt'}</span>
          </div>
        );
      })
    }
  </div>
);

/**
 * ============================================================
 * 【4. メインアプリケーション】
 * ============================================================
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(localStorage.getItem('knock_nickname') || "");
  const [screen, setScreen] = useState('LOADING'); 
  const [runtimeError, setRuntimeError] = useState(null);
  
  const [totalScore, setTotalScore] = useState(0); 
  const [totalAttempts, setTotalAttempts] = useState(0); 
  const [bestSum, setBestSum] = useState(0); 
  const [history, setHistory] = useState([]);
  const [courseLeaderboard, setCourseLeaderboard] = useState([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [globalRankTab, setGlobalRankTab] = useState('best'); 
  
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
  
  const [selectedGrade, setSelectedGrade] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rankViewCategory, setRankViewCategory] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);

  // --- Voice Setup ---
  const [nativeVoice, setNativeVoice] = useState(null);
  useEffect(() => {
    const initVoice = () => {
      if (!window.speechSynthesis) return;
      const vs = window.speechSynthesis.getVoices();
      const googleVoice = vs.find(v => v.name === "Google US English") || 
                          vs.find(v => v.name.includes("Google US English"));
      const bestFallback = vs.find(v => v.name.includes("Natural") && v.lang.startsWith("en-US")) ||
                           vs.find(v => v.lang.startsWith("en-US")) || 
                           vs[0];
      setNativeVoice(googleVoice || bestFallback);
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = initVoice;
      initVoice();
    }
  }, []);

  useEffect(() => {
    const onError = (event) => {
      const err = event?.error;
      setRuntimeError({
        message: event?.message || (err && err.message) || String(err || event),
        stack: err?.stack || null
      });
    };
    const onRejection = (event) => {
      const reason = event?.reason;
      setRuntimeError({
        message: reason?.message || String(reason || event),
        stack: reason?.stack || null
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/ \./g, '.').replace(/ \?/g, '?').trim();
    const uttr = new SpeechSynthesisUtterance(cleanText);
    if (nativeVoice) uttr.voice = nativeVoice;
    uttr.lang = 'en-US';
    uttr.rate = 1.0;
    uttr.pitch = 1.0;
    window.speechSynthesis.speak(uttr);
  }, [nativeVoice]);

  // --- Auth & Firestore Login ---
  useEffect(() => {
    if (!hasFirebaseConfig) {
      const uid = getLocalUserId();
      const stats = loadLocalJson(localKey('stats'), {});
      setUser({ uid });
      if (stats.nickname) {
        setNickname(stats.nickname);
        setTotalScore(Number(stats.totalScore) || 0);
        setTotalAttempts(Number(stats.totalAttempts) || 0);
        setBestSum(Number(stats.totalBestScore) || 0);
        setScreen('TITLE');
      } else {
        setScreen('NICKNAME');
      }
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { setScreen('NICKNAME'); }
    };
    initAuth();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const statsRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'stats');
        try {
          const snap = await getDoc(statsRef);
          if (snap.exists() && snap.data().nickname) {
            const d = snap.data();
            setNickname(d.nickname);
            setTotalScore(Number(d.totalScore) || 0);
            setTotalAttempts(Number(d.totalAttempts) || 0);
            setBestSum(Number(d.totalBestScore) || 0);
            setScreen('TITLE');
          } else { setScreen('NICKNAME'); }
        } catch (e) { setScreen('NICKNAME'); }
      }
    });
    return () => unsub();
  }, []);

  // --- Data Subscription ---
  useEffect(() => {
    if (!user) return;
    if (!hasFirebaseConfig) {
      const historyLocal = loadLocalJson(localKey('history'), []);
      const leaderboardLocal = loadLocalJson(localKey('leaderboard'), []);
      const globalsLocal = loadLocalJson(localKey('globals'), []);
      setHistory(historyLocal);
      setCourseLeaderboard(leaderboardLocal);
      setGlobalLeaderboard(globalsLocal);
      return;
    }
    const unsubH = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), (s) => {
      const logs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(logs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, () => {});
    const unsubC = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'), (s) => {
      setCourseLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    const unsubG = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'global_stats'), (s) => {
      setGlobalLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => { unsubH(); unsubC(); unsubG(); };
  }, [user]);

  // --- Helper Functions ---
  const currentRankInfo = useMemo(() => {
    return [...RANKS].reverse().find(r => totalScore >= r.min) || RANKS[0];
  }, [totalScore]);

  const getCatRankList = useCallback((cat) => {
    return courseLeaderboard
      .filter(e => e.category === cat)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, COURSE_RANK_LIMIT);
  }, [courseLeaderboard]);

  const sortedGlobals = useMemo(() => {
    let list = [...globalLeaderboard];
    if (globalRankTab === 'best') list.sort((a, b) => (Number(b.totalBestScore) || 0) - (Number(a.totalBestScore) || 0));
    else if (globalRankTab === 'score') list.sort((a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0));
    else list.sort((a, b) => (Number(b.totalAttempts) || 0) - (Number(a.totalAttempts) || 0));
    return list.slice(0, 50);
  }, [globalLeaderboard, globalRankTab]);

  const handleSaveNickname = async () => {
    const name = nickname.trim();
    if (name.length < 2) return;
    localStorage.setItem('knock_nickname', name);
    setScreen('TITLE');
    if (!hasFirebaseConfig) {
      const stats = loadLocalJson(localKey('stats'), {});
      const nextStats = { ...stats, nickname: name, updatedAt: Date.now() };
      saveLocalJson(localKey('stats'), nextStats);
      const globals = loadLocalJson(localKey('globals'), []);
      const nextGlobals = globals.filter(g => g.userId !== user?.uid);
      nextGlobals.push({
        userId: user?.uid,
        nickname: name,
        totalScore: Number(nextStats.totalScore) || 0,
        totalAttempts: Number(nextStats.totalAttempts) || 0,
        totalBestScore: Number(nextStats.totalBestScore) || 0,
        updatedAt: Date.now()
      });
      saveLocalJson(localKey('globals'), nextGlobals);
      setGlobalLeaderboard(nextGlobals);
      return;
    }
    if (user) {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { nickname: name, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'global_stats', user.uid), { userId: user.uid, nickname: name }, { merge: true });
    }
  };

  const startGame = useCallback(() => {
    const list = INTERNAL_DATA[selectedCategory];
    if (!list) { setScreen('TITLE'); return; }
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setSessionQuestions(shuffled);
    setCurrentIdx(0); setSessionScore(0); setCombo(0); setTimeLeft(GAME_DURATION); setIsNewRecord(false);
    prepareQuestion(shuffled[0]);
    setScreen('GAME');
  }, [selectedCategory]);

  const prepareQuestion = (q) => {
    const ws = q.en.split(' ').filter(w => w.length > 0).sort(() => Math.random() - 0.5);
    setUserWords([]); setSelectableWords(ws.map((w, i) => ({ text: w, hidden: false, id: i })));
    setQStartTime(Date.now());
  };

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
    if (screen !== 'GAME' || feedback || selectableWords.length === 0) return;
    const allDone = selectableWords.every(w => w.hidden);
    if (allDone) {
      const target = sessionQuestions[currentIdx];
      const userStr = userWords.map(w => w.text).join(' ');
      const isOk = userStr === target.en;
      let pts = 0;
      if (isOk) {
        speak(target.en);
        pts = Math.max(MIN_Q_POINTS, MAX_Q_POINTS - (Math.floor((Date.now() - qStartTime) / PENALTY_UNIT_MS) * PENALTY_PER_UNIT)) + Math.min(MAX_COMBO, combo * COMBO_BONUS);
        setSessionScore(s => s + pts); setCombo(c => c + 1);
      } else { setCombo(0); }
      setFeedback(isOk ? 'CORRECT' : 'WRONG');
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 < sessionQuestions.length) {
          setCurrentIdx(c => c + 1);
          prepareQuestion(sessionQuestions[currentIdx + 1]);
        } else { endSession(); }
      }, 800);
    }
  }, [userWords]);

  const endSession = async () => {
    setScreen('RESULT');
    const final = sessionScore;
    setTotalScore(prev => prev + final);
    setTotalAttempts(prev => prev + 1);
    
    if (!user) return;
    if (!hasFirebaseConfig) {
      const stats = loadLocalJson(localKey('stats'), {});
      const highScores = { ...(stats.highScores || {}) };
      const currentBest = highScores[selectedCategory] || 0;
      if (final > currentBest && final > 0) {
        setIsNewRecord(true);
        highScores[selectedCategory] = final;
      }
      const newBestSum = Object.values(highScores).reduce((acc, v) => acc + (Number(v) || 0), 0);
      setBestSum(newBestSum);

      const nextStats = {
        ...stats,
        nickname,
        totalScore: (Number(stats.totalScore) || 0) + final,
        totalAttempts: (Number(stats.totalAttempts) || 0) + 1,
        totalBestScore: newBestSum,
        highScores,
        updatedAt: Date.now()
      };
      saveLocalJson(localKey('stats'), nextStats);

      const leaderboard = loadLocalJson(localKey('leaderboard'), []);
      const filtered = leaderboard.filter(e => !(e.userId === user.uid && e.category === selectedCategory));
      filtered.push({
        userId: user.uid,
        nickname,
        score: highScores[selectedCategory] || 0,
        category: selectedCategory,
        updatedAt: Date.now()
      });
      saveLocalJson(localKey('leaderboard'), filtered);
      setCourseLeaderboard(filtered);

      const globals = loadLocalJson(localKey('globals'), []);
      const nextGlobals = globals.filter(g => g.userId !== user.uid);
      nextGlobals.push({
        userId: user.uid,
        nickname,
        totalScore: nextStats.totalScore,
        totalAttempts: nextStats.totalAttempts,
        totalBestScore: nextStats.totalBestScore,
        updatedAt: Date.now()
      });
      saveLocalJson(localKey('globals'), nextGlobals);
      setGlobalLeaderboard(nextGlobals);

      const history = loadLocalJson(localKey('history'), []);
      const nextHistory = [
        { category: selectedCategory, score: final, createdAt: Date.now() },
        ...history
      ];
      saveLocalJson(localKey('history'), nextHistory);
      setHistory(nextHistory);
      return;
    }
    try {
      const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
      const snap = await getDoc(statsRef);
      const d = snap.data() || {};
      const highScores = { ...(d.highScores || {}) };
      const currentBest = highScores[selectedCategory] || 0;

      if (final > currentBest && final > 0) {
        setIsNewRecord(true);
        highScores[selectedCategory] = final;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', `${user.uid}_${selectedCategory}`), { 
          userId: user.uid, nickname, score: final, category: selectedCategory, updatedAt: serverTimestamp() 
        });
      }
      const newBestSum = Object.values(highScores).reduce((acc, v) => acc + (Number(v) || 0), 0);
      setBestSum(newBestSum);

      await Promise.all([
        setDoc(statsRef, { 
          nickname, totalScore: (d.totalScore || 0) + final, totalAttempts: increment(1), totalBestScore: newBestSum, highScores: highScores, updatedAt: serverTimestamp() 
        }, { merge: true }),
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'global_stats', user.uid), { 
          userId: user.uid, nickname, totalScore: (d.totalScore || 0) + final, totalAttempts: (d.totalAttempts || 0) + 1, totalBestScore: newBestSum, updatedAt: serverTimestamp() 
        }, { merge: true }),
        addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), { 
          category: selectedCategory, score: final, createdAt: serverTimestamp() 
        })
      ]);
    } catch (e) { console.error(e); }
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

  // --- Render Controller ---
  const renderScreen = () => {
    switch (screen) {
      case 'LOADING': return <LoadingScreen />;
      case 'NICKNAME':
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
            <h2 className="text-4xl text-indigo-900 font-black italic">ENTRY</h2>
            <input type="text" value={nickname} onChange={(e)=>setNickname(e.target.value)} placeholder="Player Name" className="w-full p-5 bg-slate-50 rounded-3xl text-center font-black text-2xl border-4 border-indigo-50" />
            <button onClick={handleSaveNickname} className="w-full bg-indigo-700 text-white py-5 rounded-3xl shadow-xl text-xl font-black">アリーナへ入る</button>
          </div>
        );
      case 'TITLE':
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in">
            <div className="text-center">
              <p className="text-indigo-700 text-4xl font-black italic mb-3">Hi, {nickname}!</p>
              <div className="mx-auto text-white px-5 py-2 rounded-full text-xs font-black shadow-lg" style={{ backgroundColor: currentRankInfo.color }}>
                {currentRankInfo.icon} {currentRankInfo.label}
              </div>
            </div>
            <div className="w-full space-y-3">
              <button onClick={() => setScreen('GRADE_P')} className="w-full bg-indigo-700 text-white py-6 rounded-[2.5rem] shadow-xl text-2xl font-black relative overflow-hidden">ノック開始 ⚡<div className="absolute top-0 left-0 w-full h-full bg-white/10 -skew-x-12 translate-x-[-100%] animate-shine" /></button>
              <button onClick={() => setScreen('GRADE_R')} className="w-full bg-white text-indigo-600 py-4 rounded-3xl font-black border-2 border-indigo-100 flex items-center justify-center gap-2"><Icons.Trophy /> 単元別ランキング</button>
              <button onClick={() => setScreen('DASHBOARD')} className="w-full bg-white text-slate-400 py-4 rounded-3xl font-bold border-2 border-slate-100 text-sm">📊 学習ログ & 全体順位</button>
            </div>
            <button onClick={() => setScreen('NICKNAME')} className="text-slate-300 text-[10px] underline uppercase font-bold">選手名を変更</button>
          </div>
        );
      case 'GRADE_P':
      case 'GRADE_R':
        return (
          <div className="flex-1 flex flex-col justify-center space-y-4 animate-in slide-in-from-bottom">
            <h2 className="text-2xl text-center font-black text-indigo-900 mb-8 italic uppercase">Select Grade</h2>
            {[1, 2, 3].map(g => (
              <button key={g} onClick={() => { setSelectedGrade(g); setScreen(screen==='GRADE_P' ? 'CAT_P' : 'CAT_R'); }} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2rem] flex justify-between items-center active:scale-95 shadow-sm">
                <div className="flex items-center gap-4"><span className="bg-indigo-700 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl">0{g}</span><span className="font-black text-slate-700">中学 {g} 年生</span></div>
                <div className="text-indigo-200">▶</div>
              </button>
            ))}
            <button onClick={() => setScreen('TITLE')} className="mt-8 text-slate-300 text-xs font-black uppercase w-full text-center py-4">Back to Home</button>
          </div>
        );
      case 'CAT_P':
        return (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom overflow-hidden">
            <h2 className="text-2xl text-center font-black text-indigo-900 mb-6 italic uppercase shrink-0">Grade {selectedGrade} Courses</h2>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0">
              {Object.keys(INTERNAL_DATA).filter(k => k.startsWith(`${selectedGrade}年`)).map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setScreen('READY_COUNTDOWN'); }} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2.5rem] text-left font-black text-indigo-900 flex justify-between items-center shadow-md active:scale-95 transition-all shrink-0">
                  {cat.split(' ')[1]} <div className="text-indigo-200">▶</div>
                </button>
              ))}
            </div>
            <button onClick={() => setScreen('GRADE_P')} className="mt-4 w-full bg-slate-100 py-4 rounded-2xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 shrink-0"><Icons.Back /> Return</button>
          </div>
        );
      case 'CAT_R':
        return (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom overflow-hidden">
            <h2 className="text-2xl text-center font-black text-indigo-900 mb-6 italic uppercase shrink-0">Ranking Courses</h2>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0">
              {Object.keys(INTERNAL_DATA).filter(k => k.startsWith(`${selectedGrade}年`)).map(cat => (
                <button key={cat} onClick={() => { setRankViewCategory(cat); setScreen('RANK_DETAIL'); }} className="w-full bg-white border-4 border-indigo-50 p-6 rounded-[2.5rem] text-left font-black text-indigo-900 flex justify-between items-center shadow-md shrink-0">
                  {cat.split(' ')[1]} <Icons.Trophy />
                </button>
              ))}
            </div>
            <button onClick={() => setScreen('GRADE_R')} className="mt-4 w-full bg-slate-100 py-4 rounded-2xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 shrink-0"><Icons.Back /> Return</button>
          </div>
        );
      case 'RANK_DETAIL':
        return (
          <div className="flex-1 flex flex-col animate-in fade-in">
            <h2 className="text-xl text-center text-indigo-900 font-black uppercase italic mb-4">{rankViewCategory}</h2>
            <div className="flex-1 bg-indigo-50/30 rounded-[2.5rem] p-5 flex flex-col border border-indigo-100 shadow-inner overflow-hidden">
              <RankingList list={getCatRankList(rankViewCategory)} type="score" currentUserId={user?.uid} />
            </div>
            <button onClick={() => setScreen('CAT_R')} className="mt-6 w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase">BACK TO LIST</button>
          </div>
        );
      case 'READY_COUNTDOWN': return <CountdownTimer onComplete={startGame} />;
      case 'GAME':
        const q = sessionQuestions[currentIdx];
        return (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-end px-1">
              <div className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase font-black">Now Playing</span><span className="text-indigo-600 font-black italic">{selectedCategory}</span></div>
              <div className="text-orange-600 text-3xl font-black italic tabular-nums">{(sessionScore).toLocaleString()} <span className="text-[10px] not-italic">pt</span></div>
            </div>
            <div className="bg-white p-4 rounded-3xl text-center min-h-[70px] flex items-center justify-center border-4 border-slate-50 shadow-md relative overflow-hidden">
              <h2 className="text-xl font-black text-slate-700 z-10">{q?.ja}</h2>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            </div>
            <div className={`min-h-[135px] p-4 border-4 border-indigo-50 border-dashed rounded-3xl flex flex-wrap content-start justify-center gap-2 relative transition-all duration-300 ${feedback === 'CORRECT' ? 'bg-emerald-50 border-emerald-300' : feedback === 'WRONG' ? 'bg-rose-50 border-rose-300' : ''}`}>
              {userWords.length === 0 && !feedback && <span className="text-slate-300 text-xs font-bold absolute top-1/2 -translate-y-1/2 text-center w-full px-4">単語をタップして文章を作ろう</span>}
              {userWords.map((w, i) => (<button key={i} onClick={() => handleTapWord(i, 'user')} className="bg-white border-2 border-indigo-600 px-3.5 py-2 rounded-xl font-black shadow-sm text-indigo-700 text-base">{w.text}</button>))}
              {feedback === 'CORRECT' && <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-xl animate-bounce">💮</div>}
              {feedback === 'WRONG' && <div className="absolute inset-0 flex items-center justify-center text-7xl text-rose-500 animate-pulse drop-shadow-xl">×</div>}
            </div>
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm flex flex-col">
              <div className="text-[10px] text-slate-400 text-center uppercase font-black mb-3">Select Words</div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {selectableWords.map((w, idx) => (
                  <button key={w.id} onClick={() => handleTapWord(idx, 'select')} className={`px-4 py-2.5 rounded-xl font-black text-lg border-4 ${w.hidden ? 'invisible' : 'bg-white border-slate-100 text-slate-700'}`}>{w.text}</button>
                ))}
              </div>
            </div>
            {combo > 1 && <div className="text-center text-orange-500 italic font-black animate-bounce flex items-center justify-center gap-1 text-sm mt-auto">🔥 {combo} COMBO!</div>}
          </div>
        );
      case 'RESULT':
        return (
          <div className="flex-1 flex flex-col space-y-5 animate-in fade-in relative overflow-hidden">
            {isNewRecord && (
              <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center animate-rainbow-pulse rounded-[3rem]">
                <Icons.Crown /><div className="text-white text-3xl font-black italic animate-pulse mt-4 text-center px-4 drop-shadow-2xl">{praiseMsg}</div>
              </div>
            )}
            <div className="text-center z-10 pt-4">
              <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${isNewRecord ? 'text-white' : 'text-indigo-900'}`}>{isNewRecord ? "LEGENDARY RECORD!" : "Session Finished"}</h2>
              <div className={`text-8xl font-black italic drop-shadow-md my-2 ${isNewRecord ? 'text-amber-400 scale-110 drop-shadow-[0_0_30px_rgba(251,191,36,1)]' : 'text-slate-800'}`}>{(sessionScore).toLocaleString()}</div>
              <div className="inline-block px-6 py-2 rounded-full text-white text-[11px] font-black shadow-lg" style={{ backgroundColor: currentRankInfo.color }}>{currentRankInfo.icon} {currentRankInfo.label}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 z-10">
              <button onClick={() => setScreen('READY_COUNTDOWN')} className="col-span-2 bg-indigo-700 text-white py-5 rounded-[2rem] shadow-xl text-xl font-black">もう一度挑む ⚾</button>
              <button onClick={() => setScreen('TITLE')} className="bg-white text-slate-500 py-3 rounded-2xl font-black text-xs border border-slate-200">TOPへ</button>
              <button onClick={() => setScreen('DASHBOARD')} className="bg-white text-slate-500 py-3 rounded-2xl font-black text-xs border border-slate-200">学習履歴</button>
            </div>
            <div className="flex-1 bg-indigo-50/40 rounded-[2.5rem] p-5 flex flex-col border border-indigo-100 z-10 overflow-hidden shadow-inner">
              <p className="text-[10px] text-indigo-400 uppercase font-black mb-3 pb-2 border-b border-indigo-100/50">🏆 {selectedCategory} Ranking</p>
              <RankingList list={getCatRankList(selectedCategory)} currentUserId={user?.uid} />
            </div>
          </div>
        );
      case 'DASHBOARD':
        return (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden animate-in slide-in-from-bottom">
            <h2 className="text-2xl text-center text-indigo-900 italic font-black uppercase">Statistics</h2>
            <div className="bg-indigo-900 p-8 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden">
              <p className="text-[10px] opacity-60 uppercase font-black">Cumulative Points</p>
              <div className="text-6xl font-black italic">{(totalScore).toLocaleString()}</div>
              <div className="mt-4 inline-block px-6 py-2 rounded-full text-[10px] font-black border border-white/20 shadow-lg" style={{ backgroundColor: currentRankInfo.color }}>{currentRankInfo.icon} {currentRankInfo.label}</div>
              <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12">🎓</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-[2rem] border-2 border-amber-50 shadow-sm text-center">
                <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Best Score Sum</p>
                <p className="text-amber-600 text-2xl font-black italic">{(bestSum).toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-[2rem] border-2 border-orange-50 shadow-sm text-center">
                <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Total Attempts</p>
                <p className="text-orange-600 text-2xl font-black italic">{totalAttempts} <span className="text-[10px] not-italic">回</span></p>
              </div>
            </div>
            <button onClick={() => setScreen('GLOBAL_RANK')} className="w-full bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-black text-xs border-2 border-indigo-100 flex items-center justify-center gap-2 shadow-md transition-all"><Icons.Trophy /> 全体累計ランキングをチェック</button>
            <div className="flex-1 bg-white rounded-[2rem] border-2 border-slate-50 p-5 overflow-hidden flex flex-col shadow-inner">
              <p className="text-[10px] text-slate-400 border-b border-slate-50 pb-2 mb-3 font-black uppercase">Recent Activity</p>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {history.map((log, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] p-3 bg-slate-50 rounded-2xl font-bold">
                    <span className="text-slate-400 font-black">{
                      log.createdAt?.toDate
                        ? `${log.createdAt.toDate().getMonth()+1}/${log.createdAt.toDate().getDate()}`
                        : (typeof log.createdAt === 'number'
                          ? `${new Date(log.createdAt).getMonth()+1}/${new Date(log.createdAt).getDate()}`
                          : '-')
                    }</span>
                    <span className="truncate flex-1 px-4 text-slate-600 italic">{log.category}</span>
                    <span className="text-indigo-700 font-black">{(log.score || 0).toLocaleString()} pt</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setScreen('TITLE')} className="mt-2 w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg">BACK TO HOME</button>
          </div>
        );
      case 'GLOBAL_RANK':
        return (
          <div className="flex-1 flex flex-col overflow-hidden space-y-4 animate-in slide-in-from-bottom">
            <h2 className="text-2xl text-center text-indigo-900 italic font-black uppercase">Global Rankings</h2>
            <div className="flex gap-2 p-1 bg-indigo-50 rounded-2xl">
              {['best', 'score', 'sessions'].map(tab => (
                <button key={tab} onClick={() => setGlobalRankTab(tab)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${globalRankTab === tab ? 'bg-indigo-700 text-white shadow-md' : 'text-indigo-400 hover:bg-white/50'}`}>
                  {tab === 'best' ? 'ベスト計' : tab === 'score' ? '累計スコア' : '挑戦数'}
                </button>
              ))}
            </div>
            <div className="flex-1 bg-indigo-50/30 rounded-[2.5rem] p-5 overflow-hidden flex flex-col border border-indigo-100 shadow-inner">
              <RankingList list={sortedGlobals} type={globalRankTab} currentUserId={user?.uid} />
            </div>
            <button onClick={() => setScreen('DASHBOARD')} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase active:scale-95 shadow-lg">戻る</button>
          </div>
        );
      default: return <LoadingScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 font-sans flex flex-col items-center select-none overflow-hidden touch-manipulation">
      <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden relative border-x border-indigo-100">
        <div className="bg-indigo-700 px-4 py-3 text-white flex justify-between items-center shadow-md z-[60]">
          <span className="italic font-black text-xs tracking-widest uppercase">ENGLISH KNOCK v3</span>
          {screen === 'GAME' && <div className="bg-orange-500 px-4 py-1 rounded-full text-sm font-black border-2 border-white/30">{timeLeft}s</div>}
          {screen === 'GAME' && <button onClick={() => setIsQuitModalOpen(true)} className="ml-2 text-2xl font-bold p-1">×</button>}
        </div>
        <div className="flex-1 overflow-hidden relative p-4 flex flex-col">{renderScreen()}</div>
        
        {isQuitModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
            <div className="bg-white rounded-[2.5rem] p-8 w-full text-center shadow-2xl border-4 border-indigo-50 animate-in zoom-in">
              <div className="text-4xl mb-4">⚾</div>
              <p className="font-black text-xl mb-6 text-slate-700 leading-relaxed">ゲームを中断して<br/>ホームに戻りますか？</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsQuitModalOpen(false)} className="bg-slate-100 py-4 rounded-2xl font-black text-slate-500">続ける</button>
                <button onClick={() => { setIsQuitModalOpen(false); setScreen('TITLE'); }} className="bg-rose-500 py-4 rounded-2xl font-black text-white shadow-lg">中断する</button>
              </div>
            </div>
          </div>
        )}
        {runtimeError && (
          <div className="absolute inset-0 z-[200] bg-black/80 text-white p-4 overflow-auto">
            <div className="text-xs font-bold uppercase tracking-widest text-rose-300 mb-2">Runtime Error</div>
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {runtimeError.message}
              {runtimeError.stack ? `\n\n${runtimeError.stack}` : ''}
            </pre>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');
        body { margin: 0; padding: 0; font-family: 'M PLUS Rounded 1c', sans-serif; background: #e0e7ff; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .animate-in { animation: 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67) both; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .zoom-in { animation-name: zoomIn; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation-name: fadeIn; }
        @keyframes slideInFromBottom { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .slide-in-from-bottom { animation-name: slideInFromBottom; }
        @keyframes rainbowPulse { 0% { background-color: rgba(251, 191, 36, 0.1); } 50% { background-color: rgba(99, 102, 241, 0.1); } 100% { background-color: rgba(251, 191, 36, 0.1); } }
        .animate-rainbow-pulse { animation: rainbowPulse 3s infinite; }
        @keyframes shine { 0% { transform: skewX(-12deg) translateX(-100%); } 100% { transform: skewX(-12deg) translateX(200%); } }
        .animate-shine { animation: shine 2s infinite linear; }
      `}</style>
    </div>
  );
}

function CountdownTimer({ onComplete }) {
  const [count, setCount] = React.useState(3);
  React.useEffect(() => {
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
      <div key={count} className="text-[12rem] leading-none drop-shadow-2xl animate-in zoom-in font-black text-indigo-700">{count}</div>
      <p className="text-slate-400 uppercase tracking-[0.6em] text-xs font-black animate-pulse">Wait Field...</p>
    </div>
  );
}
