import { NextRequest, NextResponse } from "next/server";
import { commentService } from "./comment.service";
import { getCurrentUser } from "@/lib/auth";

export class CommentController {
    async addComment(
        req: NextRequest,
        context: {
            params: Promise<{ id: string; taskId: string }>
        }
    ) {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        try {
            const { id: workspaceId, taskId } = await context.params;
            const body = await req.json();
            const comment = await commentService.addComment({
                taskId,
                workspaceId,
                userId: user.id,
                content: body.content,
                parentId: body.parentId ?? undefined,
            });
            return NextResponse.json(comment);
        } catch (error) {
            console.error("Add comment error:", error);
            return NextResponse.json(
                {
                    error: (error as Error)?.message
                        ?? "Failed to add comment"
                },
                { status: 500 }
            );
        }
    }

    async getComments(
        req: NextRequest,
        context: {
            params: Promise<{ id: string; taskId: string }>
        }
    ) {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        try {
            const { taskId } = await context.params;
            const comments = await commentService.getTaskComments(
                taskId,
                user.id
            );
            return NextResponse.json(comments);
        } catch (error) {
            return NextResponse.json(
                {
                    error: (error as Error)?.message
                        ?? "Failed to get comments"
                },
                { status: 500 }
            );
        }
    }

    async deleteComment(
        req: NextRequest,
        context: {
            params: Promise<{
                id: string;
                taskId: string;
                commentId: string
            }>
        }
    ) {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        try {
            const { commentId } = await context.params;
            const result = await commentService.deleteComment(
                commentId,
                user.id
            );
            return NextResponse.json(result);
        } catch (error) {
            console.error("Delete comment error:", error);
            const message = (error as Error)?.message
                ?? "Failed to delete comment";
            const status = message.includes("Forbidden")
                ? 403
                : 500;
            return NextResponse.json(
                { error: message },
                { status }
            );
        }
    }
}

export const commentController = new CommentController();
