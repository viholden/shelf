import { AuthProvider } from '@/lib/auth-context';
import Navigation from '@/components/Navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh" style={{ background: 'var(--shelf-bg)' }}>
        <Navigation />
        <div className="flex-1 lg:ml-56 flex flex-col min-h-dvh">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
