import { PostDocument } from '../models/PostModel';
import { UserDocument } from '../models/UserModel';
import { CommentDocument, CommentModel } from '../models/CommentModel';
import { findPostById } from './Post';
import NotFoundError from '../../errors/NotFoundError';
import { findUserById } from './User';
import NotAuthorizedError from '../../errors/NotAuthorizedError';
import ConflictError from '../../errors/ConflictError';

/**
 * Finds a comment by ID.
 *
 * @param id The comment's ID.
 *
 * @returns If found, the comment; if not found, then `null`.
 */
export async function findCommentById(id: CommentDocument['_id']): Promise<CommentDocument> {
    let comment;
    try {
        comment = await CommentModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return comment;
}

/**
 * Creates a comment, then updates the post and commenter's respective "comments" fields.
 *
 * @param postId The post's ID.
 * @param commenterId The commenter's ID.
 * @param content The text of the comment.
 * @param parent The parent comment's ID. If there's none, then it's set to null.
 *
 * @returns Tuple containing the comment, the post, and the commenter (user).
 */
export async function createComment(
    postId: PostDocument['_id'],
    commenterId: UserDocument['_id'],
    content: string,
    parent: CommentDocument['_id'] = null,
): Promise<[CommentDocument, PostDocument, UserDocument]> {
    // Verify that post and commenter exist.
    let post: PostDocument;
    let commenter: UserDocument;
    let newComment: CommentDocument;
    let parentComment: CommentDocument;

    try {
        // Verify that post exists.
        post = await findPostById(postId);
        if (!post) throw new NotFoundError('Post');

        // Verify that the commenter exists.
        commenter = await findUserById(commenterId);
        if (!commenter) throw new NotFoundError('User');

        if (parent) {
            parentComment = await findCommentById(parent);
            if (!parentComment) throw new NotFoundError('Parent comment');
        }

        // Create the comment.
        newComment = new CommentModel({
            post: postId,
            poster: commenterId,
            content,
            parent,
        });

        // Add the comment to the post's comments.
        post.comments.push(newComment.id);

        // Add the comment to the user's comments.
        commenter.comments.push(newComment.id);

        // If the comment is reply, add it to the children of the parent comment.
        if (parentComment) {
            parentComment.children.push(newComment.id);
        }

        // Save the changes.
        await newComment.save();
        await post.save();
        await commenter.save();
        if (parentComment) await parentComment.save();
    } catch (error) {
        throw error;
    }

    return [newComment, post, commenter];
}

export async function deleteComment(
    commentId: CommentDocument['_id'],
    commenterId: UserDocument['_id'],
): Promise<CommentDocument> {
    let comment: CommentDocument;
    let commenter: UserDocument;

    try {
        // Verify that comment exists.
        comment = await findCommentById(commentId);
        if (!comment) throw new NotFoundError('Comment');

        // Verify that commenter exists.
        commenter = await findUserById(commenterId);
        if (!commenter) throw new NotFoundError('User');

        // Verify that the user owns the comment.
        if (comment.poster.toString() !== commenter.id) throw new NotAuthorizedError('delete comment');

        // Verify that the comment isn't already deleted.
        if (comment.isDeleted) throw new ConflictError('Comment already deleted.');

        // Delete the comment.
        comment.isDeleted = true;

        // Save the changes.
        await comment.save();
    } catch (error) {
        throw error;
    }
    return comment;
}
