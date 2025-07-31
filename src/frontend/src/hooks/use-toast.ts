import React, { useState } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ToastState {
  toasts: Toast[];
}

const toastState: ToastState = {
  toasts: []
};

const listeners: Array<(state: ToastState) => void> = [];

function dispatch(action: { type: string; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        toastState.toasts = [...toastState.toasts, action.toast];
      }
      break;
    case 'REMOVE_TOAST':
      toastState.toasts = toastState.toasts.filter(
        (toast) => toast.id !== action.toastId
      );
      break;
    case 'DISMISS_TOAST':
      toastState.toasts = toastState.toasts.map((toast) =>
        toast.id === action.toastId ? { ...toast, open: false } : toast
      );
      break;
  }

  listeners.forEach((listener) => listener(toastState));
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ToasterToast = Toast & {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function toast({ ...props }: Omit<ToasterToast, 'id'>) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto dismiss after duration
  if (props.duration !== Infinity) {
    setTimeout(() => {
      dismiss();
    }, props.duration || 5000);
  }

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState<ToastState>(toastState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'REMOVE_TOAST', toastId }),
  };
}

export { useToast, toast };