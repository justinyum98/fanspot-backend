import mongoose from 'mongoose';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { AlbumDocument } from './AlbumModel';
import { SongDocument } from './SongModel';

export enum PostType {
    Artist = 'ARTIST',
    Album = 'ALBUM',
    Song = 'SONG',
}

export enum ContentType {
    Text = 'TEXT',
    Media = 'MEDIA',
}

export interface PostDocument extends mongoose.Document {
    poster: UserDocument['_id'];
    title: string;
    likes: number;
    dislikes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    dislikers: mongoose.Types.Array<UserDocument['_id']>;
    postType: PostType;
    artist: ArtistDocument['_id'];
    album: AlbumDocument['_id'];
    song: SongDocument['_id'];
    contentType: ContentType;
    content: string;
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
            enum: ['ARTIST', 'ALBUM', 'SONG'],
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
        song: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song',
            default: null,
        },
        contentType: {
            type: String,
            required: true,
            enum: ['TEXT', 'MEDIA'],
        },
        content: {
            type: String,
            required: true,
        },
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
    song?: string;
    contentType?: string;
    content?: string;
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
        if (ret.song) {
            ret.song = ret.song.toString();
        }
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
