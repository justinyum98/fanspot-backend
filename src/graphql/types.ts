import { UserObject } from '../database/models/UserModel';
import { PostObject } from '../database/models/PostModel';
import { CommentObject } from '../database/models/CommentModel';

export interface SearchResult {
    id: string;
    name: string;
    author: string | null;
    pictureUrl: string | null;
    type: 'user' | 'artist' | 'album' | 'track' | 'post';
}

export interface Follower {
    id: string;
    username: string;
    profilePictureUrl: string;
}

export interface PostComment {
    id: string;
    poster: Follower;
    content: string;
    likes: number;
    dislikes: number;
    parent: string;
    children: string[];
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Mutation
export interface MutationResponse {
    code: string;
    success: boolean;
    message: string;
}

export interface AuthPayload {
    user: UserObject;
    token: string;
}

export interface FollowMutationPayload {
    currentUserFollowing: string[];
    targetUserFollowers: string[];
}

export interface CreatePostMutationResponse extends MutationResponse {
    post: PostObject;
}

export interface DeletePostMutationResponse extends MutationResponse {
    deletedPostId: string;
}

export interface AddCommentMutationResponse extends MutationResponse {
    comment: CommentObject;
}

export interface DeleteCommentMutationResponse extends MutationResponse {
    deletedCommentId: string;
}

export interface LikeOrDislikePostMutationResponse extends MutationResponse {
    postLikes: number | null;
    postDislikes: number | null;
}

export interface LikeOrDislikeCommentMutationResponse extends MutationResponse {
    commentLikes: number | null;
    commentDislikes: number | null;
}

export interface LikeArtistMutationResponse extends MutationResponse {
    artistLikes: number | null;
}

export interface LikeAlbumMutationResponse extends MutationResponse {
    albumLikes: number | null;
}

export interface LikeTrackMutationResponse extends MutationResponse {
    trackLikes: number | null;
}
