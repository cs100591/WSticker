import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-primary-foreground">PA</span>
          </div>
        </div>

        {/* 标题 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Daily PA
          </h1>
          <p className="text-xl text-muted-foreground">
            你的虚拟私人助理
          </p>
        </div>

        {/* 功能介绍 */}
        <div className="grid gap-4 sm:grid-cols-3 text-left">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">📝 待办事项</h3>
            <p className="text-sm text-muted-foreground">
              轻松管理日常任务，设置优先级和截止日期
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">💰 消费记录</h3>
            <p className="text-sm text-muted-foreground">
              追踪每一笔支出，了解你的消费习惯
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">🎤 语音助手</h3>
            <p className="text-sm text-muted-foreground">
              用语音快速创建待办和记录消费
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            开始使用
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            注册账号
          </Link>
        </div>

        {/* 底部信息 */}
        <p className="text-sm text-muted-foreground">
          已有账号？{' '}
          <Link href="/login" className="text-primary hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </main>
  );
}
