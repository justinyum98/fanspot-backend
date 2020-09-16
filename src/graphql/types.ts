import { UserObject } from '../database/models/UserModel';
import { PostObject } from '../database/models/PostModel';
import { CommentObject } from '../database/models/CommentModel';

export interface Follower {
    id: string;
    username: string;
    profilePictureUrl: string;
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
