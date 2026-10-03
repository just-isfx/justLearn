import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProgressBar from './ProgressBar';

const ProgressCard = ({ courseName, currentLesson, progress, lessonUrl }) => {
    const { t } = useTranslation();

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
                        {t('dashboard.continueLearning')}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{courseName}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        {t('dashboard.currentLesson')} <span className="font-medium text-slate-800">{currentLesson}</span>
                    </p>
                </div>
                <div className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                    {progress}%
                </div>
            </div>

            <div className="mt-5">
                <ProgressBar percentage={progress} showLabel={false} size="md" />
            </div>

            {lessonUrl ? (
                <Link
                    to={lessonUrl}
                    className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                    {t('dashboard.continueLearning')} →
                </Link>
            ) : (
                <button
                    type="button"
                    className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                    {t('dashboard.continueLearning')} →
                </button>
            )}
        </div>
    );
};

export default ProgressCard;
