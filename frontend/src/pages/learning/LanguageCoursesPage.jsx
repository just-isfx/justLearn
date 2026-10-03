import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../../components/PageContainer';
import BackIconButton from '../../components/BackIconButton';
import CourseCard from '../../components/CourseCard';
import { getCoursesByLanguage, getLanguageBySlug } from '../../services/contentService';

const LanguageCoursesPage = () => {
    const { slug } = useParams();
    const { t } = useTranslation();
    const [language, setLanguage] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [languageData, courseData] = await Promise.all([
                    getLanguageBySlug(slug),
                    getCoursesByLanguage(slug),
                ]);
                setLanguage(languageData);
                setCourses(courseData);
            } catch {
                setError(t('learn.loadCoursesError'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [slug, t]);

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6">
                    <BackIconButton to="/learn" label={t('learn.backToLanguages')} />
                </div>
                {loading && <div className="text-slate-600">{t('learn.loadingCourses')}</div>}
                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                {!loading && !error && language && (
                    <>
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{language.name}</p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('learn.coursesHeading', { name: language.name })}</h2>
                            <p className="mt-3 text-lg text-slate-600">{language.description}</p>
                        </div>

                        {courses.length === 0 ? (
                            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-slate-600">{t('learn.noCourses')}</div>
                        ) : (
                            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                                {courses.map((course) => (
                                    <CourseCard key={course.id} course={course} languageSlug={slug} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
};

export default LanguageCoursesPage;
