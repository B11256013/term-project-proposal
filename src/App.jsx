import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Leaf, Droplets, Thermometer, Tractor, LogOut, Trash2, CheckCircle, Plus } from 'lucide-react';

// --- 1. 請在此替換成你自己的 Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyB57fZXAX31e9ROg-j8tq36qQkWZhMfx4Q",
  authDomain: "smart-farm-2c3ef.firebaseapp.com",
  projectId: "smart-farm-2c3ef",
  storageBucket: "smart-farm-2c3ef.firebasestorage.app",
  messagingSenderId: "225983511918",
  appId: "1:225983511918:web:1459cf6b669f781740157f"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 注入 Tailwind CSS (解決你清空 App.css 的問題)
const script = document.createElement('script');
script.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(script);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('farm_auth') === 'true');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: '澆水', area: '', note: '' });

  // 匿名登入邏輯
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) signInAnonymously(auth);
    });
    
    if (isLoggedIn) {
      const q = query(collection(db, 'farm_logs'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // 登入驗證 (教材要求：預設密碼 1234)
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '1234') {
      localStorage.setItem('farm_auth', 'true');
      setIsLoggedIn(true);
    } else {
      alert('密碼錯誤！請輸入 1234');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farm_auth');
    setIsLoggedIn(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'farm_logs'), formData);
      alert('紀錄成功！');
      setFormData({ ...formData, area: '', note: '' });
    } catch (err) { alert('儲存失敗：' + err.message); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">系統載入中...</div>;

  // --- 登入畫面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <Leaf className="mx-auto text-green-600 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-6">智慧農場管理系統</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" placeholder="請輸入系統密碼 (1234)" 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700">進入系統</button>
          </form>
          <p className="mt-4 text-gray-400 text-sm">B11256013 蕭利家 製作</p>
        </div>
      </div>
    );
  }

  // --- 主畫面 ---
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-green-600 text-white p-4 shadow-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2"><Tractor /> 智慧農場工作看板</h1>
        <button onClick={handleLogout} className="flex items-center gap-1 bg-green-700 px-3 py-1 rounded-lg text-sm"><LogOut size={16}/> 登出</button>
      </nav>

      <main className="max-w-4xl mx-auto px-4">
        {/* 統計看板 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">今日紀錄</p>
            <p className="text-2xl font-bold">{logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">本月工作</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">異常預警</p>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
        </div>

        {/* 新增紀錄表單 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="text-green-600" /> 快速工作錄入</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" className="p-3 border rounded-xl" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} />
            <select className="p-3 border rounded-xl" value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})}>
              <option>澆水</option><option>施肥</option><option>病蟲害防治</option><option>採收</option>
            </select>
            <input type="text" placeholder="作物區域 (如：鳳梨 A 區)" className="p-3 border rounded-xl md:col-span-2" value={formData.area} onChange={(e)=>setFormData({...formData, area: e.target.value})} />
            <textarea placeholder="詳細備註..." className="p-3 border rounded-xl md:col-span-2" value={formData.note} onChange={(e)=>setFormData({...formData, note: e.target.value})}></textarea>
            <button className="md:col-span-2 bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700">儲存紀錄</button>
          </form>
        </section>

        {/* 歷史紀錄列表 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">生產歷程紀錄</h2>
          <div className="space-y-3">
            {logs.length === 0 ? <p className="text-center text-gray-400 py-10">尚無紀錄</p> : logs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-4 border-b hover:bg-gray-50 transition">
                <div>
                  <p className="font-bold text-gray-800">{log.type} - {log.area}</p>
                  <p className="text-xs text-gray-400">{log.date} | {log.note}</p>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'farm_logs', log.id))} className="text-red-300 hover:text-red-600"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
