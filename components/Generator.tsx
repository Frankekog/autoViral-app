import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScriptData, AspectRatio, GenerationStatus, GeneratedAssets, DURATION_OPTIONS, VOICE_OPTIONS, VISUAL_STYLE_OPTIONS, CAPTION_FONT_OPTIONS, CAPTION_COLOR_OPTIONS, CAPTION_EFFECT_OPTIONS, UserTier, ScriptMode, VoiceSource } from '../types';
import { generateViralScript, generateVoiceover, generateVideo, generateThumbnail, checkApiKey, requestApiKey } from '../services/gemini';
import ResultCard from './ResultCard';

interface GeneratorProps {
  userTier: UserTier;
  onTriggerUpgrade: () => void;
}

const VIRAL_EXAMPLES = [
  "The secret history of coffee in 60 seconds",
  "Why time moves faster as you get older",
  "Top 5 productivity hacks used by billionaires",
  "A day in the life of a cyberpunk detective in 2077",
  "How to travel the world on a $0 budget",
  "The psychology behind why we doom scroll",
  "3 coding tips that will double your salary",
  "The most dangerous roads in the world",
  "What if the internet stopped working for a day?",
  "Meditation guide for people who hate meditating"
];

const Generator: React.FC<GeneratorProps> = ({ userTier, onTriggerUpgrade }) => {
  const [scriptMode, setScriptMode] = useState<ScriptMode>('auto');
  const [voiceSource, setVoiceSource] = useState<VoiceSource>('ai');
  const [topic, setTopic] = useState('');
  const [customScript, setCustomScript] = useState('');
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SHORTS);
  const [duration, setDuration] = useState<string>(DURATION_OPTIONS[0].value);
  const [voice, setVoice] = useState<string>(VOICE_OPTIONS[0].value);
  const [customVoiceName, setCustomVoiceName] = useState('');
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize with a non-pro option by default to avoid locking out free users immediately
  const [visualStyle, setVisualStyle] = useState<string>(
    VISUAL_STYLE_OPTIONS.find(opt => !opt.isPro)?.value || VISUAL_STYLE_OPTIONS[0].value
  );

  const [includeCaptions, setIncludeCaptions] = useState(false);
  const [includeThumbnail, setIncludeThumbnail] = useState(false);
  
  // Caption Styling State
  const [captionFont, setCaptionFont] = useState<string>(CAPTION_FONT_OPTIONS[0].value);
  const [captionColor, setCaptionColor] = useState<string>(CAPTION_COLOR_OPTIONS[1].value);
  const [captionEffect, setCaptionEffect] = useState<string>(CAPTION_EFFECT_OPTIONS[1].value);

  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [assets, setAssets] = useState<GeneratedAssets>({
    scriptData: null,
    audioUrl: null,
    videoUrl: null,
    thumbnailUrl: null,
  });
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Helper to check if current selection is premium
  const isPremiumSelection = () => {
    const selectedVoice = VOICE_OPTIONS.find(v => v.value === voice);
    const selectedStyle = VISUAL_STYLE_OPTIONS.find(v => v.value === visualStyle);
    const selectedDuration = DURATION_OPTIONS.find(v => v.value === duration);

    return (
        (voiceSource === 'ai' && (selectedVoice?.isPro || (voice === 'custom_voice'))) || 
        selectedStyle?.isPro || 
        selectedDuration?.isPro
    );
  };

  const handleSurpriseMe = () => {
    const random = VIRAL_EXAMPLES[Math.floor(Math.random() * VIRAL_EXAMPLES.length)];
    setTopic(random);
    setScriptMode('auto');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      // Reset other audio sources to avoid confusion
      setRecordedBlob(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the actual mime type of the recorder, or fallback to webm
        const type = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        setRecordedBlob(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setUploadedFile(null); // Clear upload if recording

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions and ensure you are using HTTPS or localhost.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = useCallback(async () => {
    // Validation
    if (scriptMode === 'auto' && !topic.trim()) return;
    if (scriptMode === 'custom' && !customScript.trim()) return;
    if (voiceSource === 'file' && !uploadedFile) return;
    if (voiceSource === 'record' && !recordedBlob) return;
    if (voiceSource === 'ai' && voice === 'custom_voice' && !customVoiceName.trim()) return;

    // Premium Check
    if (userTier === 'free' && isPremiumSelection()) {
        onTriggerUpgrade();
        return;
    }

    // Check for API Key first
    try {
      const hasKey = await checkApiKey();
      if (!hasKey) {
        await requestApiKey();
      }
    } catch (e) {
      console.warn("API Key check failed, proceeding anyway to catch error in service", e);
    }

    setStatus(GenerationStatus.GENERATING_SCRIPT);
    setError(null);
    setAssets({ scriptData: null, audioUrl: null, videoUrl: null, thumbnailUrl: null });
    
    if (scriptMode === 'auto') {
        setProgressMsg("Analyzing trends & generating viral script...");
    } else {
        setProgressMsg("Analyzing custom script & generating metadata...");
    }

    try {
      // Step 1: Generate Script (with Visual Style)
      const scriptData = await generateViralScript(
          scriptMode === 'auto' ? topic : '', 
          duration, 
          visualStyle, 
          includeCaptions, 
          includeThumbnail,
          scriptMode === 'custom' ? customScript : undefined
      );
      setAssets(prev => ({ ...prev, scriptData }));
      
      setStatus(GenerationStatus.GENERATING_ASSETS);
      
      // Step 2: Audio Generation or Processing
      let audioUrl: string | null = null;

      if (voiceSource === 'file' && uploadedFile) {
        setProgressMsg("Processing uploaded voiceover...");
        audioUrl = URL.createObjectURL(uploadedFile);
      } else if (voiceSource === 'record' && recordedBlob) {
        setProgressMsg("Processing recorded voiceover...");
        audioUrl = URL.createObjectURL(recordedBlob);
      } else {
        // AI Voice
        const voiceToUse = voice === 'custom_voice' ? customVoiceName : voice;
        setProgressMsg(`Synthesizing AI Voiceover (${voiceToUse})...`);
        audioUrl = await generateVoiceover(scriptData.script, voiceToUse);
      }
      setAssets(prev => ({ ...prev, audioUrl }));

      // Thumbnail (Optional)
      if (includeThumbnail && scriptData.thumbnailPrompt) {
        setProgressMsg("Generating Viral Thumbnail...");
        const thumbnailUrl = await generateThumbnail(scriptData.thumbnailPrompt);
        setAssets(prev => ({ ...prev, thumbnailUrl }));
      }

      // Video (Veo)
      setProgressMsg("Initializing Veo Video Model...");
      const videoUrl = await generateVideo(scriptData.visualPrompt, aspectRatio, (msg) => {
        setProgressMsg(msg);
      });
      setAssets(prev => ({ ...prev, videoUrl }));

      setStatus(GenerationStatus.COMPLETE);
      setProgressMsg("All assets generated successfully!");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setStatus(GenerationStatus.ERROR);
    }
  }, [topic, customScript, scriptMode, voiceSource, uploadedFile, recordedBlob, aspectRatio, duration, voice, customVoiceName, visualStyle, includeCaptions, includeThumbnail, userTier, onTriggerUpgrade]);

  const canGenerate = !(
     status === GenerationStatus.GENERATING_SCRIPT || 
     status === GenerationStatus.GENERATING_ASSETS || 
     (scriptMode === 'auto' && !topic) || 
     (scriptMode === 'custom' && !customScript) ||
     (voiceSource === 'file' && !uploadedFile) ||
     (voiceSource === 'record' && !recordedBlob) || 
     (voiceSource === 'ai' && voice === 'custom_voice' && !customVoiceName.trim())
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-24">
      
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl">
        
        {/* STEP 1: CONCEPT */}
        <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                 <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono border border-brand-500/30">1</span>
                    Content Concept
                 </h2>
                 
                 {/* Script Mode Toggle */}
                 <div className="flex p-1 bg-slate-950 rounded-xl w-fit border border-slate-800 self-start sm:self-auto">
                    <button
                        onClick={() => setScriptMode('auto')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            scriptMode === 'auto' 
                            ? 'bg-brand-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Auto-Generate
                    </button>
                    <button
                        onClick={() => setScriptMode('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            scriptMode === 'custom' 
                            ? 'bg-brand-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Custom Script
                    </button>
                </div>
            </div>

            {scriptMode === 'auto' ? (
                <div className="relative">
                    <div className="absolute top-3 right-3 z-10">
                        <button
                            onClick={handleSurpriseMe}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-medium rounded-lg transition-colors border border-brand-500/20"
                        >
                            <span className="text-sm">🎲</span> Surprise Me
                        </button>
                    </div>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., A cyberpunk cat exploring Tokyo at night, or 'Top 5 productivity hacks for developers'"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all h-32 resize-none pt-4 pr-32"
                    />
                </div>
            ) : (
                <div>
                    <textarea
                        value={customScript}
                        onChange={(e) => setCustomScript(e.target.value)}
                        placeholder="Paste your full video script here. The AI will generate visuals and voiceover based on this text."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all h-32 resize-none font-mono text-sm"
                    />
                </div>
            )}
        </div>

        {/* STEP 2: SETTINGS GRID */}
        <div className="mb-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono border border-brand-500/30">2</span>
                Format & Style
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Duration</label>
                    <select 
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        disabled={scriptMode === 'custom'}
                        className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none ${scriptMode === 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label} {opt.isPro && userTier === 'free' ? '(Pro)' : ''}
                        </option>
                        ))}
                    </select>
                </div>

                {/* Visual Style */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Visual Style</label>
                    <select 
                        value={visualStyle}
                        onChange={(e) => setVisualStyle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        {VISUAL_STYLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label} {opt.isPro && userTier === 'free' ? '(Pro)' : ''}
                        </option>
                        ))}
                    </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700 h-[46px]">
                         <button
                            onClick={() => setAspectRatio(AspectRatio.SHORTS)}
                            title="Shorts (9:16)"
                            className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio === AspectRatio.SHORTS ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                            onClick={() => setAspectRatio(AspectRatio.WIDESCREEN)}
                            title="Widescreen (16:9)"
                            className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio === AspectRatio.WIDESCREEN ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                             <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                            onClick={() => setAspectRatio(AspectRatio.SQUARE)}
                            title="Square (1:1)"
                            className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio === AspectRatio.SQUARE ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* STEP 3: AUDIO & EXTRAS */}
        <div className="mb-10">
             <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono border border-brand-500/30">3</span>
                Audio & Extras
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Audio Source */}
                <div className="space-y-4">
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <button onClick={() => setVoiceSource('ai')} className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium ${voiceSource === 'ai' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>🤖 AI Voice</button>
                      <button onClick={() => setVoiceSource('file')} className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium ${voiceSource === 'file' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>📁 Upload</button>
                      <button onClick={() => setVoiceSource('record')} className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium ${voiceSource === 'record' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>🎙️ Record</button>
                    </div>
                    
                    {voiceSource === 'ai' && (
                        <div className="animate-fade-in">
                            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                                {VOICE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label} {opt.isPro && userTier === 'free' ? '(Pro)' : ''}</option>
                                ))}
                            </select>
                            {voice === 'custom_voice' && (
                                <input type="text" value={customVoiceName} onChange={(e) => setCustomVoiceName(e.target.value)} placeholder="Enter Voice Name" className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-brand-500 outline-none" />
                            )}
                        </div>
                    )}
                    {voiceSource === 'file' && (
                        <div className="animate-fade-in relative border-2 border-dashed border-slate-700 rounded-xl p-4 transition-colors hover:border-brand-500/50 bg-slate-950/30 text-center">
                            <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {uploadedFile ? <span className="text-sm text-green-400 font-medium">{uploadedFile.name}</span> : <span className="text-sm text-slate-400">Click to upload audio</span>}
                        </div>
                    )}
                    {voiceSource === 'record' && (
                        <div className="animate-fade-in bg-slate-950/50 rounded-xl p-4 border border-slate-800 text-center">
                            {isRecording ? (
                                <button onClick={stopRecording} className="bg-red-500/20 text-red-500 px-4 py-2 rounded-full text-sm font-bold border border-red-500/50 animate-pulse">Stop ({formatTime(recordingTime)})</button>
                            ) : recordedBlob ? (
                                <div className="flex flex-col items-center"><span className="text-green-400 text-xs font-bold mb-2">Recorded!</span><button onClick={() => setRecordedBlob(null)} className="text-xs text-slate-400 underline">Redo</button></div>
                            ) : (
                                <button onClick={startRecording} className="text-sm text-white bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">Start Recording</button>
                            )}
                        </div>
                    )}
                </div>

                {/* Checkboxes & Captions */}
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-3 h-fit">
                        <div className={`p-3 rounded-xl border cursor-pointer transition-all ${includeCaptions ? 'bg-brand-500/10 border-brand-500' : 'bg-slate-950 border-slate-700 hover:border-slate-600'}`} onClick={() => setIncludeCaptions(!includeCaptions)}>
                            <div className="flex items-center gap-2 mb-1">
                                <input type="checkbox" checked={includeCaptions} readOnly className="rounded border-slate-600 text-brand-500 bg-slate-900" />
                                <span className="text-sm font-bold text-white">Captions</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Burned into video</p>
                        </div>
                         <div className={`p-3 rounded-xl border cursor-pointer transition-all ${includeThumbnail ? 'bg-brand-500/10 border-brand-500' : 'bg-slate-950 border-slate-700 hover:border-slate-600'}`} onClick={() => setIncludeThumbnail(!includeThumbnail)}>
                            <div className="flex items-center gap-2 mb-1">
                                <input type="checkbox" checked={includeThumbnail} readOnly className="rounded border-slate-600 text-brand-500 bg-slate-900" />
                                <span className="text-sm font-bold text-white">Thumbnail</span>
                            </div>
                            <p className="text-[10px] text-slate-400">YouTube optimized</p>
                        </div>
                     </div>
                     
                     {includeCaptions && (
                         <div className="animate-fade-in pt-2">
                             <select value={captionFont} onChange={(e) => setCaptionFont(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs mb-2 outline-none"><option value="">Select Font...</option>{CAPTION_FONT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
                             <div className="flex gap-2">
                                <select value={captionColor} onChange={(e) => setCaptionColor(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none">{CAPTION_COLOR_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
                                <select value={captionEffect} onChange={(e) => setCaptionEffect(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none">{CAPTION_EFFECT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
                             </div>
                         </div>
                     )}
                </div>
             </div>
        </div>

        {/* STEP 4: ACTION */}
        <div className="pt-6 border-t border-slate-800">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-5 rounded-2xl font-black text-xl tracking-wide shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 ${
                !canGenerate
                  ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 via-brand-500 to-accent-600 text-white hover:shadow-brand-500/25'
              }`}
            >
              {status === GenerationStatus.IDLE || status === GenerationStatus.COMPLETE || status === GenerationStatus.ERROR ? (
                <>
                  <span>LAUNCH AUTOPILOT</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              ) : (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  GENERATING ASSETS...
                </>
              )}
            </button>
            
            {/* Contextual Help Text */}
            {!canGenerate && (
                <p className="text-center text-xs text-slate-500 mt-3 animate-pulse">
                    Please complete Step 1 (Concept) to enable generation.
                </p>
            )}
        </div>

        {/* Status Messages */}
        {(status !== GenerationStatus.IDLE) && (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between text-sm">
               <span className={`font-mono ${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-brand-400 animate-pulse'}`}>
                  {status === GenerationStatus.ERROR ? 'Process Failed' : 'System Status: ACTIVE'}
               </span>
               <span className="text-slate-500">
                  {progressMsg}
               </span>
            </div>
            
            <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full bg-accent-500 transition-all duration-500 ease-out ${
                   status === GenerationStatus.GENERATING_SCRIPT ? 'w-1/4' :
                   status === GenerationStatus.GENERATING_ASSETS ? 'w-3/4' :
                   status === GenerationStatus.COMPLETE ? 'w-full' : 'w-0'
                 }`}
               ></div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Error: {error}. Please try again.
              </div>
            )}
          </div>
        )}
      </div>

      <ResultCard 
        scriptData={assets.scriptData}
        audioUrl={assets.audioUrl}
        videoUrl={assets.videoUrl}
        thumbnailUrl={assets.thumbnailUrl}
        captionFont={captionFont}
        captionColor={captionColor}
        captionEffect={captionEffect}
      />
      
      {/* Footer Info */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
         <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <div className="text-3xl font-bold text-white mb-1">10X</div>
            <div className="text-sm text-slate-400">Faster Content Creation</div>
         </div>
         <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <div className="text-3xl font-bold text-white mb-1">100%</div>
            <div className="text-sm text-slate-400">AI Generated Assets</div>
         </div>
         <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <div className="text-3xl font-bold text-white mb-1">HD</div>
            <div className="text-sm text-slate-400">Veo Video Quality</div>
         </div>
      </div>
    </div>
  );
};

export default Generator;