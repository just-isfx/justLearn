import { useState } from 'react';

const EyeIcon = ({ off = false }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {off ? (
            <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c5.5 0 9.2 5.2 9.8 6.1a1.2 1.2 0 0 1 0 1.8 17.4 17.4 0 0 1-3.1 3.1M6.2 6.2A17.1 17.1 0 0 0 2.2 10a1.2 1.2 0 0 0 0 1.9C2.8 12.8 6.5 18 12 18a10.5 10.5 0 0 0 2.2-.2" />
            </>
        ) : (
            <>
                <path d="M2.2 12s3.5-6.2 9.8-6.2S21.8 12 21.8 12 18.3 18.2 12 18.2 2.2 12 2.2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
            </>
        )}
    </svg>
);

const PasswordField = ({ id, label, value, onChange, autoComplete, autoFocus = false, required = true, className = '' }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>{label}</label>
            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    required={required}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12"
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    title={visible ? 'Hide password' : 'Show password'}
                >
                    <EyeIcon off={!visible} />
                </button>
            </div>
        </div>
    );
};

export default PasswordField;