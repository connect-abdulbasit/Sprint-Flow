import AppLayout from "@/components/layout/app-layout";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout mainClassName="flex-1 min-h-0 overflow-hidden p-0" contentClassName="h-full min-h-0">
      {children}
    </AppLayout>
  );
}
