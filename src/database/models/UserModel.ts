import mongoose = require('mongoose');
import { PostDocument } from './PostModel';
import { ArtistDocument } from './ArtistModel';
import { CommentDocument } from './CommentModel';

export interface Privacy {
    follow: boolean;
}

export interface UserDocument extends mongoose.Document {
    username: string;
    password: string;
    email: string;
    profilePictureUrl: string;
    privacy: Privacy;
    isArtist: boolean;
    artist: ArtistDocument['_id'];
    followers: mongoose.Types.Array<UserDocument['_id']>;
    following: mongoose.Types.Array<UserDocument['_id']>;
    posts: mongoose.Types.Array<PostDocument['_id']>;
    comments: mongoose.Types.Array<CommentDocument['_id']>;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: mongoose.Schema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        profilePictureUrl: {
            type: String,
            default: null,
        },
        privacy: {
            // If true, the user's following and followers lists are public.
            follow: {
                type: Boolean,
                default: false,
            },
        },
        isArtist: {
            type: Boolean,
            default: false,
        },
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artist',
            default: null,
        },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    },
    { timestamps: true },
);

export interface UserObject {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    profilePictureUrl?: string;
    privacy?: Privacy;
    isArtist?: boolean;
    artist?: string;
    followers?: string[];
    following?: string[];
    posts?: string[];
    comments?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

UserSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: UserDocument, ret) => {
        // IMPORTANT: MUST DEPOPULATE DOC BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
        if (ret.artist) {
            ret.artist = ret.artist.toString();
        }
        if (ret.following) {
            ret.following = ret.following.map((userId: mongoose.Types.ObjectId) => userId.toString());
        }
        if (ret.followers) {
            ret.followers = ret.followers.map((userId: mongoose.Types.ObjectId) => userId.toString());
        }
        if (ret.posts) {
            ret.posts = ret.posts.map((postId: mongoose.Types.ObjectId) => postId.toString());
        }
        if (ret.comments) {
            ret.comments = ret.comments.map((commentId: mongoose.Types.ObjectId) => commentId.toString());
        }
    },
});

export interface UserJSON {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    profilePictureUrl?: string;
    privacy?: Privacy;
    isArtist?: boolean;
    artist?: string;
    followers?: string[];
    following?: string[];
    posts?: string[];
    createdAt?: string;
    updatedAt?: string;
}

UserSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc: UserDocument, ret) => {
        // IMPORTANT: MUST DEPOPULATE FIELDS BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
        if (ret.artist) {
            ret.artist = ret.artist.toString();
        }
        ret.following.forEach(
            (userId: mongoose.Types.ObjectId, index: number, following: Array<mongoose.Types.ObjectId | string>) => {
                following[index] = userId.toString();
            },
        );
        ret.followers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, followers: Array<mongoose.Types.ObjectId | string>) => {
                followers[index] = userId.toString();
            },
        );
        ret.posts.forEach(
            (postId: mongoose.Types.ObjectId, index: number, posts: Array<mongoose.Types.ObjectId | string>) => {
                posts[index] = postId.toString();
            },
        );
        // Timestamp
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
    },
});

export const UserModel: mongoose.Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);
