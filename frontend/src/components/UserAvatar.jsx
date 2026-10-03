import { useState } from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
    const [imageFailed, setImageFailed] = useState(false);
    const sizes = {
        sm: 'h-9 w-9 text-xs',
        md: 'h-11 w-11 text-sm',
        lg: 'h-20 w-20 text-2xl',
    };
    const initials = user?.name
        ? user.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
        : 'U';

    return user?.profile_picture_url && !imageFailed ? (
        <img
            src={user.profile_picture_url}
            alt={`${user.name || 'User'} profile`}
            className={`${sizes[size] || sizes.md} rounded-full object-cover ${className}`}
            onError={() => setImageFailed(true)}
        />
    ) : (
        <div className={`${sizes[size] || sizes.md} flex items-center justify-center rounded-full bg-slate-900 font-semibold text-white ${className}`}>
            {initials}
        </div>
    );
};

export default UserAvatar;