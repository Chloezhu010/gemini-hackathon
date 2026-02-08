import React from 'react';

const MagicLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
    <div className="relative mb-16">
      <div className="w-80 h-24 relative flex items-center justify-center">
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="w-full h-1 bg-brand-surface rounded-full overflow-hidden border border-brand-secondary/10">
            <div className="h-full bg-brand-primary animate-[ink_3s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <div className="relative z-10 flex space-x-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-10 h-10 bg-brand-primary rounded-full animate-[float_2s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
    <h3 className="text-4xl font-black text-brand-primary mb-4 tracking-tighter uppercase">Binding the Tale...</h3>
    <p className="text-lg text-brand-dark/60 font-bold max-w-md mx-auto uppercase tracking-widest leading-relaxed">Painting cinematic interactions & building your hero's legacy</p>
    <style>{`
      @keyframes ink { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
    `}</style>
  </div>
);

export default MagicLoader;
