import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import ProgressCard from '../components/ProgressCard';
import DashboardCard from '../components/DashboardCard';
import ActivityList from '../components/ActivityList';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getDashboard } from '../services/progressService';
import { formatDuration, formatNumber } from '../utils/formatLocale';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />
);

const StatsSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
            </div>
        ))}
    </div>
);

const DashboardPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const result = await getDashboard();
                if (!cancelled) setData(result);
            } catch {
                if (!cancelled) {
                    setError(t('dashboard.loadError'));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [t]);

    const stats = data
        ? [
            { label: t('dashboard.courses'), value: formatNumber(data.statistics.courses, language) },
            { label: t('dashboard.lessonsCompleted'), value: formatNumber(data.statistics.lessons_completed, language) },
            { label: t('dashboard.learningTime'), value: formatDuration(data.statistics.learning_time_seconds, t) },
            { label: t('dashboard.overallProgress'), value: `${formatNumber(data.statistics.overall_progress, language)}%` },
            { label: t('dashboard.quizzesTaken'), value: formatNumber(data.statistics.quizzes_taken, language) },
            { label: t('dashboard.averageScore'), value: `${formatNumber(data.statistics.quiz_average_score, language)}%` },
        ]
        : [];

    const cl = data?.continue_learning ?? null;

    const lessonUrl = cl
        ? `/courses/${cl.course_slug}/lessons/${cl.lesson_slug}`
        : null;

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                            {t('dashboard.welcome')}
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            {t('dashboard.welcomeBack', { name: user?.name || t('dashboard.student') })}
                        </h2>
                        <p className="mt-3 max-w-2xl text-lg text-slate-600">
                            {t('dashboard.intro')}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 px-5 py-4 text-sm text-slate-300">
                        {t('dashboard.cta')}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    {loading ? (
                        <Skeleton className="h-48 rounded-2xl" />
                    ) : cl ? (
                        <ProgressCard
                            courseName={cl.course_title}
                            currentLesson={cl.lesson_title}
                            progress={cl.progress_percentage}
                            lessonUrl={lessonUrl}
                        />
                    ) : (
                        <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
                                {t('dashboard.startLearning')}
                            </p>
                            <h3 className="mt-3 text-xl font-semibold text-slate-900">
                                {t('dashboard.noLessonsYet')}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                {t('dashboard.pickACourse')}
                            </p>
                            <Link
                                to="/learn"
                                className="mt-5 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                                {t('dashboard.browseCourses')}
                            </Link>
                        </div>
                    )}

                    {loading ? (
                        <StatsSkeleton />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {stats.map((stat) => (
                                <DashboardCard key={stat.label} title={stat.label} value={stat.value} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{t('engagement.streak')}</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{data?.streak?.current_streak || 0} {t('engagement.days')}</p>
                            <p className="mt-1 text-sm text-slate-600">{t('engagement.bestStreak', { count: data?.streak?.longest_streak || 0 })}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{t('engagement.recentAchievements')}</p><Link to="/achievements" className="text-xs font-medium text-sky-700">{t('engagement.viewAll')}</Link></div>
                            {data?.achievements?.length ? <div className="mt-3 space-y-2">{data.achievements.map((item) => <p key={item.id} className="text-sm text-slate-700">✓ {item.achievement.name}</p>)}</div> : <p className="mt-3 text-sm text-slate-600">{t('engagement.noAchievements')}</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <Skeleton className="h-5 w-32" />
                            <div className="mt-5 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="border-b border-slate-100 pb-4">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="mt-2 h-3 w-32" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <ActivityList activities={data?.recent_activity ?? []} />
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default DashboardPage;
