import mongoose from 'mongoose';
import { PostModel, PostDocument } from '../models/PostModel';
import { UserDocument } from '../models/UserModel';
import { findUserById } from '../dataAccess/User';
import NotFoundError from '../../errors/NotFoundError';

export async function findPostById(id: string | mongoose.Types.ObjectId): Promise<PostDocument> {
    let post;
    try {
        post = await PostModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return post;
}

export async function createPost(
    poster: string,
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
