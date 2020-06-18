import { UserObject } from '../database/models/UserModel';

export type AuthPayload = {
    user: UserObject;
    token: string;
};

export type FollowPayload = {
    currentUser: UserObject;
    targetUser: UserObject;
};
