import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  toastInfo: { id: string; message: string; type: 'success' | 'error' } | null;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ toastInfo, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toastInfo) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow fade-out animation before calling onDismiss
        setTimeout(onDismiss, 300); // Matches animation duration
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [toastInfo, onDismiss]);

  if (!toastInfo) return null;

  const Icon = toastInfo.type === 'success' ? CheckCircle : AlertTriangle;
  const bgColor = toastInfo.type === 'success' ? 'bg-green-500' : 'bg-rose-500';
  const iconColor = toastInfo.type === 'success' ? 'text-green-100' : 'text-rose-100';
  const textColor = 'text-white';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px', // Adjusted to be above footer
        left: '50%',
        // transform: 'translateX(-50%)', // Removed duplicate transform
        zIndex: 1000,
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className={`flex items-center ${bgColor} ${textColor} p-3 rounded-lg shadow-xl min-w-[280px] max-w-md`}>
        <Icon size={20} className={`${iconColor} mr-2 flex-shrink-0`} />
        <span className="text-base md:text-lg font-medium flex-grow">{toastInfo.message}</span>
        <button 
            onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
            }} 
            className={`${textColor} hover:opacity-75 ml-2 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-white/50`}
            aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;