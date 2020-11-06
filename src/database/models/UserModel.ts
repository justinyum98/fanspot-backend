import mongoose = require('mongoose');
import { PostDocument } from './PostModel';
import { ArtistDocument } from './ArtistModel';
import { CommentDocument } from './CommentModel';
import { AlbumDocument } from './AlbumModel';
import { TrackDocument } from './TrackModel';

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
    likedPosts: mongoose.Types.Array<PostDocument['_id']>;
    dislikedPosts: mongoose.Types.Array<PostDocument['_id']>;
    comments: mongoose.Types.Array<CommentDocument['_id']>;
    likedComments: mongoose.Types.Array<CommentDocument['_id']>;
    dislikedComments: mongoose.Types.Array<CommentDocument['_id']>;
    likedArtists: mongoose.Types.Array<ArtistDocument['_id']>;
    likedAlbums: mongoose.Types.Array<AlbumDocument['_id']>;
    likedTracks: mongoose.Types.Array<TrackDocument['_id']>;
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
        likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
        dislikedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
        likedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
        dislikedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
        likedArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
        likedAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
        likedTracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
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
    likedPosts?: string[];
    dislikedPosts?: string[];
    comments?: string[];
    likedComments?: string[];
    dislikedComments?: string[];
    likedArtists?: string[];
    likedAlbums?: string[];
    likedTracks?: string[];
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
        if (ret.likedPosts) {
            ret.likedPosts = ret.likedPosts.map((postId: mongoose.Types.ObjectId) => postId.toString());
        }
        if (ret.dislikedPosts) {
            ret.dislikedPosts = ret.dislikedPosts.map((postId: mongoose.Types.ObjectId) => postId.toString());
        }
        if (ret.comments) {
            ret.comments = ret.comments.map((commentId: mongoose.Types.ObjectId) => commentId.toString());
        }
        if (ret.likedComments) {
            ret.likedComments = ret.likedComments.map((commentId: mongoose.Types.ObjectId) => commentId.toString());
        }
        if (ret.dislikedComments) {
            ret.dislikedComments = ret.dislikedComments.map((commentId: mongoose.Types.ObjectId) =>
                commentId.toString(),
            );
        }
        if (ret.likedArtists) {
            ret.likedArtists = ret.likedArtists.map((artistId: mongoose.Types.ObjectId) => artistId.toString());
        }
        if (ret.likedAlbums) {
            ret.likedAlbums = ret.likedAlbums.map((albumId: mongoose.Types.ObjectId) => albumId.toString());
        }
        if (ret.likedTracks) {
            ret.likedTracks = ret.likedTracks.map((trackId: mongoose.Types.ObjectId) => trackId.toString());
        }
    },
});

export const UserModel: mongoose.Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);
