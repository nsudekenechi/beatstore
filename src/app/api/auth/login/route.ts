import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/user';
import { signJWT } from '@/lib/util';
export interface ResponseData {
    status: boolean;
    message: any;
}
export async function POST(request: Request): Promise<NextResponse<ResponseData>> {
    await connectDB();

    const body = await request.json();
    if (Object.keys(body).length === 0) {
        return NextResponse.json(
            { status: false, message: 'Email and password are required' },
            { status: 400 }
        );
    }

    try {
        if (Object.keys(body).length === 0) {
            return NextResponse.json(
                { status: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }
        const { email, password } = body;


        if (!email || !password) {
            return NextResponse.json(
                { status: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }



        // Exclude password from the returned user object
        const user = await User.findOne({ email }).select('-password');

        if (!user) {
            return NextResponse.json(
                { status: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Need the password hash to compare, so fetch it separately
        const userWithPassword = await User.findOne({ email }).select('password');
        const isMatch = await bcrypt.compare(password, userWithPassword!.password);

        if (!isMatch) {
            return NextResponse.json(
                { status: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const token = signJWT({ userId: user._id.toString() });

        return NextResponse.json(
            { status: true, message: token },
            { status: 200 }
        );

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
