import mongoose from 'mongoose';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { AlbumDocument } from './AlbumModel';
import { TrackDocument } from './TrackModel';
import { CommentDocument } from './CommentModel';

export interface PostDocument extends mongoose.Document {
    poster: UserDocument['_id'];
    title: string;
    likes: number;
    dislikes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    dislikers: mongoose.Types.Array<UserDocument['_id']>;
    postType: 'artist' | 'album' | 'track';
    artist: ArtistDocument['_id'];
    album: AlbumDocument['_id'];
    track: TrackDocument['_id'];
    contentType: 'text' | 'media';
    content: string;
    comments: mongoose.Types.Array<CommentDocument['_id']>;
    createdAt: Date;
    updatedAt: Date;
}

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
            enum: ['artist', 'album', 'track'],
        },
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artist',
            default: null,
        },
        album: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Album',
            default: null,
        },
        track: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Track',
            default: null,
        },
        contentType: {
            type: String,
            required: true,
            enum: ['text', 'media'],
        },
        content: {
            type: String,
            required: true,
        },
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    },
    { timestamps: true },
);

export interface PostObject {
    id?: string;
    poster?: string;
    title?: string;
    likes?: number;
    dislikes?: number;
    likers?: string[];
    dislikers?: string[];
    postType?: string;
    artist?: string;
    album?: string;
    track?: string;
    contentType?: string;
    content?: string;
    comments?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

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
        if (ret.artist) {
            ret.artist = ret.artist.toString();
        }
        if (ret.album) {
            ret.album = ret.album.toString();
        }
        if (ret.track) {
            ret.track = ret.track.toString();
        }
        ret.comments = ret.comments.map((commentId: mongoose.Types.ObjectId) => commentId.toString());
    },
});

// export interface PostJSON {
//     id?: string;
//     poster?: string;
//     title?: string;
//     likes?: number;
//     dislikes?: number;
//     likers?: string[];
//     dislikers?: string[];
//     postType?: string;
//     artist?: string;
//     album?: string;
//     song?: string;
//     contentType?: string;
//     content?: string;
//     createdAt?: string;
//     updatedAt?: string;
// }

// PostSchema.set('toJSON', {
//     versionKey: false,
//     virtuals: true,
//     transform: (doc: PostDocument, ret) => {
//         ret.id = ret._id.toString();
//         delete ret._id;
//         ret.likers.forEach(
//             (userId: mongoose.Types.ObjectId, index: number, likers: Array<mongoose.Types.ObjectId | string>) => {
//                 likers[index] = userId.toString();
//             },
//         );
//         ret.dislikers.forEach(
//             (userId: mongoose.Types.ObjectId, index: number, dislikers: Array<mongoose.Types.ObjectId | string>) => {
//                 dislikers[index] = userId.toString();
//             },
//         );
//         ret.artist = ret.artist.toString();
//         ret.album = ret.album.toString();
//         ret.song = ret.song.toString();
//         // Timestamps
//         ret.createdAt = ret.createdAt.toISOString();
//         ret.updatedAt = ret.updatedAt.toISOString();
//     },
// });

export const PostModel: mongoose.Model<PostDocument> = mongoose.model<PostDocument>('Post', PostSchema);
