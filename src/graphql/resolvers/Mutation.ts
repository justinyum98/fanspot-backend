import { AuthenticationError } from 'apollo-server-express';
import { AuthPayload, FollowMutationPayload, CreatePostMutationResponse } from '../types';
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
import { createPost } from '../../database/dataAccess/Post';
import { generateJWT, verifyJWT } from '../../utils/jwt';
import { validatePasswordMatch } from '../../utils/password';
// import { cacheUser } from '../../redis/actions';
import NotFoundError from '../../errors/NotFoundError';

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
    },
    MutationResponse: {
        __resolveType(mutationResponse: any, context: any, info: any): null {
            return null;
        },
    },
};
