import mongoose from 'mongoose';
import _ from 'lodash';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { TrackDocument } from './TrackModel';
import { PostDocument } from './PostModel';

export interface AlbumDocument extends mongoose.Document {
    title: string;
    spotifyId: string;
    description: string;
    coverArtUrl: string;
    albumType: string;
    artists: mongoose.Types.Array<ArtistDocument['_id']>;
    tracks: mongoose.Types.Array<TrackDocument['_id']>;
    releaseDate: Date;
    posts: mongoose.Types.Array<PostDocument['_id']>;
    likes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    followers: mongoose.Types.Array<UserDocument['_id']>;
}

const AlbumSchema: mongoose.Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    spotifyId: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    coverArtUrl: {
        type: String,
        default: null,
    },
    albumType: {
        type: String,
        required: true,
        enum: ['album', 'single'],
    },
    artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
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
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export interface AlbumObject {
    id: string;
    title: string;
    spotifyId: string;
    description: string;
    coverArtUrl: string;
    albumType: string;
    artists: string[];
    tracks: string[];
    releaseDate: Date;
    posts: string[];
    likes: number;
    likers: string[];
    followers: string[];
}

AlbumSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: AlbumDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        if (ret.artists) {
            ret.artists = ret.artists.map((artistId: mongoose.Types.ObjectId) => artistId.toString());
        }
        if (ret.tracks) {
            ret.tracks = ret.tracks.map((trackId: mongoose.Types.ObjectId) => trackId.toString());
        }
        if (ret.posts) {
            ret.posts = ret.posts.map((postId: mongoose.Types.ObjectId) => postId.toString());
        }
        if (ret.likers) {
            ret.likers = ret.likers.map((userId: mongoose.Types.ObjectId) => userId.toString());
        }
        if (ret.followers) {
            ret.followers = ret.followers.map((userId: mongoose.Types.ObjectId) => userId.toString());
        }
    },
});

export const AlbumModel: mongoose.Model<AlbumDocument> = mongoose.model<AlbumDocument>('Album', AlbumSchema);
