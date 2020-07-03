import mongoose from 'mongoose';

export enum PostType {
    Artist = 'ARTIST',
    Album = 'ALBUM',
    Song = 'SONG',
}

export enum ContentType {
    Text = 'TEXT',
    Media = 'MEDIA',
}

export type PostDocument = mongoose.Document & {
    poster: string;
    title: string;
    likes: number;
    dislikes: number;
    likers: string[];
    dislikers: string[];
    postType: PostType;
    contentType: ContentType;
    content: string;
    createdAt: Date;
    updatedAt: Date;
};

const PostSchema: mongoose.Schema = new mongoose.Schema(
    {
        poster: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
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
        postType: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

export type PostObject = {
    id?: string;
    poster?: string;
    title?: string;
    likes?: number;
    dislikes?: number;
    likers?: string[];
    dislikers?: string[];
    postType?: PostType;
    contentType?: ContentType;
    content?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

PostSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: PostDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.poster = ret.poster.toString();
        ret.likers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, likers: Array<mongoose.Types.ObjectId | string>) => {
                likers[index] = userId.toString();
            },
        );
        ret.dislikers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, dislikers: Array<mongoose.Types.ObjectId | string>) => {
                dislikers[index] = userId.toString();
            },
        );
    },
});

export type PostJSON = {
    id?: string;
    poster?: string;
    title?: string;
    likes?: number;
    dislikes?: number;
    likers?: string[];
    dislikers?: string[];
    postType?: PostType;
    contentType?: ContentType;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
};

PostSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc: PostDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.likers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, likers: Array<mongoose.Types.ObjectId | string>) => {
                likers[index] = userId.toString();
            },
        );
        ret.dislikers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, dislikers: Array<mongoose.Types.ObjectId | string>) => {
                dislikers[index] = userId.toString();
            },
        );
        // Timestamps
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
    },
});

export const PostModel: mongoose.Model<PostDocument> = mongoose.model<PostDocument>('Post', PostSchema);
