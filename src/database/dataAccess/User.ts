import mongoose = require('mongoose');
import { UserModel, UserDocument } from '../models/UserModel';
import { generatePasswordHash } from '../../utils/password';
import logger from '../../utils/logger';
import FollowError from '../../errors/FollowError';
import { PostDocument } from '../models/PostModel';
import ConflictError from '../../errors/ConflictError';

export async function findUserById(id: string | mongoose.Types.ObjectId): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findById(id, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function findUserByUsername(username: string): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function findUserByEmail(email: string): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ email }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function createUser(username: string, password: string, email: string): Promise<UserDocument> {
    let newUser: UserDocument;
    const passwordHash = await generatePasswordHash(password);
    try {
        newUser = new UserModel({
            username,
            password: passwordHash,
            email,
        });
        await newUser.save();
    } catch (error) {
        logger.error(error);
        throw error;
    }
    return newUser;
}

export async function followUser(
    currentUserDoc: UserDocument,
    targetUserDoc: UserDocument,
): Promise<[UserDocument, UserDocument]> {
    if (currentUserDoc.following.includes(targetUserDoc._id.toString()))
        throw new FollowError('Already following user.');

    try {
        currentUserDoc.following.push(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.push(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        logger.error(error);
        throw error;
    }

    return [currentUserDoc, targetUserDoc];
}

export async function unfollowUser(
    currentUserDoc: UserDocument,
    targetUserDoc: UserDocument,
): Promise<[UserDocument, UserDocument]> {
    if (!currentUserDoc.following.includes(targetUserDoc._id.toString()))
        throw new FollowError('Already not following user.');

    try {
        currentUserDoc.following.pull(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.pull(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        logger.error(error);
        throw error;
    }

    return [currentUserDoc, targetUserDoc];
}

export async function likePost(currentUser: UserDocument, post: PostDocument): Promise<[UserDocument, PostDocument]> {
    try {
        // Check if the user already liked the post.
        if (currentUser.likedPosts.includes(post.id) && post.likers.includes(currentUser.id))
            throw new ConflictError('The post is already liked by this user.');

        // Like the post.
        currentUser.likedPosts.push(post.id);
        post.likes = post.likers.push(currentUser.id);

        // If the user has already disliked the post, remove the dislike.
        if (currentUser.dislikedPosts.includes(post.id) && post.dislikers.includes(currentUser.id)) {
            currentUser.dislikedPosts.pull(post.id);
            post.dislikers.pull(currentUser.id);
            post.dislikes = post.dislikers.length;
        }

        // Save the changes.
        await currentUser.save();
        await post.save();

        return [currentUser, post];
    } catch (error) {
        throw error;
    }
}

export async function undoLikePost(
    currentUser: UserDocument,
    post: PostDocument,
): Promise<[UserDocument, PostDocument]> {
    try {
        // Verify that the user has liked the post.
        if (!(currentUser.likedPosts.includes(post.id) && post.likers.includes(currentUser.id)))
            throw new ConflictError('The user has not liked the post.');

        // Verify that the user has not disliked the post.
        if (currentUser.dislikedPosts.includes(post.id) && post.dislikers.includes(currentUser.id))
            throw new ConflictError('Cannot undo liking a post that the user has already disliked.');

        // Undo liking the post.
        currentUser.likedPosts.pull(post.id);
        post.likers.pull(currentUser.id);
        post.likes = post.likers.length;

        // Save the changes.
        await currentUser.save();
        await post.save();

        return [currentUser, post];
    } catch (error) {
        throw error;
    }
}

export async function dislikePost(
    currentUser: UserDocument,
    post: PostDocument,
): Promise<[UserDocument, PostDocument]> {
    try {
        // Check if the user already disliked the post.
        if (currentUser.dislikedPosts.includes(post.id) && post.dislikers.includes(currentUser.id))
            throw new ConflictError('The post is already disliked by this user.');

        // Dislike the post.
        currentUser.dislikedPosts.push(post.id);
        post.dislikers.push(currentUser.id);
        post.dislikes = post.dislikes + 1;

        // If the user has already liked the post, remove the like.
        if (currentUser.likedPosts.includes(post.id) && post.likers.includes(currentUser.id)) {
            currentUser.likedPosts.pull(post.id);
            post.likers.pull(currentUser.id);
            post.likes = post.likes - 1;
        }

        // Save the changes.
        await currentUser.save();
        await post.save();

        return [currentUser, post];
    } catch (error) {
        throw error;
    }
}

export async function undoDislikePost(
    currentUser: UserDocument,
    post: PostDocument,
): Promise<[UserDocument, PostDocument]> {
    try {
        // Verify that the user has disliked the post.
        if (!(currentUser.dislikedPosts.includes(post.id) && post.dislikers.includes(currentUser.id)))
            throw new ConflictError('The user has not disliked the post.');

        // Verify that the user has not liked the post.
        if (currentUser.likedPosts.includes(post.id) && post.likers.includes(currentUser.id))
            throw new ConflictError('Cannot undo liking a post that the user has already disliked.');

        // Undo disliking the post.
        currentUser.dislikedPosts.pull(post.id);
        post.dislikers.pull(currentUser.id);
        post.dislikes = post.dislikers.length;

        // Save the changes.
        await currentUser.save();
        await post.save();

        return [currentUser, post];
    } catch (error) {
        throw error;
    }
}

export async function populateUser(userDoc: UserDocument): Promise<UserDocument> {
    return userDoc.populate('followers').populate('following').execPopulate();
}
