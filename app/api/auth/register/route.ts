import { NextResponse } from "next/server";
import { db } from "@/src/index";
import { usersTable } from "@/src/db/schema";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();
        const passwordHash = await bcrypt.hash(password, 10);
        await db.insert(usersTable).values({ name, email, passwordHash });
        return NextResponse.json({ message: "User registered" }, { status: 201 });
    } catch (error) {
        console.error("[REGISTER ERROR]", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
