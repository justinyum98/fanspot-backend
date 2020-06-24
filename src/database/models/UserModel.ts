import mongoose = require('mongoose');

export type UserDocument = mongoose.Document & {
    username: string;
    password: string;
    email: string;
    isArtist: boolean;
    followers: mongoose.Types.Array<mongoose.Types.ObjectId> | mongoose.Types.DocumentArray<UserDocument>;
    following: mongoose.Types.Array<mongoose.Types.ObjectId> | mongoose.Types.DocumentArray<UserDocument>;
};

// UserDocument.toObject() (for resolvers)
export type UserObject = {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    isArtist?: boolean;
    followers?: string[];
    following?: string[];
};

// UserDocument.toJSON() (for caching)
export type UserJSON = {
    id?: string;
    username?: string;
    password?: string;
    email?: string;
    isArtist?: boolean;
    followers?: string[];
    following?: string[];
};

const UserSchema: mongoose.Schema = new mongoose.Schema({
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
    isArtist: {
        type: Boolean,
        required: true,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

UserSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc: UserDocument, ret) => {
        // IMPORTANT: MUST DEPOPULATE FIELDS BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
        ret.following.forEach(
            (userId: mongoose.Types.ObjectId, index: number, following: Array<mongoose.Types.ObjectId | string>) => {
                following[index] = userId.toString();
            },
        );
        ret.followers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, followers: Array<mongoose.Types.ObjectId | string>) => {
                followers[index] = userId.toString();
            },
        );
    },
});

UserSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc, ret) => {
        // IMPORTANT: MUST DEPOPULATE FIELDS BEFORE USING toObject.
        ret.id = ret._id.toString();
        delete ret._id;
        ret.following.forEach(
            (userId: mongoose.Types.ObjectId, index: number, following: Array<mongoose.Types.ObjectId | string>) => {
                following[index] = userId.toString();
            },
        );
        ret.followers.forEach(
            (userId: mongoose.Types.ObjectId, index: number, followers: Array<mongoose.Types.ObjectId | string>) => {
                followers[index] = userId.toString();
            },
        );
    },
});

export const UserModel: mongoose.Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);
