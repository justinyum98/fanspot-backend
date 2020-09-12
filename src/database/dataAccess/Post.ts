import { PostModel, PostDocument } from '../models/PostModel';
import { UserDocument } from '../models/UserModel';
import { findUserById } from '../dataAccess/User';
import NotFoundError from '../../errors/NotFoundError';
import { findArtistById } from './Artist';
import { findAlbumById } from './Album';
import { findTrackById } from './Track';
import { ArtistDocument } from '../models/ArtistModel';
import { AlbumDocument } from '../models/AlbumModel';
import { TrackDocument } from '../models/TrackModel';
import { Document } from 'mongoose';

/**
 * Finds a post by ID.
 *
 * @param id The post's ID.
 *
 * @returns If found, the post; if not found, then `null`.
 */
export async function findPostById(id: PostDocument['_id']): Promise<PostDocument> {
    let post;
    try {
        post = await PostModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return post;
}

/**
 * Creates a post.
 *
 * @param poster The user's ID.
 * @param title The title of the post.
 * @param postType Where the post is posted under. It can be either `'artist'`, `'album'`, or `'track'`.
 * @param contentType The type of content. It can be either `'TEXT'` or `MEDIA'`.
 * @param content The content of the post. Depending on 'contentType', it will either be a plaintext of Markdown OR a media URL.
 *
 * @returns Tuple containing the created post and the user who posted it.
 */
export async function createPost(
    poster: UserDocument['_id'],
    title: string,
    postType: string,
    entityId: string,
    contentType: string,
    content: string,
): Promise<[PostDocument, UserDocument, ArtistDocument | AlbumDocument | TrackDocument]> {
    let user: UserDocument;
    let newPost: PostDocument;
    let entity: ArtistDocument | AlbumDocument | TrackDocument;

    try {
        // Verify that user exists.
        user = await findUserById(poster);
        if (!user) throw new NotFoundError('User');

        // Verify that entity (Artist, Album, or Track) exists.
        if (postType === 'artist') {
            entity = await findArtistById(entityId);
        } else if (postType === 'album') {
            entity = await findAlbumById(entityId);
        } else if (postType === 'track') {
            entity = await findTrackById(entityId);
        }
        if (!entity) throw new NotFoundError(postType);

        // Create the post.
        const postFields = {
            poster,
            title,
            postType,
            artist: postType === 'artist' ? entityId : null,
            album: postType === 'album' ? entityId : null,
            track: postType === 'track' ? entityId : null,
            contentType,
            content,
        };
        newPost = new PostModel(postFields);

        // Add the post to user's posts.
        user.posts.push(newPost.id);

        // Add the post to entity's posts.
        entity.posts.push(newPost.id);

        // Save changes.
        await newPost.save();
        await user.save();
        await (entity as Document).save();
    } catch (error) {
        throw error;
    }
    return [newPost, user, entity];
}

/**
 * Deletes a post with the provided ID.
 *
 * @param id ID of the post to be deleted.
 *
 * @returns ID of the deleted post.
 */
export async function deletePostById(id: PostDocument['_id']): Promise<PostDocument['_id']> {
    let post: PostDocument;
    let poster: UserDocument;
    let entity: ArtistDocument | AlbumDocument | TrackDocument;

    try {
        // Verify that the post exists.
        post = await findPostById(id);
        if (!post) throw new NotFoundError('Post');

        // Verify that user exists, then remove the post.
        poster = await findUserById(post.poster);
        if (!poster) throw new NotFoundError('User');
        poster.posts.pull(post.id);

        // Verify that entity exists, then remove the post.
        if (post.postType === 'artist') {
            entity = await findArtistById(post.artist);
        } else if (post.postType === 'album') {
            entity = await findAlbumById(post.album);
        } else if (post.postType === 'track') {
            entity = await findTrackById(post.track);
        }
        if (!entity) throw new NotFoundError(post.postType);
        entity.posts.pull(post.id);

        // Save changes.
        poster.save();
        (entity as Document).save();

        // Remove the post from the user.
        await PostModel.deleteOne({ _id: id });
    } catch (error) {
        throw error;
    }
    return [id, poster, entity];
}
