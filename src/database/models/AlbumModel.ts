import mongoose from 'mongoose';
import _ from 'lodash';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { SongDocument } from './SongModel';
import { PostDocument } from './PostModel';

export interface AlbumDocument extends mongoose.Document {
    title: string;
    description: string;
    cover: string;
    artists: mongoose.Types.Array<ArtistDocument['_id']>;
    tracks: mongoose.Types.Array<SongDocument['_id']>;
    releaseDate: Date;
    posts: mongoose.Types.Array<PostDocument['_id']>;
    likes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
}

const AlbumSchema: mongoose.Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: null,
    },
    cover: {
        type: String,
        required: true,
    },
    artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    releaseDate: {
        type: Date,
        required: true,
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    likes: {
        type: Number,
        default: 0,
    },
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export interface ArtistObject {
    id: string;
    title: string;
    description: string;
    cover: string;
    artists: string[];
    tracks: string[];
    releaseDate: Date;
    posts: string[];
    likes: number;
    likers: string[];
}

AlbumSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: AlbumDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        _.forEach(
            ret.artists,
            (artistId: mongoose.Types.ObjectId, index: number, artists: Array<mongoose.Types.ObjectId | string>) => {
                artists[index] = artistId.toString();
            },
        );
        _.forEach(
            ret.tracks,
            (songId: mongoose.Types.ObjectId, index: number, songs: Array<mongoose.Types.ObjectId | string>) => {
                songs[index] = songId.toString();
            },
        );
        _.forEach(
            ret.posts,
            (postId: mongoose.Types.ObjectId, index: number, posts: Array<mongoose.Types.ObjectId | string>) => {
                posts[index] = postId.toString();
            },
        );
        _.forEach(
            ret.likers,
            (userId: mongoose.Types.ObjectId, index: number, users: Array<mongoose.Types.ObjectId | string>) => {
                users[index] = userId.toString();
            },
        );
    },
});

// TODO: Add JSON once you implement caching.

export const AlbumModel: mongoose.Model<AlbumDocument> = mongoose.model<AlbumDocument>('Album', AlbumSchema);
