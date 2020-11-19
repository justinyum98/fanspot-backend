import mongoose = require('mongoose');
import { UserModel, UserDocument } from '../models/UserModel';
import { generatePasswordHash } from '../../utils/password';
import logger from '../../utils/logger';
import FollowError from '../../errors/FollowError';
import { PostDocument } from '../models/PostModel';
import ConflictError from '../../errors/ConflictError';
import { CommentDocument } from '../models/CommentModel';
import { ArtistDocument } from '../models/ArtistModel';
import { AlbumDocument } from '../models/AlbumModel';
import { TrackDocument } from '../models/TrackModel';

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

export async function followArtist(
    currentUser: UserDocument,
    artist: ArtistDocument,
): Promise<[UserDocument, ArtistDocument]> {
    try {
        // Check if the user is already following the artist.
        if (currentUser.followedArtists.includes(artist.id) && artist.followers.includes(currentUser.id))
            throw new ConflictError('Already following the artist.');

        // Follow the artist.
        currentUser.followedArtists.push(artist.id);
        artist.followers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await artist.save();

        return [currentUser, artist];
    } catch (error) {
        throw error;
    }
}

export async function unfollowArtist(
    currentUser: UserDocument,
    artist: ArtistDocument,
): Promise<[UserDocument, ArtistDocument]> {
    try {
        // Verify that the user is following the artist.
        if (!(currentUser.followedArtists.includes(artist.id) && artist.followers.includes(currentUser.id)))
            throw new ConflictError('Not following the artist.');

        // Unfollow the artist.
        currentUser.followedArtists.pull(artist.id);
        artist.followers.pull(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await artist.save();

        return [currentUser, artist];
    } catch (error) {
        throw error;
    }
}

export async function followAlbum(
    currentUser: UserDocument,
    album: AlbumDocument,
): Promise<[UserDocument, AlbumDocument]> {
    try {
        // Check if the user is already following the album.
        if (currentUser.followedAlbums.includes(album.id) && album.followers.includes(currentUser.id))
            throw new ConflictError('Already following the album.');

        // Follow the album.
        currentUser.followedAlbums.push(album.id);
        album.followers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await album.save();

        return [currentUser, album];
    } catch (error) {
        throw error;
    }
}

export async function unfollowAlbum(
    currentUser: UserDocument,
    album: AlbumDocument,
): Promise<[UserDocument, AlbumDocument]> {
    try {
        // Verify that the user is following the album.
        if (!(currentUser.followedAlbums.includes(album.id) && album.followers.includes(currentUser.id)))
            throw new ConflictError('Not following the album.');

        // Unfollow the album.
        currentUser.followedAlbums.pull(album.id);
        album.followers.pull(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await album.save();

        return [currentUser, album];
    } catch (error) {
        throw error;
    }
}

export async function followTrack(
    currentUser: UserDocument,
    track: TrackDocument,
): Promise<[UserDocument, TrackDocument]> {
    try {
        // Check if the user is already following the track.
        if (currentUser.followedTracks.includes(track.id) && track.followers.includes(currentUser.id))
            throw new ConflictError('Already following the track.');

        // Follow the track.
        currentUser.followedTracks.push(track.id);
        track.followers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await track.save();

        return [currentUser, track];
    } catch (error) {
        throw error;
    }
}

export async function unfollowTrack(
    currentUser: UserDocument,
    track: TrackDocument,
): Promise<[UserDocument, TrackDocument]> {
    try {
        // Verify that the user is following the track.
        if (!(currentUser.followedTracks.includes(track.id) && track.followers.includes(currentUser.id)))
            throw new ConflictError('Not following the track.');

        // Unfollow the track.
        currentUser.followedTracks.pull(track.id);
        track.followers.pull(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await track.save();

        return [currentUser, track];
    } catch (error) {
        throw error;
    }
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
        post.dislikes = post.dislikers.push(currentUser.id);

        // If the user has already liked the post, remove the like.
        if (currentUser.likedPosts.includes(post.id) && post.likers.includes(currentUser.id)) {
            currentUser.likedPosts.pull(post.id);
            post.likers.pull(currentUser.id);
            post.likes = post.likers.length;
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

export async function likeComment(
    currentUser: UserDocument,
    comment: CommentDocument,
): Promise<[UserDocument, CommentDocument]> {
    try {
        // Check if the user already liked the comment.
        if (currentUser.likedComments.includes(comment.id) && comment.likers.includes(currentUser.id))
            throw new ConflictError('The comment is already liked by this user.');

        // Like the comment.
        currentUser.likedComments.push(comment.id);
        comment.likes = comment.likers.push(currentUser.id);

        // If the user has already disliked the comment, remove the dislike.
        if (currentUser.dislikedComments.includes(comment.id) && comment.dislikers.includes(currentUser.id)) {
            currentUser.dislikedComments.pull(comment.id);
            comment.dislikers.pull(currentUser.id);
            comment.dislikes = comment.dislikers.length;
        }

        // Save the changes.
        await currentUser.save();
        await comment.save();

        return [currentUser, comment];
    } catch (error) {
        throw error;
    }
}

export async function undoLikeComment(
    currentUser: UserDocument,
    comment: CommentDocument,
): Promise<[UserDocument, CommentDocument]> {
    try {
        // Verify that the user has liked the comment.
        if (!(currentUser.likedComments.includes(comment.id) && comment.likers.includes(currentUser.id)))
            throw new ConflictError('The user has not liked the comment.');

        // Verify that the user has not disliked the comment.
        if (currentUser.dislikedComments.includes(comment.id) && comment.dislikers.includes(currentUser.id))
            throw new ConflictError('Cannot undo liking a comment that the user has already disliked.');

        // Undo liking the comment.
        currentUser.likedComments.pull(comment.id);
        comment.likers.pull(currentUser.id);
        comment.likes = comment.likers.length;

        // Save the changes.
        await currentUser.save();
        await comment.save();

        return [currentUser, comment];
    } catch (error) {
        throw error;
    }
}

export async function dislikeComment(
    currentUser: UserDocument,
    comment: CommentDocument,
): Promise<[UserDocument, CommentDocument]> {
    try {
        // Check if the user already disliked the comment.
        if (currentUser.dislikedComments.includes(comment.id) && comment.dislikers.includes(currentUser.id))
            throw new ConflictError('The comment is already disliked by this user.');

        // Dislike the comment.
        currentUser.dislikedComments.push(comment.id);
        comment.dislikes = comment.dislikers.push(currentUser.id);

        // If the user has already liked the comment, remove the like.
        if (currentUser.likedComments.includes(comment.id) && comment.likers.includes(currentUser.id)) {
            currentUser.likedComments.pull(comment.id);
            comment.likers.pull(currentUser.id);
            comment.likes = comment.likers.length;
        }

        // Save the changes.
        await currentUser.save();
        await comment.save();

        return [currentUser, comment];
    } catch (error) {
        throw error;
    }
}

export async function undoDislikeComment(
    currentUser: UserDocument,
    comment: CommentDocument,
): Promise<[UserDocument, CommentDocument]> {
    try {
        // Verify that the user has disliked the comment.
        if (!(currentUser.dislikedComments.includes(comment.id) && comment.dislikers.includes(currentUser.id)))
            throw new ConflictError('The user has not disliked the comment.');

        // Verify that the user has not liked the comment.
        if (currentUser.likedComments.includes(comment.id) && comment.likers.includes(currentUser.id))
            throw new ConflictError('Cannot undo liking a comment that the user has already disliked.');

        // Undo disliking the comment.
        currentUser.dislikedComments.pull(comment.id);
        comment.dislikers.pull(currentUser.id);
        comment.dislikes = comment.dislikers.length;

        // Save the changes.
        await currentUser.save();
        await comment.save();

        return [currentUser, comment];
    } catch (error) {
        throw error;
    }
}

export async function likeArtist(
    currentUser: UserDocument,
    artist: ArtistDocument,
): Promise<[UserDocument, ArtistDocument]> {
    try {
        // Check if the user has already liked the artist.
        if (currentUser.likedArtists.includes(artist.id) && artist.likers.includes(currentUser.id))
            throw new ConflictError('The artist is already liked by this user.');

        // Like the artist.
        currentUser.likedArtists.push(artist.id);
        artist.likes = artist.likers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await artist.save();

        return [currentUser, artist];
    } catch (error) {
        throw error;
    }
}

export async function undoLikeArtist(
    currentUser: UserDocument,
    artist: ArtistDocument,
): Promise<[UserDocument, ArtistDocument]> {
    try {
        // Verify that the user has liked the artist.
        if (!(currentUser.likedArtists.includes(artist.id) && artist.likers.includes(currentUser.id)))
            throw new ConflictError('The user has not liked the artist.');

        // Undo liking the artist.
        currentUser.likedArtists.pull(artist.id);
        artist.likers.pull(currentUser.id);
        artist.likes = artist.likers.length;

        // Save the changes.
        await currentUser.save();
        await artist.save();

        return [currentUser, artist];
    } catch (error) {
        throw error;
    }
}

export async function likeAlbum(
    currentUser: UserDocument,
    album: AlbumDocument,
): Promise<[UserDocument, AlbumDocument]> {
    try {
        // Check if the user has already liked the album.
        if (currentUser.likedAlbums.includes(album.id) && album.likers.includes(currentUser.id))
            throw new ConflictError('The album is already liked by this user.');

        // Like the album.
        currentUser.likedAlbums.push(album.id);
        album.likes = album.likers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await album.save();

        return [currentUser, album];
    } catch (error) {
        throw error;
    }
}

export async function undoLikeAlbum(
    currentUser: UserDocument,
    album: AlbumDocument,
): Promise<[UserDocument, AlbumDocument]> {
    try {
        // Verify that the user has liked the album.
        if (!(currentUser.likedAlbums.includes(album.id) && album.likers.includes(currentUser.id)))
            throw new ConflictError('The user has not liked the album.');

        // Undo liking the album.
        currentUser.likedAlbums.pull(album.id);
        album.likers.pull(currentUser.id);
        album.likes = album.likers.length;

        // Save the changes.
        await currentUser.save();
        await album.save();

        return [currentUser, album];
    } catch (error) {
        throw error;
    }
}

export async function likeTrack(
    currentUser: UserDocument,
    track: TrackDocument,
): Promise<[UserDocument, TrackDocument]> {
    try {
        // Check if the user has already liked the track.
        if (currentUser.likedTracks.includes(track.id) && track.likers.includes(currentUser.id))
            throw new ConflictError('The track is already liked by this user.');

        // Like the track.
        currentUser.likedTracks.push(track.id);
        track.likes = track.likers.push(currentUser.id);

        // Save the changes.
        await currentUser.save();
        await track.save();

        return [currentUser, track];
    } catch (error) {
        throw error;
    }
}

export async function undoLikeTrack(
    currentUser: UserDocument,
    track: TrackDocument,
): Promise<[UserDocument, TrackDocument]> {
    try {
        // Verify that the user has liked the track.
        if (!(currentUser.likedTracks.includes(track.id) && track.likers.includes(currentUser.id)))
            throw new ConflictError('The user has not liked the track.');

        // Undo liking the track.
        currentUser.likedTracks.pull(track.id);
        track.likers.pull(currentUser.id);
        track.likes = track.likers.length;

        // Save the changes.
        await currentUser.save();
        await track.save();

        return [currentUser, track];
    } catch (error) {
        throw error;
    }
}

export async function populateUser(userDoc: UserDocument): Promise<UserDocument> {
    return userDoc.populate('followers').populate('following').execPopulate();
}
