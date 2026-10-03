const PageContainer = ({ children, className = '' }) => {
    return <div className={`p-8 ${className}`}>{children}</div>;
};

export default PageContainer;
