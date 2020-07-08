import { PostModel, PostDocument } from '../models/PostModel';
import { UserDocument } from '../models/UserModel';
import { findUserById } from '../dataAccess/User';
import NotFoundError from '../../errors/NotFoundError';

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
 * @param postType Where the post is posted under. It can be either `'ARTIST'`, `'ALBUM'`, or `'SONG'`.
 * @param contentType The type of content. It can be either `'TEXT'` or `MEDIA'`.
 * @param content The content of the post. Depending on 'contentType', it will either be a plaintext of Markdown OR a media URL.
 *
 * @returns Tuple containing the created post and the user who posted it.
 */
export async function createPost(
    poster: UserDocument['_id'],
    title: string,
    postType: string,
    contentType: string,
    content: string,
): Promise<[PostDocument, UserDocument]> {
    let user: UserDocument;
    let newPost: PostDocument;
    try {
        user = await findUserById(poster);
        if (!user) throw new NotFoundError('User');
        newPost = new PostModel({
            poster,
            title,
            postType,
            contentType,
            content,
        });
        await newPost.save();
        user.posts.push(newPost.id);
        await user.save();
    } catch (error) {
        throw error;
    }
    return [newPost, user];
}

/**
 * Deletes a post with the provided ID.
 *
 * @param id ID of the post to be deleted.
 *
 * @returns ID of the deleted post.
 */
export async function deletePostById(id: PostDocument['_id']): Promise<PostDocument['_id']> {
    try {
        await PostModel.deleteOne({ _id: id });
    } catch (error) {
        throw error;
    }
    return id;
}
