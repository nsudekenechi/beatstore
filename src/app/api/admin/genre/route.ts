import connectDB from "@/lib/db";
import { Genres } from "@/models/tag";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await connectDB();
        if (id) {
            return NextResponse.json({ status: true, message: await Genres.findById(id) })
        }

        return NextResponse.json({ status: true, message: await Genres.find({}) })

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = async (request: Request) => {
    try {

        const body = await request.json();
        if (!body.name) return NextResponse.json({ status: false, message: "Enter required Inputs!" }, { status: 400 });
        await connectDB();
        // check if genre already exists 
        if (await Genres.findOne({ name: body.name })) return NextResponse.json({ status: false, message: "Genres already exist, add a different name." }, { status: 400 });
        const tag = await Genres.create({ name: body.name });

        return NextResponse.json({ status: true, message: tag })

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const PATCH = async (request: Request) => {

    try {
        const { searchParams } = new URL(request.url);
        const body = await request.json();

        const id = searchParams.get('id');
        if (!id || !body.name) return NextResponse.json({ status: false, message: "Enter required inputs!" }, { status: 400 })

        const updated = await Genres.findByIdAndUpdate(
            id,
            { $set: { name: body.name } },
            { new: true }
        );
        return NextResponse.json({ status: true, message: updated })

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}

export const DELETE = async (request: Request) => {

    try {
        const { searchParams } = new URL(request.url);

        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ status: false, message: "Enter required inputs!" }, { status: 400 })

        await Genres.findByIdAndDelete(
            id
        );
        return NextResponse.json({ status: true, message: "Genres Deleted" })

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}
