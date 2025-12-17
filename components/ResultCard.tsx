import React from 'react';
import { ScriptData } from '../types';

interface ResultCardProps {
  scriptData: ScriptData | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  captionFont?: string;
  captionColor?: string;
  captionEffect?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  scriptData, 
  audioUrl, 
  videoUrl, 
  thumbnailUrl,
  captionFont = 'font-sans font-medium',
  captionColor = 'text-white',
  captionEffect = ''
}) => {
  if (!scriptData) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl mt-12 animate-fade-in-up">
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Script & Strategy */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Viral Strategy</h3>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Title</p>
              <p className="text-lg text-white font-medium mb-4">{scriptData.title}</p>
              
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {scriptData.tags.map(tag => (
                  <span key={tag} className="text-xs bg-brand-900 text-brand-300 px-2 py-1 rounded-md">#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2">Generated Script</h3>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 h-64 overflow-y-auto custom-scrollbar">
              <p className="text-slate-300 whitespace-pre-wrap font-mono text-sm">{scriptData.script}</p>
            </div>
          </div>
          
          {scriptData.captions && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Captions Preview</h3>
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar flex items-center justify-center text-center">
                <p className={`whitespace-pre-wrap text-lg leading-relaxed ${captionFont} ${captionColor} ${captionEffect} transition-all duration-300`}>{scriptData.captions}</p>
              </div>
            </div>
          )}

           {audioUrl && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Voiceover</h3>
              <audio controls src={audioUrl} className="w-full" />
              <a 
                href={audioUrl} 
                download="voiceover.wav"
                className="inline-block mt-2 text-sm text-brand-400 hover:text-brand-300"
              >
                Download Audio
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Visuals */}
        <div className="flex flex-col space-y-8">
          
          {/* Video Output */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Generated Video</h3>
            <div className="flex-1 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative min-h-[300px] aspect-video">
                {videoUrl ? (
                <video 
                    controls 
                    autoPlay 
                    loop 
                    className="max-h-[500px] w-auto max-w-full"
                    src={videoUrl}
                />
                ) : (
                <div className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mb-4"></div>
                    <p className="text-slate-500">Video rendering in progress...</p>
                    <p className="text-xs text-slate-600 mt-2">This usually takes 1-2 minutes with Veo.</p>
                </div>
                )}
            </div>
            {videoUrl && (
                <div className="mt-2 flex justify-end">
                <a 
                    href={videoUrl} 
                    download="viral_video.mp4"
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-sm rounded-lg font-semibold transition-colors"
                >
                    Download Video
                </a>
                </div>
            )}
          </div>

          {/* Thumbnail Output */}
          {thumbnailUrl && (
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Viral Thumbnail</h3>
                <div className="bg-black rounded-xl overflow-hidden border border-slate-800 relative group">
                    <img 
                        src={thumbnailUrl} 
                        alt="Generated Thumbnail" 
                        className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                            href={thumbnailUrl} 
                            download="thumbnail.png"
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-100"
                        >
                            Download PNG
                        </a>
                    </div>
                </div>
              </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ResultCard;