import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/formatLocale';

const ActivityList = ({ activities = [] }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{t('dashboard.recentActivity')}</h3>

            {activities.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">
                    {t('dashboard.noActivity')}
                </p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {activities.map((activity) => (
                        <li
                            key={`${activity.lesson_slug}-${activity.last_accessed_at}`}
                            className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">
                                    {activity.lesson_title}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {activity.is_completed
                                        ? `✓ ${t('dashboard.completed')}`
                                        : t('dashboard.percentComplete', { percent: activity.progress_percentage })}
                                    {activity.last_accessed_at && (
                                        <span className="ml-2 text-slate-400">
                                            · {formatDate(activity.last_accessed_at, language, t, 'relative')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {activity.course_slug && activity.lesson_slug && (
                                <Link
                                    to={`/courses/${activity.course_slug}/lessons/${activity.lesson_slug}`}
                                    className="ml-4 shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    {activity.is_completed ? t('dashboard.review') : t('dashboard.continue')}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ActivityList;
