import { UserObject } from '../database/models/UserModel';

export type AuthPayload = {
    user: UserObject;
    token: string;
};

export type FollowMutationPayload = {
    currentUserFollowing: string[];
    targetUserFollowers: string[];
};
