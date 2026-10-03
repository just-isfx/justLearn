import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLessonQuiz, submitLessonQuiz } from '../services/quizService';

const QuizModal = ({ lessonId, onClose, onPassed, inline = false }) => {
    const { t } = useTranslation();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        getLessonQuiz(lessonId)
            .then((data) => { if (!cancelled) setQuiz(data); })
            .catch((requestError) => {
                if (!cancelled) setError(requestError?.response?.data?.message || t('quiz.loadError'));
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [lessonId, t]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const submitted = await submitLessonQuiz(lessonId, quiz.questions.map((question) => ({
                question_id: question.id,
                selected_option_id: answers[question.id] ?? null,
            })));
            setResult(submitted);
            if (submitted.passed) onPassed();
        } catch (requestError) {
            setError(requestError?.response?.data?.message || t('quiz.submitError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className={inline ? '' : 'fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[8px]'}
            onClick={inline ? undefined : (event) => { if (event.target === event.currentTarget) onClose(); }}
            role={inline ? undefined : 'dialog'}
            aria-modal={inline ? undefined : 'true'}
            aria-labelledby="lesson-quiz-title"
        >
            <section className={inline ? 'w-full border-t border-sky-200 bg-white' : 'my-auto max-h-[min(90vh,900px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl'}>
                <header className={`flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 sm:px-7 ${inline ? '' : 'sticky top-0 z-10 backdrop-blur'}`}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{t('quiz.assessment')}</p>
                        <h2 id="lesson-quiz-title" className="mt-1 text-lg font-semibold text-slate-900">
                            {result ? t('quiz.complete') : quiz?.title || t('quiz.start')}
                        </h2>
                    </div>
                    {!inline && <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={t('common.close')}>×</button>}
                </header>

                <div className={inline ? 'p-5 sm:p-7' : 'p-5 sm:p-7'}>
                    {loading && <p className="text-sm text-slate-600">{t('quiz.loading')}</p>}
                    {!loading && error && !quiz && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
                    )}

                    {!loading && quiz && !result && (
                        <form onSubmit={handleSubmit}>
                            <p className="mb-5 text-sm text-slate-500">{t('quiz.questionCount', { count: quiz.questions.length })}</p>
                            <div className="space-y-6">
                                {quiz.questions.map((question, questionIndex) => (
                                    <fieldset key={question.id} className="border-b border-slate-100 pb-5 last:border-0">
                                        <legend className="mb-3 font-medium leading-relaxed text-slate-900">
                                            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-sky-700">{questionIndex + 1}.</span>
                                            {question.question}
                                        </legend>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {question.options.map((option) => (
                                                <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${answers[question.id] === option.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={option.id}
                                                        checked={answers[question.id] === option.id}
                                                        onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                                                        className="mt-0.5 accent-sky-700"
                                                    />
                                                    <span><span className="mr-2 font-semibold text-slate-500">{option.label}.</span>{option.text}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                            {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={submitting} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                                    {submitting ? t('quiz.submitting') : t('quiz.submit')}
                                </button>
                            </div>
                        </form>
                    )}

                    {result && (
                        <div>
                            <div className={`rounded-xl border p-5 ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                <p className={`text-sm font-semibold ${result.passed ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    {result.passed ? t('quiz.passed') : t('quiz.failed')}
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-slate-900">{result.score}%</p>
                            </div>
                            {result.incorrect_questions.length > 0 ? (
                                <div className="mt-6">
                                    <h3 className="font-semibold text-slate-900">{t('quiz.review')}</h3>
                                    <div className="mt-3 space-y-3">
                                        {result.incorrect_questions.map((item) => (
                                            <article key={item.question_id} className="rounded-lg border border-slate-200 p-4">
                                                <h4 className="font-medium text-slate-900">{item.question}</h4>
                                                {item.selected_answer && <p className="mt-2 text-sm text-rose-700">{t('quiz.yourAnswer')}: {item.selected_answer}</p>}
                                                <p className="mt-1 text-sm text-emerald-700">{t('quiz.correctAnswer')}: {item.correct_option && `${item.correct_option}. `}{item.correct_answer}</p>
                                                {item.explanation && <p className="mt-2 text-sm text-slate-600">{item.explanation}</p>}
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-5 text-sm text-slate-600">{t('quiz.allCorrect')}</p>
                            )}
                            {!inline && <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">{t('common.close')}</button></div>}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default QuizModal;