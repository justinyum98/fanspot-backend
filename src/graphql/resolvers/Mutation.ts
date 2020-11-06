import { AuthenticationError } from 'apollo-server-express';
import {
    AuthPayload,
    FollowMutationPayload,
    CreatePostMutationResponse,
    DeletePostMutationResponse,
    AddCommentMutationResponse,
    DeleteCommentMutationResponse,
    LikeOrDislikePostMutationResponse,
    LikeOrDislikeCommentMutationResponse,
    LikeArtistMutationResponse,
    LikeAlbumMutationResponse,
} from '../types';
import { UserDocument } from '../../database/models/UserModel';
import {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    followUser,
    unfollowUser,
    likePost,
    dislikePost,
    undoLikePost,
    undoDislikePost,
    likeComment,
    dislikeComment,
    undoLikeComment,
    undoDislikeComment,
    likeArtist,
    undoLikeArtist,
    likeAlbum,
    undoLikeAlbum,
} from '../../database/dataAccess/User';
import { PostDocument } from '../../database/models/PostModel';
import { createPost, findPostById, deletePostById } from '../../database/dataAccess/Post';
import { generateJWT, verifyJWT } from '../../utils/jwt';
import { validatePasswordMatch } from '../../utils/password';
import NotFoundError from '../../errors/NotFoundError';
import NotAuthorizedError from '../../errors/NotAuthorizedError';
import logger from '../../utils/logger';
import { createComment, deleteComment, findCommentById } from '../../database/dataAccess/Comment';
import { CommentDocument } from '../../database/models/CommentModel';
import ConflictError from '../../errors/ConflictError';
import NotAuthenticatedError from '../../errors/NotAuthenticatedError';
import { findArtistById } from '../../database/dataAccess/Artist';
import { findAlbumById } from '../../database/dataAccess/Album';

export const Mutation = {
    Mutation: {
        // Public
        login: async (parent: any, args: { username: string; password: string }): Promise<AuthPayload> => {
            logger.debug(`Login Request: ${args.username} ${args.password}`);
            const user: UserDocument = await findUserByUsername(args.username);
            if (!user) throw new NotFoundError('User with username');
            const passwordsMatch = await validatePasswordMatch(args.password, user.password);
            logger.debug(`Password match: ${passwordsMatch}`);
            if (!passwordsMatch) throw new AuthenticationError('Password is incorrect.');
            const token: string = generateJWT(user.id, user.username);
            return { user: user.toObject(), token };
        },
        register: async (
            parent: any,
            args: { username: string; password: string; email: string },
        ): Promise<AuthPayload> => {
            let user: UserDocument = await findUserByUsername(args.username);
            if (user) throw new AuthenticationError('Username is taken.');
            user = await findUserByEmail(args.email);
            if (user) throw new AuthenticationError('Email is taken.');
            const newUser: UserDocument = await createUser(args.username, args.password, args.email);
            const token: string = generateJWT(newUser.id, newUser.username);
            return { user: newUser.toObject(), token };
        },
        // Private (requires token)
        follow: async (
            parent: any,
            args: { targetUserId: string },
            context: { token: string },
        ): Promise<FollowMutationPayload> => {
            const decodedToken = verifyJWT(context.token);
            const currentUser: UserDocument = await findUserById(decodedToken.id);
            const targetUser: UserDocument = await findUserById(args.targetUserId);
            const [currentUserDoc, targetUserDoc]: [UserDocument, UserDocument] = await followUser(
                currentUser,
                targetUser,
            );
            return {
                currentUserFollowing: currentUserDoc.toObject().following,
                targetUserFollowers: targetUserDoc.toObject().followers,
            };
        },
        unfollow: async (
            parent: any,
            args: { targetUserId: string },
            context: { token: string },
        ): Promise<FollowMutationPayload> => {
            const decodedToken = verifyJWT(context.token);
            const currentUser = await findUserById(decodedToken.id);
            const targetUser = await findUserById(args.targetUserId);
            const [currentUserDoc, targetUserDoc]: [UserDocument, UserDocument] = await unfollowUser(
                currentUser,
                targetUser,
            );
            return {
                currentUserFollowing: currentUserDoc.toObject().following,
                targetUserFollowers: targetUserDoc.toObject().followers,
            };
        },
        createPost: async (
            parent: unknown,
            args: { title: string; postType: string; entityId: string; contentType: string; content: string },
            context: { token: string },
        ): Promise<CreatePostMutationResponse> => {
            const decodedToken = verifyJWT(context.token);
            const [newPost] = await createPost(
                decodedToken.id,
                args.title,
                args.postType,
                args.entityId,
                args.contentType,
                args.content,
            );
            return {
                code: '200',
                success: true,
                message: 'Post successfully created.',
                post: newPost.toObject(),
            };
        },
        /**
         * @description Deletes the current user's post.
         *
         * @param args.postId The ObjectId of the post
         *
         * @returns Promise of DeletePostMutationResponse
         */
        deletePost: async (
            parent: unknown,
            args: { postId: string },
            context: { token: string },
        ): Promise<DeletePostMutationResponse> => {
            // Verify user.
            const decodedToken = verifyJWT(context.token);
            const currentUser = await findUserById(decodedToken.id);

            // Check if the post exists. If it doesn't, throw NotFoundError.
            const post: PostDocument = await findPostById(args.postId);
            if (!post) throw new NotFoundError('Post');

            // Check if the post belongs to the user. If it doesn't, throw NotAuthorizedError.
            if (post.poster.toString() !== currentUser.id) throw new NotAuthorizedError('delete post');
            if (!currentUser.posts.includes(post.id)) throw new NotAuthorizedError('delete post');

            // Delete the post.
            const [deletedPostId] = await deletePostById(post.id);
            return {
                code: '200',
                success: true,
                message: 'Post successfully deleted.',
                deletedPostId,
            };
        },
        likeOrDislikePost: async (
            parent: unknown,
            args: { postId: string; action: string },
            context: { token: string },
        ): Promise<LikeOrDislikePostMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the post exists.
                let post: PostDocument = await findPostById(args.postId);
                if (!post) throw new NotFoundError('Post');

                if (args.action === 'like') {
                    // Like the post.
                    [currentUser, post] = await likePost(currentUser, post);
                } else if (args.action === 'dislike') {
                    // Dislike the post.
                    [currentUser, post] = await dislikePost(currentUser, post);
                } else {
                    throw new Error('Specified action is neither like or dislike.');
                }

                return {
                    code: '200',
                    success: true,
                    message: `Successfully ${args.action}d the post.`,
                    postLikes: post.likes,
                    postDislikes: post.dislikes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        postLikes: null,
                        postDislikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        postLikes: null,
                        postDislikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        postLikes: null,
                        postDislikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        undoLikeOrDislikePost: async (
            parent: unknown,
            args: { postId: string; action: string },
            context: { token: string },
        ): Promise<LikeOrDislikePostMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the post exists.
                let post = await findPostById(args.postId);
                if (!post) throw new NotFoundError('Post');

                if (args.action === 'like') {
                    // Undo liking the post.
                    [currentUser, post] = await undoLikePost(currentUser, post);
                } else if (args.action === 'dislike') {
                    // Undo disliking the post.
                    [currentUser, post] = await undoDislikePost(currentUser, post);
                } else {
                    throw new Error('Specified action is neither like or dislike.');
                }

                return {
                    code: '200',
                    success: true,
                    message: `Successfully un${args.action}d the post.`,
                    postLikes: post.likes,
                    postDislikes: post.dislikes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        postLikes: null,
                        postDislikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        postLikes: null,
                        postDislikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        // Comments
        addComment: async (
            parent: unknown,
            args: { postId: string; content: string; parentId?: string },
            context: { token: string },
        ): Promise<AddCommentMutationResponse> => {
            // Verify user.
            const decodedToken = verifyJWT(context.token);
            const currentUser = await findUserById(decodedToken.id);

            // Create the comment.
            let comment: CommentDocument;

            try {
                const [newComment] = await createComment(args.postId, currentUser.id, args.content, args.parentId);
                comment = newComment;
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        comment: null,
                    };
                } else {
                    throw error;
                }
            }

            return {
                code: '201',
                success: true,
                message: 'Successfully created comment.',
                comment: comment.toObject(),
            };
        },
        deleteComment: async (
            parent: unknown,
            args: { commentId: string },
            context: { token: string },
        ): Promise<DeleteCommentMutationResponse> => {
            // Verify user.
            const decodedToken = verifyJWT(context.token);
            const currentUser = await findUserById(decodedToken.id);

            // Delete the comment.
            let deletedComment: CommentDocument;

            try {
                deletedComment = await deleteComment(args.commentId, currentUser.id);
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        deletedCommentId: null,
                    };
                } else if (error instanceof NotAuthorizedError) {
                    return {
                        code: '403',
                        success: false,
                        message: error.toString(),
                        deletedCommentId: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        deletedCommentId: null,
                    };
                } else {
                    throw error;
                }
            }

            return {
                code: '200',
                success: true,
                message: 'Successfully deleted comment.',
                deletedCommentId: deletedComment.id,
            };
        },
        likeOrDislikeComment: async (
            parent: unknown,
            args: { commentId: string; action: string },
            context: { token: string },
        ): Promise<LikeOrDislikeCommentMutationResponse> => {
            try {
                // Verify the user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the comment exists.
                let comment: CommentDocument = await findCommentById(args.commentId);
                if (!comment) throw new NotFoundError('Comment');

                if (args.action === 'like') {
                    // Like the comment.
                    [currentUser, comment] = await likeComment(currentUser, comment);
                } else if (args.action === 'dislike') {
                    // Dislike the comment.
                    [currentUser, comment] = await dislikeComment(currentUser, comment);
                } else {
                    throw new Error('Specified action is neither like or dislike.');
                }

                return {
                    code: '200',
                    success: true,
                    message: `Successfully ${args.action}d the comment.`,
                    commentLikes: comment.likes,
                    commentDislikes: comment.dislikes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        undoLikeOrDislikeComment: async (
            parent: unknown,
            args: { commentId: string; action: string },
            context: { token: string },
        ): Promise<LikeOrDislikeCommentMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the comment exists.
                let comment = await findCommentById(args.commentId);
                if (!comment) throw new NotFoundError('Comment');

                if (args.action === 'like') {
                    // Undo liking the comment.
                    [currentUser, comment] = await undoLikeComment(currentUser, comment);
                } else if (args.action === 'dislike') {
                    // Undo disliking the comment.
                    [currentUser, comment] = await undoDislikeComment(currentUser, comment);
                } else {
                    throw new Error('Specified action is neither like or dislike.');
                }

                return {
                    code: '200',
                    success: true,
                    message: `Successfully un${args.action}d the comment.`,
                    commentLikes: comment.likes,
                    commentDislikes: comment.dislikes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        commentLikes: null,
                        commentDislikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        // Artists
        likeArtist: async (
            parent: unknown,
            args: { artistId: string },
            context: { token: string },
        ): Promise<LikeArtistMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the artist exists.
                let artist = await findArtistById(args.artistId);
                if (!artist) throw new NotFoundError('Artist');

                // Like the artist.
                [currentUser, artist] = await likeArtist(currentUser, artist);

                return {
                    code: '200',
                    success: true,
                    message: 'Successfully liked the artist.',
                    artistLikes: artist.likes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        undoLikeArtist: async (
            parent: unknown,
            args: { artistId: string },
            context: { token: string },
        ): Promise<LikeArtistMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the artist exists.
                let artist = await findArtistById(args.artistId);
                if (!artist) throw new NotFoundError('Artist');

                // Undo liking the artist.
                [currentUser, artist] = await undoLikeArtist(currentUser, artist);

                return {
                    code: '200',
                    success: true,
                    message: 'Successfully unliked the artist.',
                    artistLikes: artist.likes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        artistLikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        likeAlbum: async (
            parent: unknown,
            args: { albumId: string },
            context: { token: string },
        ): Promise<LikeAlbumMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the album exists.
                let album = await findAlbumById(args.albumId);
                if (!album) throw new NotFoundError('Album');

                // Like the album.
                [currentUser, album] = await likeAlbum(currentUser, album);

                return {
                    code: '200',
                    success: true,
                    message: 'Successfully liked the album.',
                    albumLikes: album.likes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
        undoLikeAlbum: async (
            parent: unknown,
            args: { albumId: string },
            context: { token: string },
        ): Promise<LikeAlbumMutationResponse> => {
            try {
                // Verify user.
                const decodedToken = verifyJWT(context.token);
                let currentUser = await findUserById(decodedToken.id);
                if (!currentUser) throw new NotFoundError('Current user');

                // Check if the album exists.
                let album = await findAlbumById(args.albumId);
                if (!album) throw new NotFoundError('Album');

                // Undo liking the album.
                [currentUser, album] = await undoLikeAlbum(currentUser, album);

                return {
                    code: '200',
                    success: true,
                    message: 'Successfully unliked the album.',
                    albumLikes: album.likes,
                };
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return {
                        code: '404',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else if (error instanceof ConflictError) {
                    return {
                        code: '409',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else if (error instanceof NotAuthenticatedError) {
                    return {
                        code: '401',
                        success: false,
                        message: error.toString(),
                        albumLikes: null,
                    };
                } else {
                    throw error;
                }
            }
        },
    },
    MutationResponse: {
        __resolveType(mutationResponse: any, context: any, info: any): null {
            return null;
        },
    },
};
