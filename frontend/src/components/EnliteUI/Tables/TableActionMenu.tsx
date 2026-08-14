import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface TableAction<T = any> {
  /** Unique action id; falls back to label when omitted */
  key?: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  divider?: boolean;
}

const VARIANT_TEXT: Record<NonNullable<TableAction['variant']>, string> = {
  default: 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
  danger: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
  success: 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  warning: 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
};

export interface TableActionMenuProps<T = any> {
  row: T;
  actions: TableAction<T>[];
  ariaLabel?: string;
}

export function TableActionMenu<T = any>({
  row,
  actions,
  ariaLabel = 'Row actions',
}: TableActionMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = actions.filter((a) => !a.hidden?.(row));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      setPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#345E85]/40"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[80] w-48 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {visible.map((action) => {
            const disabled = action.disabled?.(row);
            return (
              <React.Fragment key={action.key || action.label}>
                {action.divider && <div className="my-1 border-t border-slate-100 dark:border-slate-700" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setOpen(false);
                    action.onClick(row);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 ui-body-small text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_TEXT[action.variant || 'default']}`}
                >
                  {action.icon && <span className="w-3.5 h-3.5 flex-shrink-0">{action.icon}</span>}
                  {action.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

export default TableActionMenu;
