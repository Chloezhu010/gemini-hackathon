import React from 'react';

interface SketchyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  children: React.ReactNode;
}

export const SketchyButton: React.FC<SketchyButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  style,
  ...props 
}) => {
  let variantClasses = '';
  
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-brand-accent text-brand-dark border-brand-primary shadow-soft';
      break;
    case 'secondary':
      variantClasses = 'bg-brand-primary text-white border-brand-dark shadow-soft';
      break;
    case 'outline':
      variantClasses = 'bg-white text-brand-primary border-brand-primary hover:bg-brand-light';
      break;
    case 'danger':
      variantClasses = 'bg-red-400 text-white border-red-600';
      break;
  }

  return (
    <button
      className={`font-black text-xl px-8 py-4 border-4 transition-all hover:scale-105 active:scale-95 ${variantClasses} ${className}`}
      style={{
        borderRadius: '32px',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

