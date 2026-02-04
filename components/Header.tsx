import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 safe-top">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <h1 className="font-bold text-lg text-slate-800 tracking-tight">SmartGrader</h1>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
          Beta
        </div>
      </div>
    </header>
  );
};