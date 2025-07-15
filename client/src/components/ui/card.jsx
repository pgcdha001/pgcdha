import React from 'react';

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

export default Card; 