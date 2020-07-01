import mongoose = require('mongoose');
import faker = require('faker');
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserDocument, UserObject } from '../../src/database/models/UserModel';
import { findUserById, createUser, followUser, unfollowUser } from '../../src/database/dataAccess/User';
import { validatePasswordMatch } from '../../src/utils/password';

describe('User data access methods', () => {
    let connection: mongoose.Connection;
    let currentUser: UserDocument;
    let targetUser: UserDocument;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await closeDatabase(connection);
    });

    // Tests rely on each other
    it('can create a new User', async () => {
        const requiredData = {
            username: faker.internet.userName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
        };

        currentUser = await createUser(requiredData.username, requiredData.password, requiredData.email);
        const passwordsMatch = await validatePasswordMatch(requiredData.password, currentUser.password);
        const userObject: UserObject = currentUser.toObject();

        expect(userObject.id).toBeDefined();
        expect(userObject.username).toEqual(requiredData.username);
        expect(passwordsMatch).toEqual(true);
        expect(userObject.email).toEqual(requiredData.email);
        expect(userObject.profilePictureUrl).toBeNull();
        expect(userObject.privacy).toEqual({
            follow: false,
        });
        expect(userObject.isArtist).toEqual(false);
        expect(userObject.followers).toEqual([]);
        expect(userObject.following).toEqual([]);
        expect(userObject.createdAt).toBeDefined();
        expect(userObject.updatedAt).toBeDefined();
    });

    it('can follow a user and update both users', async () => {
        targetUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());

        const [currentUserDoc, targetUserDoc] = await followUser(currentUser, targetUser);
        currentUser = currentUserDoc;
        targetUser = targetUserDoc;

        expect(currentUser.following.length).toEqual(1);
        expect(currentUser.following[0].toString()).toEqual(targetUser.id);
        expect(targetUser.followers.length).toEqual(1);
        expect(targetUser.followers[0].toString()).toEqual(currentUser.id);
    });

    it('cannot follow a user again', async () => {
        await expect(followUser(currentUser, targetUser)).rejects.toThrow(new Error('Already following user.'));
    });

    it('can unfollow a user and update both users', async () => {
        currentUser = await findUserById(currentUser._id.toString());
        targetUser = await findUserById(targetUser._id.toString());

        const [currentUserDoc, targetUserDoc] = await unfollowUser(currentUser, targetUser);
        currentUser = currentUserDoc;
        targetUser = targetUserDoc;

        currentUser = await findUserById(currentUser._id.toString());
        targetUser = await findUserById(targetUser._id.toString());

        expect(currentUser.following.length).toEqual(0);
        expect(targetUser.followers.length).toEqual(0);
    });

    it("cannot unfollow a user that isn't being followed", async () => {
        await expect(unfollowUser(currentUser, targetUser)).rejects.toThrow(new Error('Already not following user.'));
    });
});
