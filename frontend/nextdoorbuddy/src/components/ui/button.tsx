import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const getVariantClasses = (variant: string) => {
  switch (variant) {
    case 'solid':
      return 'bg-blue-600 text-white hover:bg-blue-700';
    case 'outline':
      return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'accent':
      return 'bg-blue-500 text-white hover:bg-blue-600';
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700';
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'md':
      return 'px-4 py-2 text-base';
    case 'lg':
      return 'px-6 py-3 text-lg';
    default:
      return 'px-4 py-2 text-base';
  }
};

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'solid', 
  size = 'md',
  asChild = false,
  disabled = false,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  
  const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: allClasses,
      onClick,
      disabled
    });
  }

  return (
    <button 
      className={allClasses}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
