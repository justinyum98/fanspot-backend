import mongoose = require('mongoose');
import { UserModel, UserDocument } from '../models/UserModel';

export async function findUserById(id: string | mongoose.Types.ObjectId): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findById(id, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function findUserByUsername(username: string): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function findUserByEmail(email: string): Promise<UserDocument> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ email }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
}

export async function createUser(username: string, password: string, email: string): Promise<UserDocument> {
    let newUser: UserDocument;
    try {
        newUser = new UserModel({
            username,
            password,
            email,
            isArtist: false,
            followers: [],
            following: [],
        });
        await newUser.save();
    } catch (error) {
        // TODO: Handle error
        console.log(error);
        throw error;
    }
    return newUser;
}

export async function followUser(
    currentUserDoc: UserDocument,
    targetUserDoc: UserDocument,
): Promise<[UserDocument, UserDocument]> {
    // TODO: throw custom error
    if (currentUserDoc.following.includes(targetUserDoc._id.toString())) throw new Error('Already following user.');

    try {
        currentUserDoc.following.push(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.push(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        // TODO: Handle error
        console.log(error);
        throw error;
    }

    return [currentUserDoc, targetUserDoc];
}

export async function unfollowUser(
    currentUserDoc: UserDocument,
    targetUserDoc: UserDocument,
): Promise<[UserDocument, UserDocument]> {
    // TODO: throw custom error
    if (!currentUserDoc.following.includes(targetUserDoc._id.toString()))
        throw new Error('Already not following user.');

    try {
        currentUserDoc.following.pull(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.pull(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        // TODO: Handle error
        console.log(error);
        throw error;
    }

    return [currentUserDoc, targetUserDoc];
}

export async function populateUser(userDoc: UserDocument): Promise<UserDocument> {
    return userDoc.populate('followers').populate('following').execPopulate();
}
