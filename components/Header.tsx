import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onAuthClick: (view: 'login' | 'signup') => void;
  onUpgradeClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick, onUpgradeClick, onLogout }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 font-bold text-white shadow-lg shadow-brand-500/20">
            AV
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AutoViral</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.tier === 'free' && (
                <button
                  onClick={onUpgradeClick}
                  className="hidden rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-yellow-500/20 sm:block"
                >
                  Upgrade to Pro ⚡
                </button>
              )}
              
              <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{user.tier} Plan</div>
                </div>
                <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                </div>
                <button 
                    onClick={onLogout}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                    Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => onAuthClick('login')}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Log In
              </button>
              <button
                onClick={() => onAuthClick('signup')}
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;