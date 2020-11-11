import mongoose from 'mongoose';
import _ from 'lodash';
import { UserDocument } from './UserModel';
import { ArtistDocument } from './ArtistModel';
import { AlbumDocument } from './AlbumModel';
import { PostDocument } from './PostModel';

export interface TrackDocument extends mongoose.Document {
    title: string;
    spotifyId: string;
    description: string;
    explicit: boolean;
    discNumber: number;
    trackNumber: number;
    duration: number;
    artists: mongoose.Types.Array<ArtistDocument['_id']>;
    album: AlbumDocument['_id'];
    posts: mongoose.Types.Array<PostDocument['_id']>;
    likes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    followers: mongoose.Types.Array<UserDocument['_id']>;
}

const TrackSchema: mongoose.Schema = new mongoose.Schema({
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
    explicit: {
        type: Boolean,
        required: true,
    },
    discNumber: {
        type: Number,
        default: 1,
    },
    trackNumber: {
        type: Number,
        required: true,
    },
    // The song duration (in milliseconds)
    duration: {
        type: Number,
        required: true,
    },
    artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
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
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export interface TrackObject {
    id: string;
    title: string;
    spotifyId: string;
    description: string;
    explicit: boolean;
    discNumber: number;
    trackNumber: number;
    duration: number;
    artists: string[];
    album: string;
    posts: string[];
    likes: number;
    likers: string[];
    followers: string[];
}

TrackSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: TrackDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.album = ret.album ? ret.album.toString() : null;
        if (ret.artists) {
            ret.artists = ret.artists.map((artistId: mongoose.Types.ObjectId) => artistId.toString());
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

export const TrackModel: mongoose.Model<TrackDocument> = mongoose.model<TrackDocument>('Track', TrackSchema);
