import { UserObject } from '../database/models/UserModel';
import { PostObject } from '../database/models/PostModel';

export type Follower = {
    id: string;
    username: string;
    profilePictureUrl: string;
};

// Mutation
export interface MutationResponse {
    code: string;
    success: boolean;
    message: string;
}

export type AuthPayload = {
    user: UserObject;
    token: string;
};

export type FollowMutationPayload = {
    currentUserFollowing: string[];
    targetUserFollowers: string[];
};

export interface CreatePostMutationResponse extends MutationResponse {
    post: PostObject;
}
