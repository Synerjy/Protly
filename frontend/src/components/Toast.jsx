import { useEffect, useRef } from 'react';

export default function Toast({ toasts, onDismiss }) {
    return (
        <div className="toast-container" id="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }) {
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onDismiss(toast.id);
        }, toast.duration || 5000);

        return () => clearTimeout(timerRef.current);
    }, [toast.id, toast.duration, onDismiss]);

    const icons = {
        error: '✕',
        warning: '⚠',
        success: '✓',
        info: 'ℹ',
    };

    return (
        <div className={`toast toast--${toast.type || 'info'}`} id={`toast-${toast.id}`}>
            <span className="toast__icon">{icons[toast.type] || icons.info}</span>
            <span className="toast__message">{toast.message}</span>
            <button className="toast__close" onClick={() => onDismiss(toast.id)} title="Dismiss">
                ✕
            </button>
        </div>
    );
}
