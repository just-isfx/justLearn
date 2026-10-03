import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import NotesPage from './pages/NotesPage';
import FavoritesPage from './pages/FavoritesPage';
import AiTutorPage from './pages/AiTutorPage';
import LearnPage from './pages/learning/LearnPage';
import LanguageCoursesPage from './pages/learning/LanguageCoursesPage';
import CourseDetailsPage from './pages/learning/CourseDetailsPage';
import LessonPage from './pages/learning/LessonPage';
import LibraryPage from './pages/learning/LibraryPage';
import LibraryArticlePage from './pages/learning/LibraryArticlePage';
import QuizzesPage from './pages/QuizzesPage';
import QuizPage from './pages/QuizPage';
import QuizHistoryPage from './pages/QuizHistoryPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import AchievementsPage from './pages/AchievementsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

const App = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <LanguageProvider>
                    <BrowserRouter>
                    <Routes>
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        <Route element={<ProtectedRoute />}>
                            <Route
                                path="/dashboard"
                                element={
                                    <AppLayout titleKey="nav.dashboard">
                                        <DashboardPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/learn"
                                element={
                                    <AppLayout titleKey="nav.learn">
                                        <LearnPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/learn/:slug"
                                element={
                                    <AppLayout titleKey="learn.courses">
                                        <LanguageCoursesPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/courses/:slug"
                                element={
                                    <AppLayout titleKey="learn.course">
                                        <CourseDetailsPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/courses/:courseSlug/lessons/:lessonSlug"
                                element={
                                    <AppLayout titleKey="learn.lessons">
                                        <LessonPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/library"
                                element={
                                    <AppLayout titleKey="nav.library">
                                        <LibraryPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/library/:slug"
                                element={
                                    <AppLayout titleKey="library.title">
                                        <LibraryArticlePage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/ai-tutor"
                                element={
                                    <AppLayout titleKey="nav.aiTutor">
                                        <AiTutorPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/history"
                                element={
                                    <AppLayout titleKey="nav.history">
                                        <HistoryPage />
                                    </AppLayout>
                                }
                            />
                            <Route path="/quizzes" element={<AppLayout titleKey="quiz.historyTitle"><QuizzesPage /></AppLayout>} />
                            <Route path="/quizzes/:id" element={<AppLayout titleKey="quiz.start"><QuizPage /></AppLayout>} />
                            <Route path="/quiz-history" element={<AppLayout titleKey="quiz.history"><QuizHistoryPage /></AppLayout>} />
                            <Route path="/quiz-attempts/:id" element={<AppLayout titleKey="quiz.review"><QuizAttemptPage /></AppLayout>} />
                            <Route path="/achievements" element={<AppLayout titleKey="engagement.achievements"><AchievementsPage /></AppLayout>} />
                            <Route path="/notifications" element={<AppLayout titleKey="engagement.notifications"><NotificationsPage /></AppLayout>} />
                            <Route path="/admin" element={<AppLayout titleKey="admin.title"><AdminPage /></AppLayout>} />
                            <Route
                                path="/favorites"
                                element={
                                    <AppLayout titleKey="nav.favorites">
                                        <FavoritesPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/notes"
                                element={
                                    <AppLayout titleKey="nav.notes">
                                        <NotesPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <AppLayout titleKey="nav.profile">
                                        <ProfilePage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <AppLayout titleKey="nav.settings">
                                        <SettingsPage />
                                    </AppLayout>
                                }
                            />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    </BrowserRouter>
                </LanguageProvider>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;
