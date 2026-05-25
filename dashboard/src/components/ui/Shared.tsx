import React from 'react';
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

export const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-zinc-900 text-foreground rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
  const variants = {
    primary: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
    outline: "border border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
    destructive: "bg-red-500 text-white hover:bg-red-600"
  };
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "error", className?: string }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />
);

// Dialog / Alert Components
interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onClose: () => void;
  type?: 'info' | 'error' | 'success';
}

export const AlertDialog = ({ isOpen, title, message, onClose, type = 'info' }: DialogProps) => {
  return (
    <ShadcnAlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className={type === 'error' ? 'text-red-500' : type === 'success' ? 'text-emerald-500' : ''}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full" onClick={onClose}>
            Understood
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  );
};

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onClose }: DialogProps) => {
  return (
    <ShadcnAlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="flex-1 mt-0" onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none" 
            onClick={() => { onConfirm?.(); onClose(); }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  );
};
