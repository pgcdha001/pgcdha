import React from 'react';

// Original Card component for backward compatibility
const Card = ({ children, header, className = '' }) => (
  <div className={`rounded-2xl bg-white/60 backdrop-blur-xl shadow-xl border border-border p-6 transition-shadow duration-200 hover:shadow-2xl ${className}`} style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
    {header && (
      <div className="mb-4 flex items-center gap-2">
        {header.icon && <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/70 text-white shadow-lg mr-2">{header.icon}</span>}
        <h2 className="text-xl font-bold text-primary font-[Sora,Inter,sans-serif] tracking-tight">{header.title}</h2>
      </div>
    )}
    {children}
  </div>
);

// New modular card components for modern usage
const CardBase = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Export both old and new patterns
export default Card;
export { CardBase as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 