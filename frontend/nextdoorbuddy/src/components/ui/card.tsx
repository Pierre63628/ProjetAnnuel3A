import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
      <div
          className={`bg-white rounded-lg shadow-md border border-gray-200 flex flex-col ${className}`}
          style={{ height: '100%' }}
          {...props}
      >
        {children}
      </div>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
      <div className={`p-4 ${className}`}>
        {children}
      </div>
  );
};
