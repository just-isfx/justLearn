import { Link } from 'react-router-dom';

const LessonCard = ({ lesson, courseSlug, isActive = false }) => {
    return (
        <Link to={`/courses/${courseSlug}/lessons/${lesson.slug}`} className={`flex items-center justify-between rounded-2xl border p-4 transition ${isActive ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div>
                <p className="text-sm font-medium text-slate-500">Lesson {lesson.lesson_order}</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">{lesson.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>
            </div>
            <span className="text-sm font-medium text-slate-500">{lesson.estimated_minutes} min</span>
        </Link>
    );
};

export default LessonCard;
