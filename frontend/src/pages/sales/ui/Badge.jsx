import React from 'react';

const STATUS_COLOR_MAP = {
  // Leads
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-purple-50 text-purple-700 border-purple-200',
  survey_scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  survey_completed: 'bg-teal-50 text-teal-700 border-teal-200',
  converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-slate-100 text-slate-600 border-slate-200',

  // Surveys
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',

  // Quotations
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',

  // Orders
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  inventory_reserved: 'bg-purple-50 text-purple-700 border-purple-200',
  installation_scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  
  // Payment Status
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // System types / general
  on_grid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  off_grid: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const Badge = ({
  children,
  variant = 'default',
  statusKey,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (statusKey && STATUS_COLOR_MAP[statusKey]) {
    style = STATUS_COLOR_MAP[statusKey];
  } else if (variant === 'success') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'warning') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (variant === 'danger') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (variant === 'info') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const displayContent = typeof children === 'string' 
    ? children.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : children;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {displayContent}
    </span>
  );
};

export default Badge;
