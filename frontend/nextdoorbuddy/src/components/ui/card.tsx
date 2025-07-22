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

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
      <div className={`p-6 pb-0 ${className}`}>
        {children}
      </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
      <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
        {children}
      </h3>
  );
};
