import PageContainer from '../components/PageContainer';

const PlaceholderPage = ({ title, description }) => {
    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-600">{description}</p>
            </div>
        </PageContainer>
    );
};

export default PlaceholderPage;
