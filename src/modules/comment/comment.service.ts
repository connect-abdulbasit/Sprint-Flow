import { commentRepository } from "./comment.repository";

function extractMentions(content: string): string[] {
    const regex = /@([a-zA-Z]+(?:\s[a-zA-Z]+)?)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        matches.push(match[1].trim().toLowerCase());
    }
    return matches;
}

export class CommentService {
    async addComment(data: {
        taskId: string;
        workspaceId: string;
        userId: string;
        content: string;
        parentId?: string;
    }) {
        const mentionedNames = extractMentions(data.content);
        const mentionedUserIds: string[] = [];

        const comment = await commentRepository.createComment({
            taskId: data.taskId,
            workspaceId: data.workspaceId,
            userId: data.userId,
            content: data.content,
            parentId: data.parentId ?? null,
            mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : null,
        });

        return comment;
    }

    async getTaskComments(taskId: string, currentUserId?: string) {
        return commentRepository.getTaskComments(taskId, currentUserId);
    }

    async deleteComment(commentId: string, userId: string) {
        const comment = await commentRepository.getCommentById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.userId !== userId)
            throw new Error("Forbidden: you can only delete your own comments");
        await commentRepository.deleteComment(commentId, userId);
        return { success: true };
    }
}

export const commentService = new CommentService();