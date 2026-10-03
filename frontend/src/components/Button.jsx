const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition';
    const variants = {
        primary: 'bg-slate-900 text-white hover:bg-slate-700',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
