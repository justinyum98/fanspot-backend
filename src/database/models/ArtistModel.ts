import mongoose from 'mongoose';
import _ from 'lodash';
import { UserDocument } from './UserModel';
import { AlbumDocument } from './AlbumModel';
import { PostDocument } from './PostModel';

export interface ArtistDocument extends mongoose.Document {
    name: string;
    user: UserDocument['_id'];
    spotifyId: string;
    biography: string;
    profilePictureUrl: string;
    genres: string[];
    albums: mongoose.Types.Array<AlbumDocument['_id']>;
    posts: mongoose.Types.Array<PostDocument['_id']>;
    likes: number;
    likers: mongoose.Types.Array<UserDocument['_id']>;
    followers: mongoose.Types.Array<UserDocument['_id']>;
}

const ArtistSchema: mongoose.Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    // (Optional) The Fanspot user account associated with the artist.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    spotifyId: {
        type: String,
        default: null,
    },
    biography: {
        type: String,
        default: null,
    },
    profilePictureUrl: {
        type: String,
        default: null,
    },
    genres: [String],
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    likes: {
        type: Number,
        default: 0,
    },
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export interface ArtistObject {
    id: string;
    name: string;
    user: string;
    spotifyId: string;
    biography: string;
    profilePictureUrl: string;
    genres: string[];
    albums: string[];
    posts: string[];
    likes: number;
    likers: string[];
    followers: string[];
}

ArtistSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc: ArtistDocument, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.user = ret.user ? ret.user.toString() : null;
        if (ret.albums) {
            ret.albums = ret.albums.map((albumId: mongoose.Types.ObjectId) => albumId.toString());
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

export const ArtistModel: mongoose.Model<ArtistDocument> = mongoose.model<ArtistDocument>('Artist', ArtistSchema);
