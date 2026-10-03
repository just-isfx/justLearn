import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { getQuizAttempt } from '../services/quizService';

const QuizAttemptPage = () => {
    const { id } = useParams(); const { t } = useTranslation(); const [attempt, setAttempt] = useState(null); const [error, setError] = useState('');
    useEffect(() => { getQuizAttempt(id).then(setAttempt).catch(() => setError(t('quiz.reviewError'))); }, [id, t]);
    if (error) return <PageContainer><p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p></PageContainer>;
    if (!attempt) return <PageContainer><p className="text-slate-500">{t('quiz.loading')}</p></PageContainer>;
    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><Link to="/quiz-history" className="text-sm text-sky-700">← {t('quiz.history')}</Link><h2 className="mt-4 text-3xl font-semibold text-slate-900">{attempt.quiz.title}</h2><p className="mt-3 text-2xl font-semibold">{attempt.percentage}% <span className="text-sm font-normal text-slate-500">{t('quiz.points', { score: attempt.score, total: attempt.total_points })}</span></p><div className="mt-8 space-y-4">{attempt.answers.map((answer, index) => <div key={answer.question_id} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">{index + 1}. {answer.question}</p><p className={`mt-2 text-sm ${answer.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{answer.is_correct ? t('quiz.correct') : t('quiz.incorrect')}</p><p className="mt-1 text-sm text-slate-600">{t('quiz.yourAnswer')}: {answer.selected_answer || t('quiz.unanswered')}</p><p className="text-sm text-slate-600">{t('quiz.correctAnswer')}: {answer.correct_answer}</p></div>)}</div></div></PageContainer>;
};
export default QuizAttemptPage;
