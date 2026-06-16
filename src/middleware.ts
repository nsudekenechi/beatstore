import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json(
      { status: false, message: 'Unauthorized access' },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-userId', payload.userId as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });

  } catch (err: any) {
    console.log('JWT verify error:', err.message);
    return NextResponse.json(
      { status: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/admin/:path*'], // Or whatever paths you need
};