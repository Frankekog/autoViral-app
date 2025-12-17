import React, { useState } from 'react';
import { UserTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (tier: UserTier) => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan }) => {
  const [isYearly, setIsYearly] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div className="p-8 sm:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Upgrade your Content Engine</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">Unlock professional-grade AI voices, cinematic styles, and 4K rendering to dominate the algorithm.</p>
          
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button 
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-8 rounded-full bg-slate-800 transition-colors"
            >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-brand-500 transition-transform ${isYearly ? 'translate-x-6' : ''}`}></div>
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-slate-500'}`}>Yearly <span className="text-brand-400 text-xs font-bold ml-1">-20%</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Free Plan */}
             <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-6 flex flex-col">
                <div className="text-left mb-6">
                    <h3 className="text-lg font-medium text-white">Starter</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">$0</span>
                        <span className="text-sm text-slate-500">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">Perfect for experimenting with AI video.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        3 Videos per month
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Standard Gemini Voices
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        720p Video Quality
                    </li>
                     <li className="flex items-center gap-3 text-sm text-slate-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Watermarked Results
                    </li>
                </ul>
                <button 
                    onClick={() => { onSelectPlan('free'); onClose(); }}
                    className="w-full rounded-xl border border-slate-700 bg-transparent py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                    Current Plan
                </button>
             </div>

             {/* Pro Plan */}
             <div className="relative rounded-2xl border border-brand-500/50 bg-slate-900 p-6 flex flex-col shadow-2xl shadow-brand-900/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-accent-600 px-3 py-1 text-xs font-bold text-white rounded-full uppercase tracking-wider">
                    Most Popular
                </div>
                <div className="text-left mb-6">
                    <h3 className="text-lg font-medium text-white">Creator Pro</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${isYearly ? '29' : '39'}</span>
                        <span className="text-sm text-slate-500">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">For creators who want to go viral.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-white font-medium">
                        <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Unlimited Generations
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white font-medium">
                        <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ElevenLabs Style Voices (Premium)
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white font-medium">
                        <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Cinematic & Cyberpunk Styles
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white font-medium">
                        <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        No Watermarks & Priority Support
                    </li>
                </ul>
                <button 
                    onClick={() => { onSelectPlan('pro'); onClose(); }}
                    className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 py-3 font-semibold text-white hover:from-brand-500 hover:to-accent-500 transition-all shadow-lg hover:shadow-brand-500/25"
                >
                    Upgrade Now
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;