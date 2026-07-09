import { NextResponse } from "next/server";
import { ResponseData } from "../../auth/login/route";
import connectDB from "@/lib/db";
import { License } from "@/models/tag";
import { ILicense } from "@/lib/types";

export async function GET(request: Request): Promise<NextResponse<ResponseData>> {

    try {

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await connectDB();
        if (id) {
            let license = await License.findById(id);
            if (!license) return NextResponse.json({ status: false, message: "Invalid Id" }, { status: 404 })
            return NextResponse.json({ status: true, message: license })
        }

        return NextResponse.json({ status: true, message: await License.find({}) })


    } catch (err) {
        console.error('GET License ❌:', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}

export async function POST(request: Request): Promise<NextResponse<ResponseData>> {

    try {
        await connectDB();
        // parse JSON body correctly
        const body = await request.json() as ILicense | null;
        if (!body) {
            return NextResponse.json({ status: false, message: 'Empty body' }, { status: 400 });
        }
        const { name, audioStreams, description, format, price, territory, state, termsOfYears, distributionCopies } = body;
        const license = await License.create({ name, description, format, price, territory, state, termsOfYears, distributionCopies, audioStreams });



        return NextResponse.json({ status: true, message: license });


    } catch (err) {
        console.error('POST License ❌:', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}

export const PATCH = async (request: Request) => {

    try {
        const { searchParams } = new URL(request.url);
        const body = await request.json() as ILicense;

        const id = searchParams.get('id');
        if (!id || Object.entries(body).length === 0) return NextResponse.json({ status: false, message: "Enter required inputs!" }, { status: 400 })

        const updated = await License.findByIdAndUpdate(
            id,
            { $set: { ...body } },
            { new: true }
        );
        return NextResponse.json({ status: true, message: updated })

    } catch (err) {
        console.error('PATCH License ❌', err);
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

        await License.findByIdAndDelete(
            id
        );
        return NextResponse.json({ status: true, message: "Tag Deleted" })

    } catch (err) {
        console.error('Login failed ❌', err);
        return NextResponse.json(
            { status: false, message: 'Internal server error' },
            { status: 500 }
        );
    }

}
