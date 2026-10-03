/**
 * ProgressBar — reusable horizontal progress bar.
 *
 * Props:
 *   percentage  {number}  0–100
 *   showLabel   {boolean} show "xx%" text to the right (default true)
 *   size        {'sm'|'md'|'lg'}  bar thickness (default 'md')
 *   className   {string}  extra wrapper classes
 */
const ProgressBar = ({ percentage = 0, showLabel = true, size = 'md', className = '' }) => {
    const clamped = Math.min(100, Math.max(0, percentage));

    const heights = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
    };

    const barColor =
        clamped === 100
            ? 'bg-emerald-500'
            : clamped >= 50
              ? 'bg-sky-500'
              : 'bg-sky-400';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className={`flex-1 overflow-hidden rounded-full bg-slate-200 ${heights[size]}`}
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${clamped}%`}
            >
                <div
                    className={`${heights[size]} rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
            {showLabel && (
                <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-600">
                    {clamped}%
                </span>
            )}
        </div>
    );
};

export default ProgressBar;
