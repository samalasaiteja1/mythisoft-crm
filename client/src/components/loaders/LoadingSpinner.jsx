export default function LoadingSpinner({ fullScreen, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-2 border-myth-accent/30 border-t-myth-accent rounded-full animate-spin`} />
  );
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-myth-navy-dark">
        {spinner}
      </div>
    );
  }
  return <div className="flex justify-center py-12">{spinner}</div>;
}
