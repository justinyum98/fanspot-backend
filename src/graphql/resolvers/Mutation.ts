import _ from 'lodash';
import { AuthenticationError } from 'apollo-server-express';
import { AuthPayload, FollowPayload } from '../types';
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

export const Mutation = {
    Mutation: {
        login: async (parent: any, args: { username: string; password: string }): Promise<AuthPayload> => {
            const user: UserDocument = await findUserByUsername(args.username);
            // TODO: Replace with custom errors
            if (!user) throw new AuthenticationError('User with username does not exist.');
            if (args.username !== user.username || args.password !== user.password)
                throw new AuthenticationError('Username and/or password is incorrect.');
            await cacheUser(user);
            const token: string = generateJWT(user.id, user.username);
            return { user: user.toObject(), token };
        },
        register: async (
            parent: any,
            args: { username: string; password: string; email: string },
        ): Promise<AuthPayload> => {
            let user: UserDocument = await findUserByUsername(args.username);
            // TODO: Replace with custom errors
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
        ): Promise<FollowPayload> => {
            const decodedToken = await verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById((decodedToken as any).id);
            let targetUser: UserDocument = await findUserById(args.targetUserId);
            const [currentUserDoc, targetUserDoc]: [UserDocument, UserDocument] = await followUser(
                currentUser,
                targetUser,
            );
            currentUser = currentUserDoc;
            targetUser = targetUserDoc;
            return { currentUser: currentUser.toObject(), targetUser: targetUser.toObject() };
        },
        unfollow: async (
            parent: any,
            args: { targetUserId: string },
            context: { token: string },
        ): Promise<FollowPayload> => {
            const decodedToken = await verifyJWT(context.token);
            let currentUser = await findUserById((decodedToken as any).id);
            let targetUser = await findUserById(args.targetUserId);
            const [currentUserDoc, targetUserDoc]: [UserDocument, UserDocument] = await unfollowUser(
                currentUser,
                targetUser,
            );
            currentUser = currentUserDoc;
            targetUser = targetUserDoc;
            return { currentUser: currentUser.toObject(), targetUser: targetUser.toObject() };
        },
    },
};
