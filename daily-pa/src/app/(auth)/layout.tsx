import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // 如果用户已登录，重定向到仪表盘
  if (user) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
