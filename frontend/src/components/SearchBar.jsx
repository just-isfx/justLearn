import { useTranslation } from 'react-i18next';

const SearchBar = ({ value, onChange, placeholder, loading = false }) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder || t('library.searchPlaceholder');

    return (
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-slate-400">🔎</span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={resolvedPlaceholder}
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
            />
            {loading && <span className="text-sm text-slate-500">{t('library.searching')}</span>}
        </label>
    );
};

export default SearchBar;
