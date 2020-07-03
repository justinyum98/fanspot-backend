import mongoose from 'mongoose';
import { PostModel, PostDocument } from '../models/PostModel';

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
): Promise<PostDocument> {
    let newPost: PostDocument;
    try {
        newPost = new PostModel({
            poster,
            title,
            postType,
            contentType,
            content,
        });
        await newPost.save();
    } catch (error) {
        throw error;
    }
    return newPost;
}
