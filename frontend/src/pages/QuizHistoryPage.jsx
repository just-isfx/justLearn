import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { getQuizAttempts } from '../services/quizService';

const QuizHistoryPage = () => {
    const { t } = useTranslation();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => { getQuizAttempts().then(setAttempts).catch(() => setError(t('quiz.historyError'))).finally(() => setLoading(false)); }, [t]);
    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('quiz.eyebrow')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('quiz.history')}</h2></div><Link to="/quizzes" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('quiz.start')}</Link></div>{error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{loading ? <p className="mt-8 text-slate-500">{t('quiz.loadingHistory')}</p> : attempts.length === 0 ? <p className="mt-8 text-slate-500">{t('quiz.noAttempts')}</p> : <div className="mt-8 space-y-3">{attempts.map((attempt) => <Link key={attempt.id} to={`/quiz-attempts/${attempt.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><div><p className="font-semibold text-slate-900">{attempt.quiz.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(attempt.completed_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-semibold text-slate-900">{attempt.percentage}%</p><p className={attempt.passed ? 'text-xs text-emerald-600' : 'text-xs text-amber-600'}>{attempt.passed ? t('quiz.passed') : t('quiz.failed')}</p></div></Link>)}</div>}</div></PageContainer>;
};
export default QuizHistoryPage;
