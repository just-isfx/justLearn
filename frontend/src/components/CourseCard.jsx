import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CourseCard = ({ course, languageSlug }) => {
    const { t } = useTranslation();
    return (
        <Link to={`/courses/${course.slug}`} state={{ languageSlug }} className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{course.level}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{course.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{course.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{course.estimated_duration}</span>
            </div>
            <div className="mt-4 text-sm text-slate-500">{t('learn.lessonsCount', { count: course.lessons?.length || 0 })}</div>
        </Link>
    );
};

export default CourseCard;
