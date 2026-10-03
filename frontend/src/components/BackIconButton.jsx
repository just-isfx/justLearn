import { Link } from 'react-router-dom';

const BackIconButton = ({ to, label }) => (
    <Link
        to={to}
        aria-label={label}
        title={label}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
        </svg>
    </Link>
);

export default BackIconButton;