const faker = require('faker');
const { connectTestDatabase, closeTestDatabase } = require('../..');
const { findUserById, createUser, followUser, unfollowUser } = require('../User');

describe('User data access methods', () => {
    let connection;
    let currentUser;
    let targetUser;

    beforeAll(async () => {
        connection = await connectTestDatabase();
    });

    afterAll(async () => {
        await closeTestDatabase(connection);
    });

    // Tests rely on each other
    it('can create a new User', async () => {
        const requiredData = {
            username: faker.internet.userName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
        };

        currentUser = await createUser(requiredData);
        const userObject = currentUser.toObject();

        expect(userObject.id).toBeDefined();
        expect(userObject.username).toEqual(requiredData.username);
        expect(userObject.password).toEqual(requiredData.password);
        expect(userObject.email).toEqual(requiredData.email);
        expect(userObject.isArtist).toEqual(false);
        expect(userObject.followers).toEqual([]);
        expect(userObject.following).toEqual([]);
    });

    it('can follow a user and update both users', async () => {
        targetUser = await createUser({
            username: faker.internet.userName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
        });

        const { currentUserDoc, targetUserDoc } = await followUser(currentUser, targetUser);
        currentUser = currentUserDoc;
        targetUser = targetUserDoc;

        expect(currentUser.following.length).toEqual(1);
        expect(currentUser.following[0].toString()).toEqual(targetUser.id);
        expect(targetUser.followers.length).toEqual(1);
        expect(targetUser.followers[0].toString()).toEqual(currentUser.id);
    });

    it('cannot follow a user again', async () => {
        await expect(followUser(currentUser, targetUser)).rejects.toThrow(
            new Error('Already following user.')
        );
    });

    it('can unfollow a user and update both users', async () => {
        currentUser = await findUserById(currentUser._id.toString());
        targetUser = await findUserById(targetUser._id.toString());

        const { currentUserDoc, targetUserDoc } = await unfollowUser(currentUser, targetUser);
        currentUser = currentUserDoc;
        targetUser = targetUserDoc;

        currentUser = await findUserById(currentUser._id.toString());
        targetUser = await findUserById(targetUser._id.toString());

        expect(currentUser.following.length).toEqual(0);
        expect(targetUser.followers.length).toEqual(0);
    });

    it("cannot unfollow a user that isn't being followed", async () => {
        await expect(unfollowUser(currentUser, targetUser)).rejects.toThrow(
            new Error('Already not following user.')
        );
    });
});
