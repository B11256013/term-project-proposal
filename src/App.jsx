import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Tractor, Leaf, Droplets, Bug, Sprout, LogOut, Trash2, Edit2, Settings, Plus, X, Save } from 'lucide-react';

// --- Firebase 配置 (使用你提供的 API Key) ---
const firebaseConfig = {
  apiKey: "AIzaSyCyiy4q9kzacnAaB-oURmXe00tRZ_ocf7M",
  authDomain: "test-ff8f4.firebaseapp.com",
  projectId: "test-ff8f4",
  storageBucket: "test-ff8f4.firebasestorage.app",
  messagingSenderId: "265340130264",
  appId: "1:265340130264:web:9f6ef17b118d0b455258ad",
  measurementId: "G-6Q5L31J9PK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 動態載入 Tailwind CSS
const script = document.createElement('script');
script.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(script);

export default function App() {
  // --- 狀態管理 ---
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('farm_auth') === 'true');
  const [inputPassword, setInputPassword] = useState('');
  const [systemPassword, setSystemPassword] = useState('1234'); // 預設密碼
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: '澆水', area: '', amount: '', note: '' });
  const [editingId, setEditingId] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // --- 資料抓取與初始化 ---
  useEffect(() => {
    // 取得系統密碼設定
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'auth');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().password) {
        setSystemPassword(docSnap.data().password);
      } else {
        await setDoc(docRef, { password: '1234' });
      }
    };

    if (isLoggedIn) {
      fetchSettings();
      const q = query(collection(db, 'farm_logs'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      fetchSettings().then(() => setLoading(false));
    }
  }, [isLoggedIn]);

  // --- 登入與設定邏輯 ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPassword === systemPassword) {
      localStorage.setItem('farm_auth', 'true');
      setIsLoggedIn(true);
    } else {
      alert('密碼錯誤！');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farm_auth');
    setIsLoggedIn(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return alert('新密碼不能為空');
    try {
      await updateDoc(doc(db, 'settings', 'auth'), { password: newPassword });
      setSystemPassword(newPassword);
      alert('密碼修改成功！請牢記新密碼。');
      setShowSettings(false);
      setNewPassword('');
    } catch (err) { alert('密碼修改失敗：' + err.message); }
  };

  // --- 表單 CRUD 邏輯 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.area) return alert('請填寫田區/作物名稱！');
    
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'farm_logs', editingId), formData);
        setEditingId(null);
        alert('更新成功！');
      } else {
        await addDoc(collection(db, 'farm_logs'), formData);
        alert('新增成功！');
      }
      setFormData({ date: new Date().toISOString().split('T')[0], type: '澆水', area: '', amount: '', note: '' });
    } catch (err) { alert('操作失敗：' + err.message); }
    setLoading(false);
  };

  const handleEdit = (log) => {
    setFormData({ date: log.date, type: log.type, area: log.area, amount: log.amount, note: log.note });
    setEditingId(log.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      await deleteDoc(doc(db, 'farm_logs', id));
    }
  };

  // --- 統計數據計算 ---
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  const todayCount = logs.filter(l => l.date === today).length;
  const monthCount = logs.filter(l => l.date.startsWith(thisMonth)).length;
  const pestCount = logs.filter(l => l.type === '病蟲害防治').length;

  // --- UI: 載入中遮罩 ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-green-50 z-50 flex flex-col items-center justify-center">
        <Tractor className="animate-bounce text-green-600 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-green-800">系統載入中...</h2>
        <p className="text-gray-500 mt-2">正在同步雲端農場數據</p>
      </div>
    );
  }

  // --- UI: 登入畫面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">智慧農場管理系統</h1>
          <p className="text-gray-500 mb-6 text-sm">請輸入授權密碼以進入工作站</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" placeholder="請輸入密碼" 
              className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-center tracking-[0.5em] text-lg"
              value={inputPassword} onChange={(e) => setInputPassword(e.target.value)}
            />
            <button className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">
              進入系統
            </button>
          </form>
          <p className="mt-6 text-gray-400 text-xs">期末專案 - 自動工作紀錄系統</p>
        </div>
      </div>
    );
  }

  // --- UI: 主畫面 ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* 導覽列 */}
      <nav className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2"><Tractor /> 農場看板</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 bg-green-700 rounded-lg hover:bg-green-800"><Settings size={18}/></button>
            <button onClick={handleLogout} className="p-2 bg-green-700 rounded-lg hover:bg-red-600 transition"><LogOut size={18}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        {/* 統計看板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">今日作業紀錄</p>
              <p className="text-3xl font-bold text-gray-800">{todayCount} <span className="text-sm font-normal text-gray-400">筆</span></p>
            </div>
            <div className="bg-green-50 p-3 rounded-full"><Sprout className="text-green-500"/></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">本月累計紀錄</p>
              <p className="text-3xl font-bold text-gray-800">{monthCount} <span className="text-sm font-normal text-gray-400">筆</span></p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><Droplets className="text-blue-500"/></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">病蟲害通報</p>
              <p className="text-3xl font-bold text-red-600">{pestCount} <span className="text-sm font-normal text-gray-400">次</span></p>
            </div>
            <div className="bg-red-50 p-3 rounded-full"><Bug className="text-red-500"/></div>
          </div>
        </div>

        {/* 新增/編輯表單 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            {editingId ? <><Edit2 className="text-blue-500" /> 編輯紀錄</> : <><Plus className="text-green-500" /> 新增農事紀錄</>}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1 pl-1">日期</label>
              <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1 pl-1">作業類型</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})}>
                <option>澆水</option><option>施肥</option><option>病蟲害防治</option><option>採收</option><option>除草</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1 pl-1">田區 / 作物</label>
              <input type="text" required placeholder="例：鳳梨A區" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.area} onChange={(e)=>setFormData({...formData, area: e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1 pl-1">數量 / 使用量</label>
              <input type="number" placeholder="例：50" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.amount} onChange={(e)=>setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="md:col-span-10">
              <label className="block text-xs text-gray-500 mb-1 pl-1">詳細備註 (資材、病狀等)</label>
              <input type="text" placeholder="輸入詳細資訊..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.note} onChange={(e)=>setFormData({...formData, note: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button type="submit" className={`w-full p-3 rounded-xl font-bold text-white transition shadow-md flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>
                <Save size={18} /> {editingId ? '儲存' : '紀錄'}
              </button>
            </div>
          </form>
        </section>

        {/* 歷史紀錄列表 */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
            <Tractor size={18} className="text-gray-500" />
            <h2 className="font-bold text-gray-700">生產歷程紀錄</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <div className="p-10 text-center text-gray-400">目前尚無任何農事紀錄</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-4 hover:bg-green-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.type === '病蟲害防治' ? 'bg-red-100 text-red-600' : log.type === '採收' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {log.type}
                      </span>
                      <span className="font-bold text-gray-800 text-lg">{log.area}</span>
                      <span className="text-sm text-gray-400">{log.date}</span>
                    </div>
                    {(log.amount || log.note) && (
                      <div className="text-sm text-gray-500 pl-1 mt-1 flex gap-4">
                        {log.amount && <span>數量/用量: <span className="font-medium text-gray-700">{log.amount}</span></span>}
                        {log.note && <span>備註: <span className="text-gray-600">{log.note}</span></span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button onClick={() => handleEdit(log)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(log.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 設定 Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="text-gray-500"/> 系統設定</h2>
            <form onSubmit={handleChangePassword}>
              <label className="block text-sm text-gray-600 mb-2">修改登入密碼</label>
              <input 
                type="password" required placeholder="輸入新密碼" 
                className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold hover:bg-gray-900 transition">確認修改</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
