import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-xl'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md focus:ring-emerald-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 ring-1 ring-slate-700 focus:ring-slate-500',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md focus:ring-emerald-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md focus:ring-red-500',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md focus:ring-amber-500',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 focus:ring-slate-600',
    outline: 'bg-transparent ring-1 ring-slate-700 hover:bg-slate-800/60 text-slate-200 focus:ring-slate-500'
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClasses,
    className
  ].filter(Boolean).join(' ');
  
  // Handle icon positioning
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <FaSpinner className="animate-spin" />
          <span>Loading...</span>
        </>
      );
    }
    
    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          {children}
        </>
      );
    }
    
    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {icon}
        </>
      );
    }
    
    return children;
  };
  
  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button; 