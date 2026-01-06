-- Daily PA Row Level Security (RLS) 策略
-- 确保用户只能访问自己的数据

-- ============================================
-- 启用 RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Profiles 表策略
-- ============================================

-- 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户可以更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 管理员可以查看所有 profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以更新所有 profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Todos 表策略
-- ============================================

-- 用户可以查看自己的待办事项
CREATE POLICY "Users can view own todos"
  ON public.todos FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的待办事项
CREATE POLICY "Users can create own todos"
  ON public.todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的待办事项
CREATE POLICY "Users can update own todos"
  ON public.todos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的待办事项
CREATE POLICY "Users can delete own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);

-- 管理员可以查看所有待办事项
CREATE POLICY "Admins can view all todos"
  ON public.todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================
-- Expenses 表策略
-- ============================================

-- 用户可以查看自己的消费记录
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的消费记录
CREATE POLICY "Users can create own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的消费记录
CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的消费记录
CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- 管理员可以查看所有消费记录
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Calendar Events 表策略
-- ============================================

-- 用户可以查看自己的日历事件
CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的日历事件
CREATE POLICY "Users can create own calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的日历事件
CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的日历事件
CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Monthly Reports 表策略
-- ============================================

-- 用户可以查看自己的月度报告
CREATE POLICY "Users can view own monthly reports"
  ON public.monthly_reports FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的月度报告
CREATE POLICY "Users can create own monthly reports"
  ON public.monthly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的月度报告
CREATE POLICY "Users can update own monthly reports"
  ON public.monthly_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Notification Settings 表策略
-- ============================================

-- 用户可以查看自己的通知设置
CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以更新自己的通知设置
CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Google Calendar Connections 表策略
-- ============================================

-- 用户可以查看自己的 Google 日历连接
CREATE POLICY "Users can view own google calendar connections"
  ON public.google_calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的 Google 日历连接
CREATE POLICY "Users can create own google calendar connections"
  ON public.google_calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的 Google 日历连接
CREATE POLICY "Users can update own google calendar connections"
  ON public.google_calendar_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的 Google 日历连接
CREATE POLICY "Users can delete own google calendar connections"
  ON public.google_calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Share Links 表策略
-- ============================================

-- 用户可以查看自己创建的分享链接
CREATE POLICY "Users can view own share links"
  ON public.share_links FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建分享链接
CREATE POLICY "Users can create share links"
  ON public.share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的分享链接
CREATE POLICY "Users can delete own share links"
  ON public.share_links FOR DELETE
  USING (auth.uid() = user_id);

-- 任何人可以通过 token 访问分享链接（用于公开访问）
CREATE POLICY "Anyone can view share links by token"
  ON public.share_links FOR SELECT
  USING (true);
