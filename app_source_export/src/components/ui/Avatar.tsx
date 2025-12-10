/**
 * Avatar - Componente de avatar
 */

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
};

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
    const initials = name
        .split(' ')
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={`${sizeClasses[size]} rounded-full object-cover border-2 border-[var(--color-border-default)]`}
            />
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center text-[var(--color-accent-gold)] font-semibold border-2 border-[var(--color-accent-gold)]/30`}
        >
            {initials}
        </div>
    );
}
