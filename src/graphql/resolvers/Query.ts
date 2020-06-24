import mongoose from 'mongoose';
import { Follower } from '../types';
import { verifyJWT } from '../../utils/jwt';
import { findUserById } from '../../database/dataAccess/User';
import { UserDocument } from '../../database/models/UserModel';

export const Query = {
    Query: {
        // Public
        sayHello: (): string => 'hello',
        getUserFollowers: async (parent: any, args: { userId: string }, context: any): Promise<Follower[]> => {
            let targetUser: UserDocument = await findUserById(args.userId);
            targetUser = await targetUser.populate('followers', 'id username profilePictureUrl').execPopulate();
            const followers: mongoose.Types.ObjectId[] | UserDocument[] = targetUser.followers.toObject();
            const followersPayload: Follower[] = (followers as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followersPayload;
        },
        getUserFollowing: async (parent: any, args: { userId: string }, context: any): Promise<Follower[]> => {
            let targetUser: UserDocument = await findUserById(args.userId);
            targetUser = await targetUser.populate('following', 'id username profilePictureUrl').execPopulate();
            const following: mongoose.Types.ObjectId[] | UserDocument[] = targetUser.following.toObject();
            const followingPayload: Follower[] = (following as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followingPayload;
        },
        // Private (requires token)
        getCurrentUserFollowers: async (parent: any, args: any, context: { token: string }): Promise<Follower[]> => {
            const decodedToken = await verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById(decodedToken.id);
            currentUser = await currentUser.populate('followers', 'id username profilePictureUrl').execPopulate();
            const followers: mongoose.Types.ObjectId[] | UserDocument[] = currentUser.followers.toObject();
            const followersPayload: Follower[] = (followers as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followersPayload;
        },
        getCurrentUserFollowing: async (parent: any, args: any, context: { token: string }): Promise<Follower[]> => {
            const decodedToken = await verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById(decodedToken.id);
            currentUser = await currentUser.populate('following', 'id username profilePictureUrl').execPopulate();
            const following: mongoose.Types.ObjectId[] | UserDocument[] = currentUser.following.toObject();
            const followingPayload: Follower[] = (following as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followingPayload;
        },
    },
};
