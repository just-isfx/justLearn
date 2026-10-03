import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { getQuizzes } from '../services/quizService';

const QuizzesPage = () => {
    const { t } = useTranslation();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getQuizzes().then(setQuizzes).catch(() => setError(t('quiz.loadError'))).finally(() => setLoading(false));
    }, [t]);

    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('quiz.eyebrow')}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('quiz.historyTitle')}</h2>
        <p className="mt-2 text-slate-600">{t('quiz.intro')}</p>
        {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        {loading ? <p className="mt-8 text-slate-500">{t('quiz.loading')}</p> : quizzes.length === 0 ? <p className="mt-8 text-slate-500">{t('quiz.empty')}</p> :
            <div className="mt-8 grid gap-4 md:grid-cols-2">{quizzes.map((quiz) => <div key={quiz.id} className="rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">{quiz.course?.title || t('quiz.assessment')}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{quiz.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{quiz.description}</p>
                <p className="mt-4 text-xs text-slate-500">{t('quiz.questionCount', { count: quiz.questions_count })} · {t('quiz.passingScore', { score: quiz.passing_score })}</p>
                <Link to={`/quizzes/${quiz.id}`} className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('quiz.start')}</Link>
            </div>)}</div>}
    </div></PageContainer>;
};

export default QuizzesPage;
