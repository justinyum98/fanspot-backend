import mongoose from 'mongoose';
import { Follower, PostComment } from '../types';
import { verifyJWT } from '../../utils/jwt';
import { findUserById } from '../../database/dataAccess/User';
import { UserDocument } from '../../database/models/UserModel';
import { PostDocument, PostObject } from '../../database/models/PostModel';
import PrivacyError from '../../errors/PrivacyError';
import { findPostById } from '../..//database/dataAccess/Post';
import NotFoundError from '../../errors/NotFoundError';
import { CommentDocument, CommentModel } from '../../database/models/CommentModel';

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
        /**
         * Retrieves a user's posts.
         * * Functionally, there is not difference from 'getUserPosts' and 'getCurrentUserPosts'.
         * * However, I created two separate resolvers if, in the future, I add privacy settings on posts.
         */
        getUserPosts: async (parent: any, args: { userId: string }, context: any): Promise<PostObject[]> => {
            let targetUser: UserDocument = await findUserById(args.userId);
            targetUser = await targetUser.populate('posts').execPopulate();
            const posts: PostDocument[] = targetUser.posts.toObject();
            const postsPayload: PostObject[] = posts.map((post: PostDocument) => {
                return post.toObject();
            });
            return postsPayload;
        },
        getPostComments: async (parent: unknown, args: { postId: string }): Promise<PostComment[]> => {
            let post: PostDocument;
            let postComments: CommentDocument[];
            const payload: PostComment[] = [];
            try {
                // Verify that the post exists.
                post = await findPostById(args.postId);
                if (!post) throw new NotFoundError('Post');

                // Get the post's comments.
                postComments = await CommentModel.find({ post: post.id }).exec();
                for (let i = 0; i < postComments.length; i++) {
                    const postComment = await postComments[i]
                        .populate('poster', 'id username profilePictureUrl')
                        .execPopulate();
                    payload.push({
                        id: postComment.id,
                        poster: {
                            id: postComment.poster.id,
                            username: postComment.poster.username,
                            profilePictureUrl: postComment.poster.profilePictureUrl,
                        },
                        content: postComment.content,
                        likes: postComment.likes,
                        dislikes: postComment.dislikes,
                        parent: postComment.parent,
                        children: postComment.children,
                        isDeleted: postComment.isDeleted,
                        createdAt: postComment.createdAt,
                        updatedAt: postComment.updatedAt,
                    });
                }
            } catch (error) {
                throw error;
            }
            return payload;
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
