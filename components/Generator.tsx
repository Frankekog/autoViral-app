import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScriptData, AspectRatio, GenerationStatus, GeneratedAssets, DURATION_OPTIONS, VOICE_OPTIONS, VISUAL_STYLE_OPTIONS, CAPTION_FONT_OPTIONS, CAPTION_COLOR_OPTIONS, CAPTION_EFFECT_OPTIONS, UserTier, ScriptMode, VoiceSource } from '../types';
import { generateViralScript, generateVoiceover, generateVideo, generateThumbnail, requestApiKey, hasAnyApiKey } from '../services/gemini';
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [visualStyle, setVisualStyle] = useState<string>(VISUAL_STYLE_OPTIONS.find(opt => !opt.isPro)?.value || VISUAL_STYLE_OPTIONS[0].value);
  const [includeCaptions, setIncludeCaptions] = useState(false);
  const [includeThumbnail, setIncludeThumbnail] = useState(false);
  const [captionFont, setCaptionFont] = useState<string>(CAPTION_FONT_OPTIONS[0].value);
  const [captionColor, setCaptionColor] = useState<string>(CAPTION_COLOR_OPTIONS[1].value);
  const [captionEffect, setCaptionEffect] = useState<string>(CAPTION_EFFECT_OPTIONS[1].value);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [assets, setAssets] = useState<GeneratedAssets>({ scriptData: null, audioUrl: null, videoUrl: null, thumbnailUrl: null });
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeyDetected, setApiKeyDetected] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const detected = await hasAnyApiKey();
      setApiKeyDetected(detected);
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectKey = async () => {
    await requestApiKey();
    setApiKeyDetected(true);
  };

  const handleSurpriseMe = () => {
    const random = VIRAL_EXAMPLES[Math.floor(Math.random() * VIRAL_EXAMPLES.length)];
    setTopic(random);
    setScriptMode('auto');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setRecordedBlob(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKeyDetected) {
        await handleConnectKey();
        return;
    }

    if (scriptMode === 'auto' && !topic.trim()) return;
    if (scriptMode === 'custom' && !customScript.trim()) return;
    if (userTier === 'free' && (VOICE_OPTIONS.find(v=>v.value===voice)?.isPro || VISUAL_STYLE_OPTIONS.find(v=>v.value===visualStyle)?.isPro)) {
        onTriggerUpgrade();
        return;
    }

    setStatus(GenerationStatus.GENERATING_SCRIPT);
    setError(null);
    setAssets({ scriptData: null, audioUrl: null, videoUrl: null, thumbnailUrl: null });
    
    try {
      const scriptData = await generateViralScript(
          scriptMode === 'auto' ? topic : '', 
          duration, visualStyle, includeCaptions, includeThumbnail,
          scriptMode === 'custom' ? customScript : undefined
      );
      setAssets(prev => ({ ...prev, scriptData }));
      setStatus(GenerationStatus.GENERATING_ASSETS);
      
      let audioUrl: string | null = null;
      if (voiceSource === 'file' && uploadedFile) audioUrl = URL.createObjectURL(uploadedFile);
      else if (voiceSource === 'record' && recordedBlob) audioUrl = URL.createObjectURL(recordedBlob);
      else audioUrl = await generateVoiceover(scriptData.script, voice === 'custom_voice' ? customVoiceName : voice);
      setAssets(prev => ({ ...prev, audioUrl }));

      if (includeThumbnail && scriptData.thumbnailPrompt) {
        const thumbnailUrl = await generateThumbnail(scriptData.thumbnailPrompt);
        setAssets(prev => ({ ...prev, thumbnailUrl }));
      }

      const videoUrl = await generateVideo(scriptData.visualPrompt, aspectRatio, (msg) => setProgressMsg(msg));
      setAssets(prev => ({ ...prev, videoUrl }));
      setStatus(GenerationStatus.COMPLETE);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStatus(GenerationStatus.ERROR);
    }
  }, [topic, customScript, scriptMode, voiceSource, uploadedFile, recordedBlob, aspectRatio, duration, voice, customVoiceName, visualStyle, includeCaptions, includeThumbnail, userTier, onTriggerUpgrade, apiKeyDetected]);

  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-24">
      {!apiKeyDetected && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                    <p className="text-white font-bold text-sm">Gemini API Connection Required</p>
                    <p className="text-slate-400 text-xs">Vercel requires you to connect your key directly via Google.</p>
                </div>
            </div>
            <button 
                onClick={handleConnectKey}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg"
            >
                Connect to Google AI Studio
            </button>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                 <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono border border-brand-500/30">1</span>
                    Content Concept
                 </h2>
                 <div className="flex p-1 bg-slate-950 rounded-xl w-fit border border-slate-800">
                    <button onClick={() => setScriptMode('auto')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scriptMode === 'auto' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Auto-Generate</button>
                    <button onClick={() => setScriptMode('custom')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scriptMode === 'custom' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Custom Script</button>
                </div>
            </div>
            <div className="relative">
                {scriptMode === 'auto' && (
                    <div className="absolute top-3 right-3 z-10">
                        <button onClick={handleSurpriseMe} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/20">🎲 Surprise Me</button>
                    </div>
                )}
                <textarea
                    value={scriptMode === 'auto' ? topic : customScript}
                    onChange={(e) => scriptMode === 'auto' ? setTopic(e.target.value) : setCustomScript(e.target.value)}
                    placeholder={scriptMode === 'auto' ? "e.g., A cyberpunk cat exploring Tokyo at night" : "Paste your full video script here."}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none h-32 resize-none"
                />
            </div>
        </div>

        <div className="mb-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-sm font-mono border border-brand-500/30">2</span>
                Format & Style
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Duration</label>
                    <select value={duration} onChange={(e)=>setDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none">
                        {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} {opt.isPro && userTier === 'free' ? '(Pro)' : ''}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Visual Style</label>
                    <select value={visualStyle} onChange={(e)=>setVisualStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none">
                        {VISUAL_STYLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} {opt.isPro && userTier === 'free' ? '(Pro)' : ''}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700 h-[46px]">
                         <button onClick={()=>setAspectRatio(AspectRatio.SHORTS)} className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio===AspectRatio.SHORTS?'bg-slate-700 text-white':'text-slate-400'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></button>
                         <button onClick={()=>setAspectRatio(AspectRatio.WIDESCREEN)} className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio===AspectRatio.WIDESCREEN?'bg-slate-700 text-white':'text-slate-400'}`}><svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></button>
                         <button onClick={()=>setAspectRatio(AspectRatio.SQUARE)} className={`flex-1 flex items-center justify-center rounded-md transition-colors ${aspectRatio===AspectRatio.SQUARE?'bg-slate-700 text-white':'text-slate-400'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2}/></svg></button>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
            <button
              onClick={handleGenerate}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 ${status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETE && status !== GenerationStatus.ERROR ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-brand-600 via-brand-500 to-accent-600 text-white'}`}
            >
              {status === GenerationStatus.IDLE || status === GenerationStatus.COMPLETE || status === GenerationStatus.ERROR ? (
                <><span>LAUNCH AUTOPILOT</span><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></>
              ) : (
                <><svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>GENERATING ASSETS...</>
              )}
            </button>
        </div>

        {(status !== GenerationStatus.IDLE) && (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between text-sm">
               <span className={`${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-brand-400 animate-pulse'}`}>{status === GenerationStatus.ERROR ? 'FAILED' : 'SYSTEM ACTIVE'}</span>
               <span className="text-slate-500">{progressMsg}</span>
            </div>
            {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          </div>
        )}
      </div>

      <ResultCard scriptData={assets.scriptData} audioUrl={assets.audioUrl} videoUrl={assets.videoUrl} thumbnailUrl={assets.thumbnailUrl} captionFont={captionFont} captionColor={captionColor} captionEffect={captionEffect}/>
    </div>
  );
};

export default Generator;
