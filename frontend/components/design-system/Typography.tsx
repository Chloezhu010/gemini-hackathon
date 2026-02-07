import React from 'react';

type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';

interface TypographyProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body', 
  children, 
  className = '',
  color = 'text-brand-dark' 
}) => {
  const baseClasses = `transition-colors duration-200 ${color}`;
  
  const styles: Record<Variant, string> = {
    h1: 'font-rounded font-semibold text-5xl md:text-7xl leading-tight tracking-normal',
    h2: 'font-rounded font-semibold text-4xl md:text-5xl tracking-normal',
    h3: 'font-rounded font-semibold text-3xl md:text-4xl tracking-wide',
    h4: 'font-rounded font-semibold text-2xl tracking-wide',
    body: 'font-sans font-medium text-lg md:text-xl leading-relaxed tracking-wide',
    caption: 'font-sans font-semibold text-sm tracking-widest uppercase',
    label: 'font-rounded font-semibold text-lg tracking-wide uppercase',
  };

  const Component = variant.startsWith('h') ? variant : (variant === 'label' ? 'label' : 'p');

  return React.createElement(
    Component,
    { className: `${styles[variant]} ${baseClasses} ${className}` },
    children
  );
};

export const Heading = (props: TypographyProps) => <Typography variant="h2" {...props} />;
export const Text = (props: TypographyProps) => <Typography variant="body" {...props} />;
export const Label = (props: TypographyProps) => <Typography variant="label" {...props} />;
