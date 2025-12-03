import React, { useState, useRef } from 'react';
import { Music, Layout, Type, Palette, Download, Wand2, Image as ImageIcon, Upload, Key } from 'lucide-react';
import { SongDetails, DesignConfig, BackgroundState } from './types';
import CanvasEditor, { CanvasEditorHandle } from './components/CanvasEditor';
import { generateBackgroundImage } from './services/geminiService';
import { Spinner } from './components/Spinner';

const PRESET_COLORS = [
  { label: 'ذهبي', value: '#fbbf24' },
  { label: 'أحمر', value: '#ef4444' },
  { label: 'سماوي', value: '#38bdf8' },
  { label: 'زمردي', value: '#34d399' },
  { label: 'بنفسجي', value: '#a78bfa' },
  { label: 'وردي', value: '#f472b6' },
  { label: 'برتقالي', value: '#fb923c' },
  { label: 'أبيض', value: '#ffffff' },
];

export default function App() {
  // --- State ---
  const [details, setDetails] = useState<SongDetails>({
    artistName: '',
    songName: '',
    credits: '',
  });

  const [config, setConfig] = useState<DesignConfig>({
    template: 'center-classic',
    fontFamily: 'Tajawal',
    primaryColor: '#fbbf24', // Amber 400
    overlayOpacity: 0.4,
  });

  const [background, setBackground] = useState<BackgroundState>({
    type: 'solid',
    value: '#1e1b4b', // Indigo 950
    isLoading: false,
  });

  const [promptMood, setPromptMood] = useState('Epic, Energetic, Neon');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<CanvasEditorHandle>(null);

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (key: keyof DesignConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackground({
          type: 'image',
          value: reader.result as string,
          isLoading: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApiKeyConfig = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
  };

  const handleGenerateBackground = async () => {
    if (!details.songName || !details.artistName) {
        setError('يرجى إدخال اسم الفنان واسم الأغنية أولاً');
        return;
    }

    // Ensure API Key is selected before generation
    if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
             try {
                 await (window as any).aistudio.openSelectKey();
             } catch (e) {
                 console.error("Key selection cancelled", e);
                 return;
             }
        }
    }
    
    setError(null);
    setBackground(prev => ({ ...prev, isLoading: true }));

    try {
      const imageUrl = await generateBackgroundImage(details.artistName, details.songName, promptMood);
      setBackground({
        type: 'generated',
        value: imageUrl,
        isLoading: false
      });
    } catch (err: any) {
      console.error(err);
      let msg = 'فشل في توليد الصورة.';
      const errStr = JSON.stringify(err) + (err.message || '');
      
      // Handle Permission Denied (403)
      if (errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) {
        msg = 'خطأ في الصلاحيات (403). يرجى اختيار مفتاح API صالح.';
        // Attempt to prompt for key again
        if ((window as any).aistudio) {
             await (window as any).aistudio.openSelectKey();
        }
      }
      
      setError(msg);
      setBackground(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-tajawal overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-[450px] bg-slate-800 border-l border-slate-700 h-screen overflow-y-auto custom-scrollbar shadow-xl z-10 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                 <Music className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                 <h1 className="text-xl font-bold text-white">مصمم المصغرات</h1>
                 <p className="text-xs text-slate-400">Mawja Thumbnails</p>
              </div>
            </div>
            <button 
              onClick={handleApiKeyConfig}
              className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
              title="API Key Settings"
            >
              <Key className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Section 1: Song Details */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4" />
              بيانات الأغنية
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1 text-slate-400">اسم الفنان</label>
                <input
                  type="text"
                  name="artistName"
                  value={details.artistName}
                  onChange={handleInputChange}
                  placeholder="محمد عبده"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all text-right"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">اسم الأغنية</label>
                <input
                  type="text"
                  name="songName"
                  value={details.songName}
                  onChange={handleInputChange}
                  placeholder="الأماكن"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all text-right"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">المنفذين / حقوق</label>
                <input
                  type="text"
                  name="credits"
                  value={details.credits}
                  onChange={handleInputChange}
                  placeholder="كلمات: ... ألحان: ..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all text-right"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Appearance */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              المظهر
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleConfigChange('template', 'center-classic')}
                className={`p-3 rounded-lg border text-sm text-center transition-all ${config.template === 'center-classic' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-600 hover:border-slate-500'}`}
              >
                كلاسيكي وسط
              </button>
              <button 
                onClick={() => handleConfigChange('template', 'modern-split')}
                 className={`p-3 rounded-lg border text-sm text-center transition-all ${config.template === 'modern-split' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-600 hover:border-slate-500'}`}
              >
                عصري مقسم
              </button>
              <button 
                 onClick={() => handleConfigChange('template', 'minimal-bottom')}
                 className={`col-span-2 p-3 rounded-lg border text-sm text-center transition-all ${config.template === 'minimal-bottom' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-600 hover:border-slate-500'}`}
              >
                بسيط جانبي
              </button>
            </div>

            <div className="space-y-3">
               <div>
                <label className="block text-xs mb-1 text-slate-400">الخط العربي</label>
                <select 
                  value={config.fontFamily}
                  onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Tajawal">تجوال (Tajawal)</option>
                  <option value="Cairo">القاهرة (Cairo)</option>
                  <option value="Amiri">أميري (Amiri)</option>
                </select>
              </div>

               <div>
                <label className="block text-xs mb-2 text-slate-400">اللون الأساسي (للفنان والزخرفة)</label>
                
                {/* Color Presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleConfigChange('primaryColor', color.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        config.primaryColor.toLowerCase() === color.value.toLowerCase()
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
                      }`}
                      title={color.label}
                    >
                      <div 
                        className="w-full h-4 rounded-full shadow-sm mb-1" 
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">{color.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 bg-slate-700/50 p-2 rounded-lg border border-slate-600">
                   <div className="flex-1 text-xs text-slate-400">أو اختر لوناً مخصصاً:</div>
                   <span className="text-xs font-mono text-slate-300 dir-ltr uppercase">{config.primaryColor}</span>
                   <input 
                    type="color" 
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                   />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-400 flex justify-between">
                   <span>تعتيم الخلفية</span>
                   <span>{Math.round(config.overlayOpacity * 100)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="0.9" step="0.1"
                  value={config.overlayOpacity}
                  onChange={(e) => handleConfigChange('overlayOpacity', parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Background */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              الخلفية
            </h2>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="cursor-pointer border border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-slate-700 transition-all text-center">
                 <Upload className="w-5 h-5 text-slate-400" />
                 <span>رفع صورة</span>
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <div className="border border-slate-600 rounded-lg p-4 flex flex-col gap-2">
                 <span className="text-slate-400 text-center">لون ثابت</span>
                 <input 
                    type="color" 
                    value={background.type === 'solid' ? background.value : '#000000'}
                    onChange={(e) => setBackground({ type: 'solid', value: e.target.value, isLoading: false })}
                    className="w-full h-8 cursor-pointer bg-transparent"
                   />
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-amber-500/30 relative overflow-hidden">
               {/* Shine effect */}
               <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full"></div>

               <h3 className="text-amber-500 font-bold text-sm mb-2 flex items-center gap-2">
                 <Wand2 className="w-4 h-4" />
                 توليد خلفية بالذكاء الاصطناعي
               </h3>
               
               <input
                  type="text"
                  value={promptMood}
                  onChange={(e) => setPromptMood(e.target.value)}
                  placeholder="وصف الجو (مثلاً: حزين، ليلي، صحراء)"
                  className="w-full bg-slate-800 border border-slate-700 rounded mb-3 px-3 py-2 text-xs text-right"
                />

               <button 
                onClick={handleGenerateBackground}
                disabled={background.isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {background.isLoading ? <Spinner /> : <Wand2 className="w-4 h-4" />}
                 {background.isLoading ? 'جاري التصميم...' : 'توليد خلفية مناسبة'}
               </button>
               {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
          </section>

          {/* Download Button Mobile - Sticky at bottom of controls on mobile */}
          <div className="md:hidden sticky bottom-0 pt-4 bg-slate-800 border-t border-slate-700">
             <button 
                onClick={() => canvasRef.current?.download()}
                className="w-full bg-slate-100 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                تحميل التصميم
              </button>
          </div>

        </div>
      </div>

      {/* Main Preview Area */}
      <main className="flex-1 bg-slate-950 p-4 md:p-8 flex flex-col items-center justify-center relative">
         <div className="w-full max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white hidden md:block">معاينة مباشرة</h2>
               <button 
                onClick={() => canvasRef.current?.download()}
                className="hidden md:flex bg-slate-100 hover:bg-white text-slate-900 font-bold py-2 px-6 rounded-full items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Download className="w-5 h-5" />
                تحميل (PNG)
              </button>
            </div>

            <CanvasEditor 
              ref={canvasRef}
              details={details}
              config={config}
              background={background}
            />

            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 text-center text-slate-400 text-sm border border-slate-700">
               💡 نصيحة: استخدم صور عالية الجودة أو قم بتوليد خلفية للحصول على أفضل النتائج. الأبعاد مثالية لليوتيوب (1280x720).
            </div>
         </div>
      </main>

    </div>
  );
}