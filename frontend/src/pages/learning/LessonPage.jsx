import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useBeforeUnload } from 'react-router-dom';
import PageContainer from '../../components/PageContainer';
import BackIconButton from '../../components/BackIconButton';
import FavoriteButton from '../../components/FavoriteButton';
import NoteForm from '../../components/NoteForm';
import TextToSpeechControls from '../../components/TextToSpeechControls';
import SelectionTutorAction from '../../components/SelectionTutorAction';
import QuizModal from '../../components/QuizModal';
import { getLessonBySlug } from '../../services/contentService';
import { getLessonProgress, saveLessonProgress, updateTimeSpent } from '../../services/progressService';
import { createNote } from '../../services/noteService';
import { combineSpeakableParts } from '../../utils/speechText';
import { useTranslation } from 'react-i18next';

// ─── Constants ─────────────────────────────────────────────────────────────────
const SAVE_INTERVAL_MS = 15_000;
const TIME_HEARTBEAT_MS = 10_000;
const PROGRESS_SAVE_DELTA = 5;
const MIN_READING_DURATION_MS = 35_000;

const containsHtml = (content) => /<[a-z][^>]*>/i.test(content || '');

const hasReachedBottom = () => {
    const element = document.documentElement;
    return (element.scrollTop || window.scrollY) + window.innerHeight >= element.scrollHeight - 20;
};

const calculateCombinedProgress = (timeProgress, scrollProgress) => {
    return Math.min(99, Math.round((timeProgress + scrollProgress) / 2));
};

// ─── Component ─────────────────────────────────────────────────────────────────
const LessonPage = () => {
    const { courseSlug, lessonSlug } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Content
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previousLesson, setPreviousLesson] = useState(null);
    const [nextLesson, setNextLesson] = useState(null);

    // Progress
    const [timeProgress, setTimeProgress] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [progressLoading, setProgressLoading] = useState(true);
    const [isTimeElapsed, setIsTimeElapsed] = useState(false);
    const [hasScrolledBottom, setHasScrolledBottom] = useState(false);

    // Quick-note modal
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteSaveError, setNoteSaveError] = useState('');
    const [noteSuccess, setNoteSuccess] = useState(false);
    const [quizOpen, setQuizOpen] = useState(false);

    // Refs
    const lessonIdRef = useRef(null);
    const savedProgressRef = useRef(0);
    const timeSpentRef = useRef(0);
    const sessionStartRef = useRef(null);
    const activeRef = useRef(true);
    const completedRef = useRef(false);
    const timeProgressRef = useRef(0);
    const isTimeElapsedRef = useRef(false);
    const scrollProgressRef = useRef(0);
    const scrolledToBottomRef = useRef(false);
    const completionRequirementsMetRef = useRef(false);
    const completionSavingRef = useRef(false);

    useEffect(() => { completedRef.current = isCompleted; }, [isCompleted]);

    useEffect(() => { setQuizOpen(false); }, [lessonSlug]);

    // ── Load lesson ─────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            setPreviousLesson(null);
            setNextLesson(null);
            try {
                const data = await getLessonBySlug(lessonSlug);
                if (cancelled) return;
                setLesson(data);
                lessonIdRef.current = data.id;
                if (data?.course?.lessons) {
                    const lessons = data.course.lessons;
                    const idx = lessons.findIndex((l) => l.slug === lessonSlug);
                    setPreviousLesson(idx > 0 ? lessons[idx - 1] : null);
                    setNextLesson(idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null);
                }
            } catch {
                if (!cancelled) setError(t('learn.loadLessonError'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [courseSlug, lessonSlug]);

    // ── Load existing progress ──────────────────────────────────────────
    useEffect(() => {
        if (!lessonIdRef.current) return;
        let cancelled = false;
        const loadProgress = async () => {
            setProgressLoading(true);
            try {
                const p = await getLessonProgress(lessonIdRef.current);
                if (cancelled) return;
                const pct = p.progress_percentage ?? 0;
                setIsCompleted(!!p.completed_at);
                completedRef.current = !!p.completed_at;
                savedProgressRef.current = pct;
                timeSpentRef.current = p.time_spent_seconds ?? 0;
                sessionStartRef.current = Date.now();
            } catch {
                sessionStartRef.current = Date.now();
            } finally {
                if (!cancelled) setProgressLoading(false);
            }
        };
        loadProgress();
        return () => { cancelled = true; };
    }, [lesson]);

    // ── Save progress ───────────────────────────────────────────────────
    const saveProgress = useCallback(async (forcePct = null) => {
        const id = lessonIdRef.current;
        if (!id) return false;
        if (activeRef.current && sessionStartRef.current) {
            timeSpentRef.current += Math.round((Date.now() - sessionStartRef.current) / 1000);
            sessionStartRef.current = Date.now();
        }
        const pct = forcePct !== null
            ? forcePct
            : calculateCombinedProgress(timeProgressRef.current, scrollProgressRef.current);
        const effectivePct = Math.max(savedProgressRef.current, pct);
        const canComplete = completedRef.current || completionRequirementsMetRef.current;
        const finalPct = effectivePct >= 100 && !canComplete ? 99 : effectivePct;
        try {
            await saveLessonProgress(id, {
                progress_percentage: finalPct,
                time_spent_seconds: timeSpentRef.current,
                last_position: Math.round(window.scrollY),
            });
            savedProgressRef.current = finalPct;
            if (finalPct === 100 && canComplete && !completedRef.current) {
                completedRef.current = true;
                setIsCompleted(true);
            }
            return true;
        } catch {
            return false;
        }
    }, []);

    const updateCombinedProgress = useCallback(() => {
        const percentage = calculateCombinedProgress(timeProgressRef.current, scrollProgressRef.current);
        if (percentage - savedProgressRef.current >= PROGRESS_SAVE_DELTA) {
            void saveProgress(percentage);
        }
    }, [saveProgress]);

    const tryCompleteLesson = useCallback(async () => {
        if (!isTimeElapsedRef.current || !scrolledToBottomRef.current || completedRef.current || completionSavingRef.current) return;

        completionRequirementsMetRef.current = true;
        completionSavingRef.current = true;
        completedRef.current = true;
        setIsCompleted(true);
        const saved = await saveProgress(100);
        if (!saved) {
            completionRequirementsMetRef.current = false;
            completionSavingRef.current = false;
            completedRef.current = false;
            setIsCompleted(false);
        }
    }, [saveProgress]);

    // Count visible reading time for each lesson; background tabs do not count.
    useEffect(() => {
        if (!lesson?.id || lesson.slug !== lessonSlug) return undefined;

        timeProgressRef.current = 0;
        isTimeElapsedRef.current = false;
        scrollProgressRef.current = 0;
        scrolledToBottomRef.current = false;
        completionRequirementsMetRef.current = false;
        completionSavingRef.current = false;
        savedProgressRef.current = 0;
        completedRef.current = false;
        setTimeProgress(0);
        setScrollProgress(0);
        setIsTimeElapsed(false);
        setHasScrolledBottom(false);
        setIsCompleted(false);
        window.scrollTo(0, 0);

        let elapsedMs = 0;
        let previousTick = Date.now();
        const timer = window.setInterval(() => {
            const now = Date.now();
            if (activeRef.current) elapsedMs += now - previousTick;
            previousTick = now;
            const percentage = Math.min(Math.round((elapsedMs / MIN_READING_DURATION_MS) * 100), 100);
            timeProgressRef.current = percentage;
            setTimeProgress(percentage);
            updateCombinedProgress();

            if (elapsedMs >= MIN_READING_DURATION_MS) {
                isTimeElapsedRef.current = true;
                setIsTimeElapsed(true);
                window.clearInterval(timer);
                void tryCompleteLesson();
            }
        }, 1000);

        return () => window.clearInterval(timer);
    }, [lesson?.id, lesson?.slug, lessonSlug, tryCompleteLesson, updateCombinedProgress]);

    // ── Scroll listener ─────────────────────────────────────────────────
    useEffect(() => {
        if (!lesson || lesson.slug !== lessonSlug) return;
        const onScroll = () => {
            const element = document.documentElement;
            const maximumScroll = element.scrollHeight - window.innerHeight;
            const percentage = maximumScroll <= 0
                ? 100
                : Math.min(Math.round(((element.scrollTop || window.scrollY) / maximumScroll) * 100), 100);
            scrollProgressRef.current = percentage;
            setScrollProgress(percentage);
            scrolledToBottomRef.current = scrolledToBottomRef.current || hasReachedBottom();
            setHasScrolledBottom(scrolledToBottomRef.current);
            updateCombinedProgress();
            void tryCompleteLesson();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [lesson, lessonSlug, tryCompleteLesson, updateCombinedProgress]);

    useEffect(() => {
        if (isTimeElapsed && hasScrolledBottom) void tryCompleteLesson();
    }, [isTimeElapsed, hasScrolledBottom, tryCompleteLesson]);

    // ── Periodic save ───────────────────────────────────────────────────
    useEffect(() => {
        if (!lesson) return;
        const interval = setInterval(() => {
            if (!activeRef.current) return;
            if (isTimeElapsedRef.current && scrolledToBottomRef.current) {
                void tryCompleteLesson();
            } else {
                void saveProgress();
            }
        }, SAVE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [lesson, saveProgress, tryCompleteLesson]);

    // ── Time heartbeat ──────────────────────────────────────────────────
    useEffect(() => {
        if (!lesson) return;
        const interval = setInterval(async () => {
            const id = lessonIdRef.current;
            if (!id || !activeRef.current) return;
            if (sessionStartRef.current) {
                timeSpentRef.current += Math.round((Date.now() - sessionStartRef.current) / 1000);
                sessionStartRef.current = Date.now();
            }
            try { await updateTimeSpent(id, timeSpentRef.current); } catch { /* silent */ }
        }, TIME_HEARTBEAT_MS);
        return () => clearInterval(interval);
    }, [lesson]);

    // ── Visibility change ───────────────────────────────────────────────
    useEffect(() => {
        activeRef.current = !document.hidden;
        const onVisibility = () => {
            if (document.hidden) {
                if (activeRef.current && sessionStartRef.current) {
                    timeSpentRef.current += Math.round((Date.now() - sessionStartRef.current) / 1000);
                    sessionStartRef.current = null;
                }
                activeRef.current = false;
            } else {
                activeRef.current = true;
                sessionStartRef.current = Date.now();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // ── Save on page close ──────────────────────────────────────────────
    useBeforeUnload(useCallback(() => { saveProgress(); }, [saveProgress]));

    // ── Save on SPA unmount ─────────────────────────────────────────────
    useEffect(() => () => { saveProgress(); }, [saveProgress]);

    // ── Quick-note save ─────────────────────────────────────────────────
    const handleNoteSave = async (payload) => {
        setNoteSaving(true);
        setNoteSaveError('');
        try {
            await createNote(payload);
            setNoteModalOpen(false);
            setNoteSuccess(true);
            setTimeout(() => setNoteSuccess(false), 3000);
        } catch (err) {
            const msg = err?.response?.data?.message
                || Object.values(err?.response?.data?.errors ?? {})[0]?.[0]
                || t('notes.saveError');
            setNoteSaveError(msg);
        } finally {
            setNoteSaving(false);
        }
    };

    // ── Derived ─────────────────────────────────────────────────────────
    const readingTime = useMemo(
        () => (lesson?.estimated_minutes ? t('learn.minRead', { count: lesson.estimated_minutes }) : t('learn.quickRead')),
        [lesson, t]
    );
    const overallProgress = isCompleted
        ? 100
        : Math.min(99, Math.round((timeProgress + scrollProgress) / 2));

    const handleQuizPassed = () => { void tryCompleteLesson(); };

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <>
            <PageContainer>
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-6">
                        <BackIconButton to={`/courses/${lesson?.course?.slug ?? courseSlug}`} label={t('learn.backToCourse')} />
                    </div>

                    {loading && <div className="text-slate-600">{t('learn.loadingLesson')}</div>}
                    {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && lesson && (
                        <>
                            {/* Header and lesson navigation */}
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="max-w-3xl">
                                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                                        {lesson.course?.programming_language?.name || t('learn.course')}
                                    </p>
                                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{lesson.title}</h2>
                                    <p className="mt-3 text-lg text-slate-600">{lesson.description}</p>
                                </div>
                                <nav className="flex shrink-0 gap-2" aria-label={t('learn.lessonNavigation')}>
                                    {previousLesson ? (
                                        <Link to={`/courses/${courseSlug}/lessons/${previousLesson.slug}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                            ← {t('learn.previousLesson')}
                                        </Link>
                                    ) : (
                                        <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400">
                                            ← {t('learn.previousLesson')}
                                        </button>
                                    )}
                                    {nextLesson ? (
                                        <Link to={`/courses/${courseSlug}/lessons/${nextLesson.slug}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                            {t('learn.nextLesson')} →
                                        </Link>
                                    ) : (
                                        <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400">
                                            {t('learn.nextLesson')} →
                                        </button>
                                    )}
                                </nav>
                            </div>

                            {/* Meta bar */}
                            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                <span className="font-medium text-slate-900">{lesson.course?.title}</span>
                                <span>·</span>
                                <span>{readingTime}</span>
                                {isCompleted && (
                                    <>
                                        <span>·</span>
                                        <span className="font-medium text-emerald-600">✓ {t('learn.completed')}</span>
                                    </>
                                )}
                                <div className="ml-auto flex flex-wrap items-center gap-2">
                                    {lesson.id && <FavoriteButton type="lesson" id={lesson.id} />}
                                    <button
                                        type="button"
                                        onClick={() => { setNoteSaveError(''); setNoteModalOpen(true); }}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                        + {t('learn.addNote')}
                                    </button>
                                </div>
                            </div>

                            {/* Note success */}
                            {noteSuccess && (
                                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                                    {t('learn.noteSaved')}
                                </div>
                            )}

                            {/* Progress bar */}
                            {!progressLoading && (
                                <div className="mt-6">
                                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                                        <span>{t('learn.yourProgress')}</span>
                                        {isCompleted && <span className="font-medium text-emerald-600">{t('learn.lessonComplete')}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800"
                                            role="progressbar"
                                            aria-label={t('learn.yourProgress')}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={overallProgress}
                                        >
                                            <div
                                                className={`h-full rounded-full transition-[width] duration-100 ease-out motion-reduce:transition-none ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'}`}
                                                style={{ width: `${overallProgress}%` }}
                                            />
                                        </div>
                                        <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-600">{overallProgress}%</span>
                                    </div>
                                </div>
                            )}

                            <TextToSpeechControls
                                text={combineSpeakableParts([
                                    lesson.title,
                                    lesson.description,
                                    lesson.content,
                                ])}
                            />

                            {/* Content */}
                            <SelectionTutorAction
                                onAskTutor={(selectedText) => navigate('/ai-tutor', {
                                    state: {
                                        highlightedContext: selectedText,
                                        lessonTitle: lesson.title,
                                    },
                                })}
                            >
                                <article
                                    className="prose prose-slate mt-8 max-w-none"
                                >
                                    {containsHtml(lesson.content) ? (
                                        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                    ) : (
                                        <p className="whitespace-pre-wrap">{lesson.content}</p>
                                    )}
                                </article>
                            </SelectionTutorAction>

                            {lesson.quizzes?.length > 0 && (
                                <details
                                    className="mt-8 overflow-hidden rounded-xl border border-sky-200 bg-sky-50"
                                    onToggle={(event) => setQuizOpen(event.currentTarget.open)}
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-900 marker:hidden">
                                        <span>{t('quiz.lessonQuiz')}</span>
                                        <span className="text-sm font-medium text-sky-700">{lesson.quizzes[0].title}</span>
                                    </summary>
                                    {quizOpen && (
                                        <QuizModal
                                            inline
                                            lessonId={lesson.id}
                                            onPassed={handleQuizPassed}
                                        />
                                    )}
                                </details>
                            )}
                        </>
                    )}
                </div>
            </PageContainer>

            {/* Quick-note modal */}
            {noteModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
                    onClick={(e) => { if (e.target === e.currentTarget) setNoteModalOpen(false); }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="lesson-note-title"
                >
                    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 id="lesson-note-title" className="text-lg font-semibold text-slate-900">{t('learn.addNote')}</h3>
                            <button
                                type="button"
                                onClick={() => setNoteModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                                aria-label={t('common.close')}
                            >✕</button>
                        </div>
                        <NoteForm
                            context={lesson ? { type: 'lesson', id: lesson.id, label: lesson.title } : null}
                            onSave={handleNoteSave}
                            onCancel={() => setNoteModalOpen(false)}
                            saving={noteSaving}
                            serverError={noteSaveError}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LessonPage;
