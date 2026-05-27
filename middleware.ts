import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rotas que requerem autenticação
  const protectedRoutes = ['/chat', '/profile', '/conversations'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Verificar se o utilizador tem sessão (via cookies)
  const hasSession = request.cookies.has('sb-rqmoynynhkjzgwujbupa-auth-token');

  // Se a rota requer autenticação e não há sessão, redirecionar para login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se está autenticado e tenta aceder à landing page, redirecionar para chat
  if ((pathname === '/' || pathname === '') && hasSession) {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = '/chat';
    return NextResponse.redirect(chatUrl);
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/action|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
