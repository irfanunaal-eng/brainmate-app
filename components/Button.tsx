import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, variant = 'primary', className, ...props }: ButtonProps) {
  const bgClass = variant === 'primary' ? 'bg-primary active:bg-indigo-700' : 'bg-secondary active:bg-emerald-600';
  
  return (
    <TouchableOpacity 
      className={`w-full py-4 rounded-xl items-center mb-4 ${bgClass} ${className || ''}`}
      {...props}
    >
      <Text className="text-white font-bold text-lg">{title}</Text>
    </TouchableOpacity>
  );
}
