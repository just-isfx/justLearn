const DashboardCard = ({ title, value, description }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-900">{value}</h3>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        </div>
    );
};

export default DashboardCard;
