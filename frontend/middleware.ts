import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si l'utilisateur arrive sur la racine "/", on le force vers /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'], // S'applique uniquement à la racine
};