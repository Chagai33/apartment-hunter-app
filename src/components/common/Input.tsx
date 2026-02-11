import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label className="text-sm font-medium text-gray-700">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        "w-full px-4 py-3 rounded-xl border transition-all outline-none",
                        error ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
