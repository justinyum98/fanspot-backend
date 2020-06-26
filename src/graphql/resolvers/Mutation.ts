import _ from 'lodash';
import { AuthenticationError } from 'apollo-server-express';
import { AuthPayload, FollowMutationPayload } from '../types';
import { UserDocument } from '../../database/models/UserModel';
import {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    followUser,
    unfollowUser,
} from '../../database/dataAccess/User';
import { generateJWT, verifyJWT } from '../../utils/jwt';
import { cacheUser } from '../../redis/actions';
import NotFoundError from '../../errors/NotFoundError';

export const Mutation = {
    Mutation: {
        login: async (parent: any, args: { username: string; password: string }): Promise<AuthPayload> => {
            const user: UserDocument = await findUserByUsername(args.username);
            if (!user) throw new NotFoundError('User with username');
            if (args.password !== user.password) throw new AuthenticationError('Password is incorrect.');
            await cacheUser(user);
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
            await cacheUser(newUser);
            const token: string = generateJWT(newUser.id, newUser.username);
            return { user: newUser.toObject(), token };
        },
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
    },
};
