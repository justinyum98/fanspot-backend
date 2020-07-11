import mongoose from 'mongoose';
import _ from 'lodash';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { AlbumDocument } from './AlbumModel';
import { PostDocument } from './PostModel';

export interface SongDocument extends mongoose.Document {
    title: string;
    description: string;
    artists: mongoose.Types.Array<ArtistDocument['_id']>;
    features: mongoose.Types.Array<ArtistDocument['_id']>;
    album: AlbumDocument['_id'];
    posts: mongoose.Types.Array<PostDocument['_id']>;
    likes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
}

const SongSchema: mongoose.Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: null,
    },
    artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    features: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: true,
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    likes: {
        type: Number,
        default: 0,
    },
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export interface SongObject {
    id: string;
    title: string;
    description: string;
    artists: string[];
    features: string[];
    album: string;
    posts: string[];
    likes: number;
    likers: string[];
}

SongSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: SongDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        _.forEach(
            ret.artists,
            (artistId: mongoose.Types.ObjectId, index: number, artists: Array<mongoose.Types.ObjectId | string>) => {
                artists[index] = artistId.toString();
            },
        );
        _.forEach(
            ret.features,
            (artistId: mongoose.Types.ObjectId, index: number, artists: Array<mongoose.Types.ObjectId | string>) => {
                artists[index] = artistId.toString();
            },
        );
        ret.album = ret.album.toString();
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

export const SongModel: mongoose.Model<SongDocument> = mongoose.model<SongDocument>('Song', SongSchema);
