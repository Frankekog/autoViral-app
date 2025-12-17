import React, { useState } from 'react';
import Hero from './components/Hero';
import Generator from './components/Generator';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import { User, UserTier } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const handleLogin = () => {
    // Mock login
    setUser({
      id: '123',
      name: 'Creator',
      email: 'creator@example.com',
      tier: 'free'
    });
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSelectPlan = (tier: UserTier) => {
    if (!user) {
        setIsPricingOpen(false);
        setAuthView('signup'); // Default to signup if they try to buy without account
        setIsAuthOpen(true);
        return;
    }
    setUser({ ...user, tier });
    setIsPricingOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-brand-500/30 selection:text-brand-200">
      <Header 
        user={user} 
        onAuthClick={(view) => {
          setAuthView(view);
          setIsAuthOpen(true);
        }}
        onUpgradeClick={() => setIsPricingOpen(true)}
        onLogout={handleLogout}
      />
      
      <Hero />
      
      <Generator 
        userTier={user?.tier || 'free'}
        onTriggerUpgrade={() => setIsPricingOpen(true)}
      />
      
      <footer className="py-8 text-center text-slate-600 text-sm">
         <p>Powered by Google Gemini 2.5 Flash & Veo 3.1</p>
         <p className="mt-2 text-xs">This tool creates assets for preview purposes.</p>
      </footer>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        initialView={authView}
      />

      <PricingModal 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default App;