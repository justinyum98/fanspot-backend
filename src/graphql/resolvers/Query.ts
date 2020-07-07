import mongoose from 'mongoose';
import { Follower } from '../types';
import { verifyJWT } from '../../utils/jwt';
import { findUserById } from '../../database/dataAccess/User';
import { UserDocument } from '../../database/models/UserModel';
import { PostDocument, PostObject } from '../../database/models/PostModel';
import PrivacyError from '../../errors/PrivacyError';

export const Query = {
    Query: {
        // Public
        sayHello: (): string => 'hello',
        getUserFollowers: async (parent: any, args: { userId: string }, context: any): Promise<Follower[]> => {
            let targetUser: UserDocument = await findUserById(args.userId);
            if (!targetUser.privacy.follow) throw new PrivacyError('follow');
            targetUser = await targetUser.populate('followers', 'id username profilePictureUrl').execPopulate();
            const followers: mongoose.Types.ObjectId[] | UserDocument[] = targetUser.followers.toObject();
            const followersPayload: Follower[] = (followers as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followersPayload;
        },
        getUserFollowing: async (parent: any, args: { userId: string }, context: any): Promise<Follower[]> => {
            let targetUser: UserDocument = await findUserById(args.userId);
            if (!targetUser.privacy.follow) throw new PrivacyError('follow');
            targetUser = await targetUser.populate('following', 'id username profilePictureUrl').execPopulate();
            const following: mongoose.Types.ObjectId[] | UserDocument[] = targetUser.following.toObject();
            const followingPayload: Follower[] = (following as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followingPayload;
        },
        // Private (requires token)
        getCurrentUserFollowers: async (parent: any, args: any, context: { token: string }): Promise<Follower[]> => {
            const decodedToken = verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById(decodedToken.id);
            currentUser = await currentUser.populate('followers', 'id username profilePictureUrl').execPopulate();
            const followers: mongoose.Types.ObjectId[] | UserDocument[] = currentUser.followers.toObject();
            const followersPayload: Follower[] = (followers as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followersPayload;
        },
        getCurrentUserFollowing: async (parent: any, args: any, context: { token: string }): Promise<Follower[]> => {
            const decodedToken = verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById(decodedToken.id);
            currentUser = await currentUser.populate('following', 'id username profilePictureUrl').execPopulate();
            const following: mongoose.Types.ObjectId[] | UserDocument[] = currentUser.following.toObject();
            const followingPayload: Follower[] = (following as UserDocument[]).map((user: UserDocument) => {
                return { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl };
            });
            return followingPayload;
        },
        getCurrentUserPosts: async (parent: any, args: any, context: { token: string }): Promise<PostObject[]> => {
            const decodedToken = verifyJWT(context.token);
            let currentUser: UserDocument = await findUserById(decodedToken.id);
            currentUser = await currentUser.populate('posts').execPopulate();
            const posts: mongoose.Types.ObjectId[] | PostDocument[] = currentUser.posts.toObject();
            const postsPayload: PostObject[] = (posts as PostDocument[]).map((post: PostDocument) => {
                return post.toObject();
            });
            return postsPayload;
        },
    },
};
