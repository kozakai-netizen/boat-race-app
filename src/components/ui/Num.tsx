import { ReactNode } from 'react'

interface NumProps {
  children: ReactNode
  align?: 'right' | 'left' | 'center'
  size?: 'sm' | 'base' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold'
  className?: string
}

export function Num({
  children,
  align = 'right',
  size = 'base',
  weight = 'medium',
  className = ''
}: NumProps) {
  const alignClasses = {
    right: 'text-right',
    left: 'text-left',
    center: 'text-center'
  }

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold'
  }

  return (
    <span
      className={`${alignClasses[align]} ${sizeClasses[size]} ${weightClasses[weight]} tabular-nums text-ink-2 ${className}`}
    >
      {children}
    </span>
  )
}

// 専用コンポーネント
export function Odds({
  children,
  className = '',
  size = 'base',
  align = 'right'
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
  align?: 'right' | 'left' | 'center';
}) {
  return <Num align={align} size={size} weight="medium" className={`text-ink-1 ${className}`}>{children}</Num>
}

export function EV({
  children,
  className = '',
  size = 'base',
  align = 'right'
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
  align?: 'right' | 'left' | 'center';
}) {
  return <Num align={align} size={size} weight="medium" className={`text-ink-2 ${className}`}>{children}</Num>
}

export function Probability({
  children,
  className = '',
  size = 'base',
  align = 'right'
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
  align?: 'right' | 'left' | 'center';
}) {
  return <Num align={align} size={size} weight="normal" className={`text-ink-3 ${className}`}>{children}</Num>
}

export function Rate({
  children,
  className = '',
  size = 'base',
  align = 'right'
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
  align?: 'right' | 'left' | 'center';
}) {
  return <Num align={align} size={size} weight="normal" className={`text-ink-2 ${className}`}>{children}</Num>
}