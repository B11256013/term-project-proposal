import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Tractor, Leaf, Droplets, Bug, Sprout, LogOut, Trash2, Edit2, Settings, Plus, X, Save, Thermometer, CloudRain, Activity, LayoutDashboard, History, ClipboardCheck } from 'lucide-react';

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

const script = document.createElement('script');
script.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(script);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('farm_auth') === 'true');
  const [inputPassword, setInputPassword] = useState('');
  const [systemPassword, setSystemPassword] = useState('1234');
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState([]);
  // 表單狀態更新：加入 crop(作物), material(資材), 預設 taskType 為 '灌溉'
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    taskType: '灌溉', 
    field: '', 
    crop: '', 
    material: '', 
    amount: '', 
    note: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

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
    if (!formData.field) return alert('請填寫田區地段！');
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'farm_logs', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'farm_logs'), formData);
      }
      setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        taskType: '灌溉', field: '', crop: '', material: '', amount: '', note: '' 
      });
      setActiveTab('history');
    } catch (err) { alert('操作失敗：' + err.message); }
    setLoading(false);
  };

  const handleEdit = (log) => {
    setFormData({ 
      date: log.date, 
      taskType: log.taskType || log.type || '灌溉', // 兼容舊資料
      field: log.field || log.area || '', 
      crop: log.crop || '',
      material: log.material || '',
      amount: log.amount || '', 
      note: log.note || '' 
    });
    setEditingId(log.id);
    setActiveTab('dashboard');
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) await deleteDoc(doc(db, 'farm_logs', id));
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCount = logs.filter(l => l.date === today).length;
  // 檢查是否有包含「病蟲害」關鍵字
  const pestCount = logs.filter(l => (l.taskType || l.type || '').includes('病蟲害')).length;

  // 動態萃取歷史紀錄 (Datalist 來源)
  const uniqueFields = Array.from(new Set(logs.map(l => l.field || l.area).filter(Boolean)));
  const uniqueCrops = Array.from(new Set(logs.map(l => l.crop).filter(Boolean)));
  const uniqueMaterials = Array.from(new Set(logs.map(l => l.material).filter(Boolean)));

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-green-800 z-50 flex flex-col items-center justify-center">
        <Activity className="animate-pulse text-green-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-white tracking-wider">有機驗證資料庫連線中...</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-green-900/70 backdrop-blur-sm"></div>
        <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10 border border-white/20">
          <div className="bg-gradient-to-tr from-green-600 to-emerald-400 w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-6">
            <ClipboardCheck className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">數位有機農事紀錄簿</h1>
          <p className="text-gray-500 mb-8 font-medium">符合有機生產/產銷履歷規範</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input 
              type="password" placeholder="請輸入授權密碼" name="farm_password"
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
      <aside className="w-20 lg:w-64 bg-gray-900 text-gray-300 flex flex-col transition-all duration-300 fixed h-full z-20">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800">
          <div className="bg-green-500 p-2 rounded-xl"><Sprout className="text-white" size={24}/></div>
          <span className="font-bold text-white text-xl hidden lg:block tracking-wide">Organic Farm</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'hover:bg-gray-800 hover:text-white'}`}>
            <LayoutDashboard size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block font-medium">作業登錄看板</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'hover:bg-gray-800 hover:text-white'}`}>
            <History size={22} className="mx-auto lg:mx-0" /> <span className="hidden lg:block font-medium">數位生產履歷</span>
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

      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 h-screen overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{activeTab === 'dashboard' ? '有機作業登錄看板' : '數位生產履歷庫'}</h2>
            <p className="text-gray-500 mt-1">依據有機生產工作紀錄簿格式建置</p>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
            <div className="flex items-center gap-2"><Thermometer size={18} className="text-orange-500"/> <span className="font-bold">28°C</span></div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2"><CloudRain size={18} className="text-blue-500"/> <span className="font-bold">65%</span></div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-gray-500 font-medium mb-2 flex items-center gap-2"><Tractor size={18}/> 今日完成作業</p>
                  <p className="text-4xl font-extrabold text-gray-800">{todayCount} <span className="text-base font-normal text-gray-400">項紀錄</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-gray-500 font-medium mb-2 flex items-center gap-2"><ClipboardCheck size={18}/> 履歷總筆數</p>
                  <p className="text-4xl font-extrabold text-gray-800">{logs.length} <span className="text-base font-normal text-gray-400">筆資料</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-red-500 font-medium mb-2 flex items-center gap-2"><Bug size={18}/> 病蟲害防治作業</p>
                  <p className="text-4xl font-extrabold text-red-600">{pestCount} <span className="text-base font-normal text-red-300">次紀錄</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                {editingId ? <><Edit2 className="text-blue-500" /> 編輯工作紀錄</> : <><Plus className="text-green-500" /> 新增工作日誌</>}
              </h3>
              
              {/* Datalists 提供智慧輸入建議 */}
              <datalist id="history-fields">{uniqueFields.map((v, i) => <option key={i} value={v} />)}</datalist>
              <datalist id="history-crops">{uniqueCrops.map((v, i) => <option key={i} value={v} />)}</datalist>
              <datalist id="history-materials">{uniqueMaterials.map((v, i) => <option key={i} value={v} />)}</datalist>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* 第一列：日期與作業類型 */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作業日期</label>
                  <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="md:col-span-8">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作業內容 (依有機規範)</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.taskType} onChange={(e)=>setFormData({...formData, taskType: e.target.value})}>
                    <optgroup label="栽培與水土管理">
                      <option value="整地">整地</option>
                      <option value="播種/定植">播種 / 定植 / 補植</option>
                      <option value="中耕培土">中耕培土</option>
                      <option value="灌溉">灌溉</option>
                    </optgroup>
                    <optgroup label="肥培與病蟲草害">
                      <option value="施基肥">施基肥</option>
                      <option value="施追肥">施追肥 / 液肥</option>
                      <option value="病蟲害防治">病蟲害防治</option>
                      <option value="雜草防除">雜草防除 (除草)</option>
                    </optgroup>
                    <optgroup label="植株管理與採收">
                      <option value="整枝/修剪">整枝 / 蔓 / 修剪</option>
                      <option value="疏花果/套袋">疏花果 / 套袋</option>
                      <option value="採收">採收</option>
                      <option value="採後處理">採後處理 (選別/分級)</option>
                    </optgroup>
                    <optgroup label="場地與設備維護">
                      <option value="場地清潔">場地清潔 (包裝場/倉庫)</option>
                      <option value="設備檢修">設備檢修 / 保養</option>
                      <option value="其他">其他</option>
                    </optgroup>
                  </select>
                </div>

                {/* 第二列：田區、作物、資材 */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">田區地段 / 設施編號</label>
                  <input type="text" required list="history-fields" autoComplete="on" placeholder="例：A區溫室" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.field} onChange={(e)=>setFormData({...formData, field: e.target.value})} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作物 / 品種名</label>
                  <input type="text" list="history-crops" autoComplete="on" placeholder="例：玉女小番茄" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.crop} onChange={(e)=>setFormData({...formData, crop: e.target.value})} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">使用資材 / 設備名稱</label>
                  <input type="text" list="history-materials" autoComplete="on" placeholder="例：自製液肥、割草機..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.material} onChange={(e)=>setFormData({...formData, material: e.target.value})} />
                </div>

                {/* 第三列：數量與備註 */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">施用量 / 採收量</label>
                  <input type="text" placeholder="例：50公斤、200倍稀釋" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.amount} onChange={(e)=>setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">作業備註事項</label>
                  <input type="text" placeholder="記錄發現病狀、氣候影響或特殊狀況..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50" value={formData.note} onChange={(e)=>setFormData({...formData, note: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button type="submit" className={`w-full p-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-1 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}>
                    <Save size={18} /> {editingId ? '更新履歷' : '存入履歷'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 p-5 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center gap-2"><History size={20}/> 數位生產履歷庫</h2>
              <span className="text-gray-400 text-sm">共 {logs.length} 筆資料</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                    <th className="p-4 font-medium w-28">日期</th>
                    <th className="p-4 font-medium">作業內容</th>
                    <th className="p-4 font-medium">田區 / 作物</th>
                    <th className="p-4 font-medium">資材與使用量</th>
                    <th className="p-4 font-medium w-1/4">備註</th>
                    <th className="p-4 font-medium text-right">管理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400">目前尚無履歷紀錄</td></tr>
                  ) : (
                    logs.map(log => {
                      const task = log.taskType || log.type || '';
                      const isAlert = task.includes('病蟲') || task.includes('異常');
                      const isHarvest = task.includes('收');
                      
                      return (
                        <tr key={log.id} className="hover:bg-green-50/30 transition-colors group">
                          <td className="p-4 text-gray-600 text-sm whitespace-nowrap">{log.date}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-max ${isAlert ? 'bg-red-50 text-red-600 border border-red-100' : isHarvest ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                              {isAlert ? <Bug size={14}/> : isHarvest ? <Leaf size={14}/> : <Droplets size={14}/>} {task}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-800">{log.field || log.area || '-'}</div>
                            <div className="text-xs text-gray-500 mt-1">{log.crop || ''}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-700">{log.material || '-'}</div>
                            {log.amount && <div className="text-xs text-gray-500 mt-1">量：{log.amount}</div>}
                          </td>
                          <td className="p-4 text-gray-500 text-sm">{log.note || '-'}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(log)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(log.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

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
