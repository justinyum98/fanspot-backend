import mongoose from 'mongoose';
import { AuthenticationError } from 'apollo-server-express';
import { AuthPayload, FollowMutationPayload, CreatePostMutationResponse, DeletePostMutationResponse } from '../types';
import { UserDocument } from '../../database/models/UserModel';
import {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    followUser,
    unfollowUser,
} from '../../database/dataAccess/User';
import { PostDocument, PostObject, PostType, ContentType } from '../../database/models/PostModel';
import { createPost, findPostById, deletePostById } from '../../database/dataAccess/Post';
import { generateJWT, verifyJWT } from '../../utils/jwt';
import { validatePasswordMatch } from '../../utils/password';
// import { cacheUser } from '../../redis/actions';
import NotFoundError from '../../errors/NotFoundError';
import NotAuthorizedError from '../../errors/NotAuthorizedError';

export const Mutation = {
    Mutation: {
        // Public
        login: async (parent: any, args: { username: string; password: string }): Promise<AuthPayload> => {
            const user: UserDocument = await findUserByUsername(args.username);
            if (!user) throw new NotFoundError('User with username');
            const passwordsMatch = await validatePasswordMatch(args.password, user.password);
            if (!passwordsMatch) throw new AuthenticationError('Password is incorrect.');
            // TODO: Fix cache connection issue (https://trello.com/c/tVg1ofq4)
            // await cacheUser(user);
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
            // await cacheUser(newUser);
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
            parent: any,
            args: { title: string; postType: string; contentType: string; content: string },
            context: { token: string },
        ): Promise<CreatePostMutationResponse> => {
            const decodedToken = verifyJWT(context.token);
            const [newPost] = await createPost(
                decodedToken.id,
                args.title,
                args.postType,
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
            parent: any,
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

            // Delete the post by
            try {
                // (1) Remove the post id from user's "posts"
                currentUser.posts.pull(post.id);
                await currentUser.save();

                // TODO: Once you add 'Artist', 'Album', and 'Song', remove post from their respective 'posts' according to type.
            } catch (error) {
                throw error;
            }
            // (2) Delete the post from database
            const deletedPostId = await deletePostById(post.id);
            return {
                code: '200',
                success: true,
                message: 'Post successfully deleted.',
                deletedPostId,
            };
        },
    },
    MutationResponse: {
        __resolveType(mutationResponse: any, context: any, info: any): null {
            return null;
        },
    },
};
