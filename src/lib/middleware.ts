import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
// CHECK IF IT CONTAINS AUTHORIZATION TOKEN

// VERIFY TOKEN 

//CHECK IF ROUTE IS FOR ADMIN 

export const verifyAuthorization = (request: Request) => {
    try {
        if (!(!!request.headers.get("authorization"))) return NextResponse.json({ status: false, message: "Unauthorized access" }, { status: 401 });
        const token = request.headers.get("authorization")?.replace("token", "");
        if (!jwt.verify(token!, process.env.JWT_SECRET!)) return NextResponse.json({ status: false, message: "Unauthorized access" }, { status: 401 });
        
    } catch (err) {
        console.log(err);
    }
}