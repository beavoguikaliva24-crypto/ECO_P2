// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Si l'utilisateur est sur la racine "/"
  if (url.pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}