import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../../components/PageContainer';
import BackIconButton from '../../components/BackIconButton';
import ProgressBar from '../../components/ProgressBar';
import FavoriteButton from '../../components/FavoriteButton';
import { getCourseBySlug, getCourseContinueLesson } from '../../services/contentService';
import { getCourseProgress } from '../../services/progressService';

// ─── Lesson state badge ────────────────────────────────────────────────────────

const LessonStateBadge = ({ lesson }) => {
    const { t } = useTranslation();
    if (lesson.is_completed) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                ✓ {t('learn.completed')}
            </span>
        );
    }
    if (lesson.progress_percentage > 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                → {lesson.progress_percentage}%
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            ○ {t('learn.notStarted')}
        </span>
    );
};

// ─── Lesson row ────────────────────────────────────────────────────────────────

const LessonRow = ({ lesson, courseSlug }) => {
    const { t } = useTranslation();
    return (
    <Link
        to={`/courses/${courseSlug}/lessons/${lesson.slug}`}
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
        <div className="flex items-center gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {lesson.lesson_order}
            </span>
            <div>
                <p className="font-medium text-slate-900">{lesson.title}</p>
                {lesson.estimated_minutes && (
                    <p className="mt-0.5 text-xs text-slate-500">{t('learn.minRead', { count: lesson.estimated_minutes })}</p>
                )}
            </div>
        </div>
        <LessonStateBadge lesson={lesson} />
    </Link>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const CourseDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [course, setCourse] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progressLoading, setProgressLoading] = useState(true);
    const [error, setError] = useState('');
    const [continuing, setContinuing] = useState(false);

    const handleContinue = async () => {
        if (!course || continuing) return;
        setContinuing(true);
        try {
            const result = await getCourseContinueLesson(course.id);
            if (result.lesson) {
                navigate(`/courses/${course.slug}/lessons/${result.lesson.slug}`);
            }
        } catch {
            setError(t('learn.loadCourseError'));
        } finally {
            setContinuing(false);
        }
    };

    // Load course content
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const courseData = await getCourseBySlug(slug);
                if (!cancelled) setCourse(courseData);
            } catch {
                if (!cancelled) setError(t('learn.loadCourseError'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [slug]);

    // Load per-lesson progress independently (non-blocking)
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setProgressLoading(true);
            try {
                const data = await getCourseProgress(slug);
                if (!cancelled) setProgressData(data);
            } catch {
                // Non-fatal — show lessons without progress state
            } finally {
                if (!cancelled) setProgressLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [slug]);

    // Merge progress data into lesson list
    const lessonsWithProgress = useMemo(() => {
        if (!course?.lessons) return [];
        if (!progressData?.lessons) return course.lessons.map((l) => ({ ...l, progress_percentage: 0, is_completed: false }));

        const progressMap = Object.fromEntries(
            progressData.lessons.map((l) => [l.id, l])
        );

        return course.lessons.map((l) => ({
            ...l,
            progress_percentage: progressMap[l.id]?.progress_percentage ?? 0,
            is_completed: progressMap[l.id]?.is_completed ?? false,
        }));
    }, [course, progressData]);

    const courseProgressPct = progressData?.course_progress ?? 0;
    const completedCount = progressData?.completed_lessons ?? 0;
    const totalCount = progressData?.total_lessons ?? course?.lessons?.length ?? 0;
    const parentLanguageSlug = course?.programming_language?.slug ?? location.state?.languageSlug;

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6">
                    <BackIconButton
                        to={parentLanguageSlug ? `/learn/${parentLanguageSlug}` : '/learn'}
                        label={t('learn.backToCourses')}
                    />
                </div>

                {loading && <div className="text-slate-600">{t('learn.loadingCourse')}</div>}
                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {!loading && !error && course && (
                    <>
                        {/* Header */}
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                                {course.programming_language?.name || t('learn.course')}
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{course.title}</h2>
                            <p className="mt-3 text-lg text-slate-600">{course.description}</p>
                            {course.id && (
                                <div className="mt-4">
                                    <FavoriteButton type="course" id={course.id} />
                                </div>
                            )}
                            {lessonsWithProgress.length > 0 && (
                                <button type="button" onClick={handleContinue} disabled={continuing} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                                    {continuing ? t('common.loading') : t('learn.continueLearning')}
                                </button>
                            )}
                        </div>

                        {/* Meta grid */}
                        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{t('learn.level')}</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{course.level}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{t('learn.duration')}</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{course.estimated_duration}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{t('learn.lessons')}</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{totalCount}</p>
                            </div>
                        </div>

                        {/* Course progress */}
                        {!progressLoading && (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span className="font-medium text-slate-800">{t('learn.yourProgress')}</span>
                                    <span>{t('learn.lessonsCompletedCount', { completed: completedCount, total: totalCount })}</span>
                                </div>
                                <div className="mt-3">
                                    <ProgressBar percentage={courseProgressPct} size="lg" />
                                </div>
                            </div>
                        )}

                        {/* Lessons */}
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-slate-900">{t('learn.lessons')}</h3>

                            {lessonsWithProgress.length === 0 ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-slate-600">
                                    {t('learn.noLessons')}
                                </div>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    {lessonsWithProgress.map((lesson) => (
                                        <LessonRow key={lesson.id} lesson={lesson} courseSlug={course.slug} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {course.quizzes?.length > 0 && (
                            <div className="mt-8 border-t border-slate-200 pt-8">
                                <h3 className="text-2xl font-semibold text-slate-900">{t('quiz.assessments')}</h3>
                                <div className="mt-4 space-y-3">
                                    {course.quizzes.map((quiz) => (
                                        <Link key={quiz.id} to={`/quizzes/${quiz.id}`} className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                                            <p className="font-semibold text-slate-900">{quiz.title}</p>
                                            <p className="mt-1 text-sm text-slate-600">{quiz.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
};

export default CourseDetailsPage;
