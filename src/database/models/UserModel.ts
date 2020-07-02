import mongoose = require('mongoose');
import { PostDocument } from './PostModel';

export type Privacy = {
    follow: boolean;
};

export type UserDocument = mongoose.Document & {
    username: string;
    password: string;
    email: string;
    profilePictureUrl: string;
    privacy: Privacy;
    isArtist: boolean;
    followers: mongoose.Types.Array<mongoose.Types.ObjectId> | mongoose.Types.DocumentArray<UserDocument>;
    following: mongoose.Types.Array<mongoose.Types.ObjectId> | mongoose.Types.DocumentArray<UserDocument>;
    posts: mongoose.Types.Array<mongoose.Types.ObjectId> | mongoose.Types.DocumentArray<PostDocument>;
    createdAt: Date;
    updatedAt: Date;
};

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
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    },
    { timestamps: true },
);

export type UserJSON = {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    profilePictureUrl?: string;
    privacy?: Privacy;
    isArtist?: boolean;
    followers?: string[];
    following?: string[];
    posts?: string[];
    createdAt?: string;
    updatedAt?: string;
};

UserSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc: UserDocument, ret) => {
        // IMPORTANT: MUST DEPOPULATE FIELDS BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
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

export type UserObject = {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    profilePictureUrl?: string;
    privacy?: Privacy;
    isArtist?: boolean;
    followers?: string[];
    following?: string[];
    posts?: string[];
    createdAt?: Date;
    updatedAt?: Date;
};

UserSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: UserDocument, ret) => {
        // IMPORTANT: MUST DEPOPULATE DOC BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
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
    },
});

export const UserModel: mongoose.Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);
