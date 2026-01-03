import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  Music, 
  Upload, 
  FileAudio, 
  LogOut, 
  Play, 
  Pause, 
  Layers, 
  Activity, 
  Download,
  CheckCircle,
  Loader2,
  Music2
} from 'lucide-react';

// --- Firebase Configuration ---
// 実際のデプロイ時には環境変数等から値を取得してください
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'demo-app';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Components ---

// 1. Header Component
const Header = ({ user, onLogout }) => (
  <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-2 text-indigo-400">
        <Music className="w-8 h-8" />
        <h1 className="text-xl font-bold text-white tracking-tight">SonicSplit AI</h1>
      </div>
      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400 hidden sm:inline">ID: {user.uid.slice(0, 6)}...</span>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>ログアウト</span>
          </button>
        </div>
      )}
    </div>
  </header>
);

// 2. Upload Component
const UploadArea = ({ onFileUpload, isUploading }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer
        ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/50'}
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept="audio/*" 
        onChange={handleChange} 
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center animate-pulse text-indigo-400">
          <Loader2 className="w-12 h-12 mb-4 animate-spin" />
          <p className="text-lg font-medium">アップロード中...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <Upload className="w-12 h-12 mb-4 text-indigo-400" />
          <p className="text-lg font-medium text-white mb-2">音声ファイルをドラッグ＆ドロップ</p>
          <p className="text-sm">または クリックして選択 (MP3, WAV)</p>
          <p className="text-xs mt-4 text-slate-500">最大 10MB まで</p>
        </div>
      )}
    </div>
  );
};

// 3. Score Visualization (Mock)
const ScoreViewer = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg p-4 mt-4 shadow-lg overflow-x-auto">
      <h3 className="text-slate-900 font-bold mb-2 flex items-center">
        <Music2 className="w-5 h-5 mr-2 text-indigo-600" />
        AI生成スコアプレビュー
      </h3>
      <div className="min-w-[600px] h-48 relative border-l border-b border-slate-300 bg-slate-50">
        {/* Grid lines */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-full h-px bg-slate-200" style={{ top: `${i * 8.33}%` }}></div>
        ))}
        {[...Array(16)].map((_, i) => (
          <div key={i} className="absolute h-full w-px bg-slate-200" style={{ left: `${i * 6.25}%` }}></div>
        ))}
        
        {/* Mock Notes */}
        <div className="absolute top-[20%] left-[5%] w-[10%] h-[5%] bg-indigo-500 rounded-sm shadow-sm" title="C4"></div>
        <div className="absolute top-[15%] left-[15%] w-[10%] h-[5%] bg-indigo-500 rounded-sm shadow-sm" title="D4"></div>
        <div className="absolute top-[25%] left-[25%] w-[10%] h-[5%] bg-indigo-500 rounded-sm shadow-sm" title="E4"></div>
        <div className="absolute top-[20%] left-[35%] w-[10%] h-[5%] bg-indigo-500 rounded-sm shadow-sm"></div>
        
        <div className="absolute top-[50%] left-[50%] w-[15%] h-[5%] bg-rose-500 rounded-sm shadow-sm" title="Bass"></div>
        <div className="absolute top-[55%] left-[65%] w-[15%] h-[5%] bg-rose-500 rounded-sm shadow-sm"></div>

        {/* Playhead */}
        <div className="absolute top-0 bottom-0 left-[40%] w-0.5 bg-red-500 opacity-50"></div>
      </div>
      <div className="mt-2 flex justify-end">
        <button className="text-xs flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200">
          <Download className="w-3 h-3 mr-1" />
          MIDIをダウンロード
        </button>
      </div>
    </div>
  );
};

// 4. Track Item Component
const TrackItem = ({ type, progress, url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const colors = {
    Vocal: 'bg-purple-500',
    Drums: 'bg-emerald-500',
    Bass: 'bg-rose-500',
    Other: 'bg-amber-500'
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-3 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${colors[type] || 'bg-slate-500'}`}></div>
          <span className="font-medium text-slate-200">{type}</span>
        </div>
        {progress < 100 ? (
          <span className="text-xs text-indigo-400 font-mono animate-pulse">解析中... {progress}%</span>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={togglePlay}
              className="p-1.5 rounded-full bg-slate-700 hover:bg-indigo-600 transition-colors text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
      
      {/* Waveform Visualization Mock */}
      <div className="h-12 bg-slate-900 rounded overflow-hidden flex items-end space-x-[1px] opacity-80">
        {progress < 100 ? (
           <div className="w-full h-full flex items-center justify-center">
             <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
           </div>
        ) : (
          [...Array(60)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 ${colors[type] || 'bg-slate-500'}`} 
              style={{ height: `${30 + Math.random() * 70}%`, opacity: 0.7 }}
            ></div>
          ))
        )}
      </div>
      <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

// 5. Project Item
const ProjectCard = ({ project }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">{project.fileName}</h2>
          <p className="text-xs text-slate-400">作成日: {project.createdAt?.toDate().toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-2">
           {project.status === 'completed' ? (
             <span className="flex items-center text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
               <CheckCircle className="w-3 h-3 mr-1" /> 完了
             </span>
           ) : (
             <span className="flex items-center text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
               <Activity className="w-3 h-3 mr-1 animate-spin" /> 処理中
             </span>
           )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center mb-3 text-slate-400 text-sm uppercase tracking-wider font-semibold">
            <Layers className="w-4 h-4 mr-2" />
            分離トラック
          </div>
          {/* Mock Logic: In a real app, these URLs come from the backend. Here we use the original file for demo */}
          <TrackItem type="Vocal" progress={project.progress || 0} url={project.originalUrl} />
          <TrackItem type="Drums" progress={project.progress || 0} url={project.originalUrl} />
          <TrackItem type="Bass" progress={project.progress || 0} url={project.originalUrl} />
        </div>

        <div>
           <div className="flex items-center mb-3 text-slate-400 text-sm uppercase tracking-wider font-semibold">
            <Music className="w-4 h-4 mr-2" />
            スコア・MIDI
          </div>
          {project.status === 'completed' ? (
             <ScoreViewer isVisible={true} />
          ) : (
            <div className="h-full min-h-[150px] bg-slate-900/50 rounded-lg flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700">
               <Activity className="w-8 h-8 mb-2 animate-pulse" />
               <p className="text-sm">解析エンジン待機中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user) return;
    
    // Public demo data or private user data
    // Note: Using a user-specific path for privacy in demo
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projData);
      setLoadingProjects(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [user]);

  // File Upload Handler
  const handleFileUpload = async (file) => {
    if (!user) return;
    setIsUploading(true);

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `audio/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progress monitoring if needed
        }, 
        (error) => {
          console.error("Upload Error", error);
          setIsUploading(false);
        }, 
        async () => {
          // 2. Get URL & Create Firestore Record
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), {
            fileName: file.name,
            originalUrl: downloadURL,
            createdAt: serverTimestamp(),
            status: 'processing',
            progress: 0
          });

          setIsUploading(false);

          // 3. SIMULATION: Trigger "Backend Processing"
          // In a real app, a Cloud Function would trigger here.
          simulateBackendProcessing(docRef.id);
        }
      );
    } catch (error) {
      console.error("Error:", error);
      setIsUploading(false);
    }
  };

  // Mock Backend Processing Simulation
  const simulateBackendProcessing = (docId) => {
    if(!user) return;
    const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'projects', docId);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress > 100) {
        clearInterval(interval);
        updateDoc(projectRef, {
          status: 'completed',
          progress: 100,
          // In real app, these would be separate URLs generated by AI
          stems: {
            vocals: 'url_to_vocals',
            drums: 'url_to_drums',
            bass: 'url_to_bass'
          },
          midiUrl: 'url_to_midi'
        });
      } else {
        updateDoc(projectRef, { progress });
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header user={user} onLogout={() => signOut(auth)} />

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Intro Section */}
        <div className="text-center mb-10 mt-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
            音源を分離して、<br className="md:hidden"/>スコアにする。
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-lg">
            AIがあなたの音楽ファイルを解析。ボーカル、ドラム、ベースに分離し、MIDIスコアを自動生成します。
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <UploadArea onFileUpload={handleFileUpload} isUploading={isUploading} />
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-6">
            <h3 className="text-xl font-bold text-white">プロジェクト</h3>
            <span className="text-sm text-slate-500">{projects.length} 件の履歴</span>
          </div>

          {loadingProjects ? (
            <div className="text-center py-10 text-slate-500">
               <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
               読み込み中...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              <FileAudio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">プロジェクトがまだありません。</p>
              <p className="text-sm text-slate-500">上のエリアからファイルをアップロードしてください。</p>
            </div>
          ) : (
            projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-slate-900 text-center text-slate-600 text-sm">
        <p>&copy; 2024 SonicSplit AI Prototype. Powered by Firebase & React.</p>
      </footer>
    </div>
  );
}
