export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-8 -mt-2 min-h-[calc(100%+0.5rem)] flex flex-col">{children}</div>
  );
}
