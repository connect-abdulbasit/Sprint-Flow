import { NextRequest, NextResponse } from "next/server";
import { commentService } from "./comment.service";
import { getCurrentUser } from "@/lib/auth";
import { parsePaginationParams, paginateArray } from "@/lib/pagination";

function commentErrorStatus(message: string) {
  if (message.includes("Forbidden")) return 403;
  if (message.includes("not found")) return 404;
  return 500;
}

export class CommentController {
  async addComment(
    req: NextRequest,
    context: {
      params: Promise<{ id: string; taskId: string }>;
    }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const message = (error as Error)?.message ?? "Failed to add comment";
      return NextResponse.json({ error: message }, { status: commentErrorStatus(message) });
    }
  }

  async getComments(
    req: NextRequest,
    context: {
      params: Promise<{ id: string; taskId: string }>;
    }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { taskId } = await context.params;
      const comments = await commentService.getTaskComments(taskId, user.id);
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 50,
        maxPageSize: 200,
      });
      return NextResponse.json(paginateArray(comments, pagination));
    } catch (error) {
      console.error("Get comments error:", error);
      const message = (error as Error)?.message ?? "Failed to get comments";
      return NextResponse.json({ error: message }, { status: commentErrorStatus(message) });
    }
  }

  async deleteComment(
    req: NextRequest,
    context: {
      params: Promise<{
        id: string;
        taskId: string;
        commentId: string;
      }>;
    }
  ) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { commentId } = await context.params;
      const result = await commentService.deleteComment(commentId, user.id);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Delete comment error:", error);
      const message = (error as Error)?.message ?? "Failed to delete comment";
      return NextResponse.json({ error: message }, { status: commentErrorStatus(message) });
    }
  }
}

export const commentController = new CommentController();
