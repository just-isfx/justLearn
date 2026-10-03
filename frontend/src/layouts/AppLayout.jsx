import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AppLayout = ({ titleKey, children }) => {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <Header titleKey={titleKey} />
                <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
