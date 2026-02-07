import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const SketchyInput: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xl font-semibold text-brand-primary mb-2 uppercase tracking-widest text-sm">{label}</label>}
      <input
        className={`w-full text-2xl font-semibold text-brand-dark bg-brand-light/30 border-b-4 border-brand-accent focus:border-brand-primary focus:outline-none pb-2 placeholder-brand-muted/30 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const SketchyTextarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xl font-semibold text-brand-primary mb-2 uppercase tracking-widest text-sm">{label}</label>}
      <textarea
        className={`w-full text-xl font-medium text-brand-dark border-4 border-dashed border-brand-primary/20 p-6 rounded-3xl focus:border-brand-accent focus:outline-none resize-none bg-brand-light/30 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
