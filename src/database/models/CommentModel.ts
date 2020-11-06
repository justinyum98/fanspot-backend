import mongoose from 'mongoose';
import { PostDocument } from './PostModel';
import { UserDocument } from './UserModel';

export interface CommentDocument extends mongoose.Document {
    post: PostDocument['_id'];
    poster: UserDocument['_id'];
    content: string;
    likes: number;
    dislikes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    dislikers: mongoose.Types.Array<UserDocument['_id']>;
    parent: CommentDocument['_id'] | null;
    children: mongoose.Types.Array<CommentDocument['_id']>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: mongoose.Schema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        poster: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
        dislikes: {
            type: Number,
            default: 0,
        },
        likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        dislikers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export interface CommentObject {
    id?: string;
    post?: string;
    poster?: string;
    content?: string;
    likes?: number;
    dislikes?: number;
    likers?: string[];
    dislikers?: string[];
    parent?: string | null;
    children?: string[];
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

CommentSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: CommentDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        if (ret.post) ret.post = ret.post.toString();
        if (ret.poster) ret.poster = ret.poster.toString();
        ret.likers = ret.likers.map((userId: mongoose.Types.ObjectId) => userId.toString());
        ret.dislikers = ret.dislikers.map((userId: mongoose.Types.ObjectId) => userId.toString());
        if (ret.parent) ret.parent = ret.parent.toString();
        ret.children = ret.children.map((commentId: mongoose.Types.ObjectId) => commentId.toString());
    },
});

export const CommentModel: mongoose.Model<CommentDocument> = mongoose.model<CommentDocument>('Comment', CommentSchema);
