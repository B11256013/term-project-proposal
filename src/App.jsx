import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Tractor, Leaf, Droplets, Bug, Sprout, LogOut, Trash2, Edit2, Settings, Plus, X, Save, Thermometer, CloudRain, Wind, Activity, LayoutDashboard, History } from 'lucide-react';

// --- 1. 請在此貼上你專屬的 Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyB57fZXAX31e9ROg-j8tq36qQkWZhMfx4Q",
  authDomain: "smart-farm-2c3ef.firebaseapp.com",
  projectId: "smart-farm-2c3ef",
  storageBucket: "smart-farm-2c3ef.firebasestorage.app",
  messagingSenderId: "225983511918",
  appId: "1:225983511918:web:1459cf6b669f781740157f",
  measurementId: "G-YZR8PZYWGN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 動態載入 Tailwind CSS
const script = document.createElement('script');
script.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(script);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('farm_auth') === 'true');
  const [inputPassword, setInputPassword] = useState('');
  const [systemPassword, setSystemPassword] = useState('1234');
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: '澆水', area: '', amount: '', note: '' });
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 控制側邊欄切換

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'auth');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().password) setSystemPassword(docSnap.data().password);
      else await setDoc(docRef, { password: '1234' });
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPassword === systemPassword) {
      localStorage.setItem('farm_auth', 'true');
      setIsLoggedIn(true);
    } else alert('密碼錯誤！');
  };

  const handleLogout = () => {
    localStorage.removeItem('farm_auth');
    setIsLoggedIn(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await updateDoc(doc(db, 'settings', 'auth'), { password: newPassword });
      setSystemPassword(newPassword);
      alert('密碼修改成功！');
      setShowSettings(false);
      setNewPassword('');
    } catch (err) { alert('修改失敗：' + err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.area) return alert('請填寫田區！');
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'farm_logs', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'farm_logs'), formData);
      }
      setFormData({ date: new Date().toISOString().split('T')[0], type: '澆水', area: '', amount: '', note: '' });
      setActiveTab('history'); // 新增完自動跳轉到歷史紀錄
    } catch (err) { alert('操作失敗：' + err.message); }
    setLoading(false);
  };

  const handleEdit = (log) => {
    setFormData({ date: log.date, type: log.type, area: log.area, amount: log.amount, note: log.note });
    setEditingId(log.id);
    setActiveTab('dashboard'); // 跳回表單頁面
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) await deleteDoc(doc(db, 'farm_logs', id));
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCount = logs.filter(l => l.date === today).length;
  const pestCount = logs.filter(l => l.type === '病蟲害防治').length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-green-800 z-50 flex flex-col items-center justify-center">
        <Activity className="animate-pulse text-green-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-white tracking-wider">VISLAB 農場系統連線中...</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm"></div>
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10 border border-white/20">
          <div className="bg-gradient-to-tr from-green-600 to-emerald-400 w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-6">
            <Leaf className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">智慧農場中控台</h1>
          <p className="text-gray-500 mb-8 font-medium">IoT 環境感知與自動紀錄系統</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input 
              type="password" placeholder="請輸入管理員密碼" 
              className="w-full p-4 bg-white/80 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/30 outline-none text-center tracking-[0.5em] text-lg transition-all"
              value={inputPassword} onChange={(e) => setInputPassword(e.target.value)}
            />
            <button className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg transform hover:-translate-y-1">
              系統登入
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* 左側邊欄 (Sidebar) */}
      <aside className="w-20 lg:w-64 bg-gray-900 text-gray-300 flex flex-col transition-all duration-300 fixed h-full z-20">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800">
          <div className="bg-green-500 p-2 rounded-xl"><Sprout className="text-white" size={24}/></div>
          <span className="font-bold text-white text-xl hidden lg:block tracking-wide">Smart Farm</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'hover:bg-gray-800 hover:text-white'}`}>
            <LayoutDashboard size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block font-medium">控制面板</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'hover:bg-gray-800 hover:text-white'}`}>
            <History size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block font-medium">生產歷程庫</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-all">
            <Settings size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block">系統設定</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all">
            <LogOut size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block">安全登出</span>
          </button>
        </div>
      </aside>

      {/* 右側主內容區 */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 h-screen overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{activeTab === 'dashboard' ? '農場中控面板' : '生產歷程資料庫'}</h2>
            <p className="text-gray-500 mt-1">Neipu, Pingtung • 即時資料同步中</p>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
            <div className="flex items-center gap-2"><Thermometer size={18} className="text-orange-500"/> <span className="font-bold">28°C</span></div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2"><CloudRain size={18} className="text-blue-500"/> <span className="font-bold">65%</span></div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8 animate-fade-in-up">
            {/* 數據儀表板 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-gray-500 font-medium mb-2 flex items-center gap-2"><Tractor size={18}/> 今日作業總計</p>
                  <p className="text-4xl font-extrabold text-gray-800">{todayCount} <span className="text-base font-normal text-gray-400">筆紀錄</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-gray-500 font-medium mb-2 flex items-center gap-2"><Droplets size={18}/> 總紀錄數</p>
                  <p className="text-4xl font-extrabold text-gray-800">{logs.length} <span className="text-base font-normal text-gray-400">筆紀錄</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-red-500 font-medium mb-2 flex items-center gap-2"><Bug size={18}/> 異常通報 / 病蟲害</p>
                  <p className="text-4xl font-extrabold text-red-600">{pestCount} <span className="text-base font-normal text-red-300">次通報</span></p>
                </div>
              </div>
            </div>

            {/* 表單區塊 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                {editingId ? <><Edit2 className="text-blue-500" /> 編輯紀錄</> : <><Plus className="text-green-500" /> 快速農事登錄</>}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作業日期</label>
                  <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作業類型</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})}>
                    <option>自動澆水</option><option>施肥</option><option>病蟲害防治</option><option>採收</option><option>感測器維護</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">目標田區 / 作物</label>
                  <input type="text" required placeholder="例：溫室A棟-番茄" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" value={formData.area} onChange={(e)=>setFormData({...formData, area: e.target.value})} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">數值 / 參數</label>
                  <input type="number" placeholder="例：設定濕度 60" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" value={formData.amount} onChange={(e)=>setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="md:col-span-10">
                  <label className="block text-sm font-medium text-gray-600 mb-2">執行細節備註 (AI 摘要輔助)</label>
                  <input type="text" placeholder="輸入詳細資訊，例如：系統自動觸發灌溉..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" value={formData.note} onChange={(e)=>setFormData({...formData, note: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button type="submit" className={`w-full p-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-1 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}>
                    <Save size={18} /> {editingId ? '更新資料' : '寫入系統'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* 歷史紀錄區塊 */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 p-5 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center gap-2"><History size={20}/> 雲端歷程資料庫</h2>
              <span className="text-gray-400 text-sm">共 {logs.length} 筆資料</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                    <th className="p-4 font-medium">作業日期</th>
                    <th className="p-4 font-medium">狀態/類型</th>
                    <th className="p-4 font-medium">田區/作物</th>
                    <th className="p-4 font-medium">數值</th>
                    <th className="p-4 font-medium w-1/3">備註說明</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400">目前雲端尚無紀錄</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-green-50/30 transition-colors group">
                        <td className="p-4 text-gray-600 text-sm">{log.date}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-max ${log.type === '病蟲害防治' ? 'bg-red-50 text-red-600 border border-red-100' : log.type === '採收' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {log.type === '病蟲害防治' ? <Bug size={14}/> : log.type === '採收' ? <Leaf size={14}/> : <Droplets size={14}/>} {log.type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-800">{log.area}</td>
                        <td className="p-4 text-gray-600">{log.amount || '-'}</td>
                        <td className="p-4 text-gray-500 text-sm truncate max-w-xs">{log.note || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(log)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(log.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 設定 Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative border border-gray-100 animate-fade-in-up">
            <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            <div className="bg-gray-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Settings className="text-gray-600" size={24}/>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">安全設定</h2>
            <p className="text-gray-500 text-sm mb-6">修改管理員存取密碼</p>
            <form onSubmit={handleChangePassword}>
              <input 
                type="password" required placeholder="請輸入新密碼" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-gray-900 outline-none transition-all text-center tracking-widest"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="w-full bg-gray-900 text-white p-3 rounded-xl font-bold hover:bg-black transition-all">更新密碼</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
