import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoriteStatus, toggleFavorite } from '../services/favoriteService';

/**
 * FavoriteButton — self-contained add/remove favorites control.
 *
 * Props:
 *   type   'course' | 'lesson' | 'article'
 *   id     number    the content item's database ID
 *
 * Fetches its own initial state on mount; handles the toggle itself.
 * No toggle switches — uses a button only.
 */
const FavoriteButton = ({ type, id }) => {
    const { t } = useTranslation();
    const [favorited,   setFavorited]   = useState(false);
    const [favoriteId,  setFavoriteId]  = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [toggling,    setToggling]    = useState(false);
    const [error,       setError]       = useState('');

    // Load current status on mount / when id changes
    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const status = await getFavoriteStatus(type, id);
                if (!cancelled) {
                    setFavorited(status.favorited);
                    setFavoriteId(status.favorite_id ?? null);
                }
            } catch {
                // Non-fatal — button just won't show state
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [type, id]);

    const handleToggle = async () => {
        if (toggling) return;
        setToggling(true);
        setError('');
        try {
            const result = await toggleFavorite(type, id);
            setFavorited(result.favorited);
            setFavoriteId(result.favorite?.id ?? (result.favorited ? favoriteId : null));
        } catch {
            setError(t('favorites.updateError'));
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                aria-label={t('common.loading')}
            >
                <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-slate-200" />
                {t('favorites.favorite')}
            </button>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleToggle}
                disabled={toggling}
                aria-pressed={favorited}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                    favorited
                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
            >
                {/* Star icon — filled when favorited */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill={favorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={favorited ? 0 : 1.5}
                    className="h-4 w-4"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                        clipRule="evenodd"
                    />
                </svg>
                {toggling
                    ? (favorited ? t('favorites.removing') : t('favorites.adding'))
                    : (favorited ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites'))
                }
            </button>
            {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        </div>
    );
};

export default FavoriteButton;
