import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-slate-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold leading-6 text-brand-400 ring-1 ring-inset ring-brand-500/20">
              New: Veo 3.1 Integration
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Scale Your Content Empire with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-500">
              Next-Gen AI Video
            </span>
            <br /> Production
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            Transform ideas into viral sensations instantly. Leverage the power of Gemini 2.5 and Veo 3.1 to craft engaging scripts, ultra-realistic voiceovers, and stunning visuals. From custom audio uploads to cinematic rendering, automate your entire creative workflow and produce studio-quality content 10x faster.
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 -z-10 h-full w-full blur-3xl opacity-20" aria-hidden="true">
         <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-brand-500 to-accent-600" style={{ clipPath: "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)" }}></div>
      </div>
    </div>
  );
};

export default Hero;