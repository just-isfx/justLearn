import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import TextToSpeechControls from '../components/TextToSpeechControls';
import { getQuiz, submitQuiz } from '../services/quizService';

const QuizPage = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const load = () => { setLoading(true); setError(''); getQuiz(id).then(setQuiz).catch(() => setError(t('quiz.loadError'))).finally(() => setLoading(false)); };
    useEffect(load, [id, t]);

    if (loading) return <PageContainer><p className="text-slate-500">{t('quiz.loading')}</p></PageContainer>;
    if (error || !quiz) return <PageContainer><p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error || t('quiz.notFound')}</p></PageContainer>;

    const questions = quiz.questions || [];
    if (!questions.length) return <PageContainer><p className="text-slate-500">{t('quiz.empty')}</p></PageContainer>;

    const submit = async () => {
        setError('');
        const unanswered = questions.filter((question) => !answers[question.id]);
        if (unanswered.length && !window.confirm(t('quiz.submitUnanswered', { count: unanswered.length }))) return;
        setSubmitting(true);
        try {
            const data = await submitQuiz(id, questions.map((question) => ({ question_id: question.id, selected_option_id: answers[question.id] || null })));
            setResult(data);
        } catch (err) {
            setError(err?.response?.data?.message || t('quiz.submitError'));
        } finally { setSubmitting(false); }
    };

    if (result) return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('quiz.complete')}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{quiz.title}</h2>
        <p className="mt-6 text-5xl font-semibold text-slate-900">{result.percentage}%</p>
        <p className={`mt-2 font-medium ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}>{result.passed ? t('quiz.passed') : t('quiz.failed')}</p>
        <p className="mt-2 text-slate-600">{t('quiz.points', { score: result.score, total: result.total_points })}</p>
        <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => { setResult(null); setAnswers({}); setCurrent(0); }} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('quiz.retake')}</button><Link to="/quiz-history" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{t('quiz.history')}</Link></div>
        <div className="mt-10 space-y-4">{result.answers.map((answer, index) => <div key={answer.question_id} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">{index + 1}. {answer.question}</p><p className={`mt-2 text-sm ${answer.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{answer.is_correct ? t('quiz.correct') : t('quiz.incorrect')}</p><p className="mt-1 text-sm text-slate-600">{t('quiz.yourAnswer')}: {answer.selected_answer || t('quiz.unanswered')}</p><p className="text-sm text-slate-600">{t('quiz.correctAnswer')}: {answer.correct_answer}</p></div>)}</div>
    </div></PageContainer>;

    const question = questions[current];
    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('quiz.eyebrow')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{quiz.title}</h2></div><p className="text-sm text-slate-500">{t('quiz.questionOf', { current: current + 1, total: questions.length })}</p></div>
        <div className="mt-10"><h3 className="text-xl font-semibold text-slate-900">{question.question}</h3><TextToSpeechControls text={question.question} compact /><div className="mt-6 space-y-3">{question.options.map((option) => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${answers[question.id] === option.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === option.id} onChange={() => setAnswers((old) => ({ ...old, [question.id]: option.id }))} /> <span className="text-sm text-slate-800">{option.option_text}</span></label>)}</div></div>
        {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6"><button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">{t('quiz.previous')}</button>{current === questions.length - 1 ? <button type="button" disabled={submitting} onClick={submit} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? t('quiz.submitting') : t('quiz.submit')}</button> : <button type="button" onClick={() => setCurrent(current + 1)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('quiz.next')}</button>}</div>
    </div></PageContainer>;
};

export default QuizPage;
