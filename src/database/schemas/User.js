const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
    username: String,
    password: String,
    email: String,
    isArtist: Boolean,
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

UserSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.following.forEach((userId, index, following) => {
            following[index] = {
                id: userId.toString(),
            };
        });
        ret.followers.forEach((userId, index, followers) => {
            followers[index] = {
                id: userId.toString(),
            };
        });
    },
});

UserSchema.set('toObject', {
    versionKey: false,
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        ret.following.forEach((userId, index, following) => {
            following[index] = {
                id: userId.toString(),
            };
        });
        ret.followers.forEach((userId, index, followers) => {
            followers[index] = {
                id: userId.toString(),
            };
        });
    },
});

module.exports = UserSchema;
