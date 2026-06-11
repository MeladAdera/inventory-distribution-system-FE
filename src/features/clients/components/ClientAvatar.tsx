interface ClientAvatarProps {
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function ClientAvatar({ name, size = 34 }: ClientAvatarProps) {
  const fontSize = Math.round(size * 0.4);
  return (
    <div
      className="rounded-full bg-ink-900 text-amber-500 flex items-center justify-center shrink-0 font-semibold select-none"
      style={{ width: size, height: size, fontSize }}
    >
      {getInitials(name)}
    </div>
  );
}
