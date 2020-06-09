const _ = require('lodash');
const { createTestClient } = require('apollo-server-testing');
const {
    createTestServer,
    connectTestDatabase,
    getCachedUser,
    generateTestingJWT,
} = require('./testUtils');
const { findUserById, createUser, populateUser } = require('../../database/dataAccess/User');
const { FOLLOW_USER, UNFOLLOW_USER } = require('./mutations');

describe('Follow feature', () => {
    let connection;
    let server;
    let client;
    let currentUser;
    let targetUser;

    beforeAll(async () => {
        connection = await connectTestDatabase();
        currentUser = await createUser({
            username: 'testuser1',
            password: 'password',
            email: 'testuser1@email.com',
        });
        targetUser = await createUser({
            username: 'testuser2',
            password: 'password',
            email: 'testuser2@email.com',
        });
        const token = generateTestingJWT(currentUser.id, currentUser.username);
        const context = { token };
        server = createTestServer(context);
        client = createTestClient(server);
    });

    afterAll(async () => {
        await connection.close();
    });

    describe('Follow', () => {
        it('can follow another user', async () => {
            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            const payload = res.data.follow;
            // TODO: After fixing data access, uncomment
            // const cachedCurrentUser = await getCachedUser(currentUser.id);
            // const cachedTargetUser = await getCachedUser(targetUser.id);

            expect(payload.currentUser.id).toEqual(currentUser.id);
            expect(payload.currentUser.following.length).toEqual(1);
            expect(_.find(payload.currentUser.following, ['id', targetUser.id])).toBeDefined();
            expect(payload.currentUser.followers.length).toEqual(0);

            expect(payload.targetUser.id).toEqual(targetUser.id);
            expect(payload.targetUser.followers.length).toEqual(1);
            expect(_.find(payload.targetUser.followers, ['id', currentUser.id])).toBeDefined();
            expect(payload.targetUser.following.length).toEqual(0);

            // TODO: After fixing Data Access, uncomment
            // expect(cachedCurrentUser).toEqual(currentUser.toJSON());
            // expect(cachedTargetUser).toEqual(targetUser.toJSON());
        });

        // Note: Relies on test above
        it('cannot follow a user that you are already following', async () => {
            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });

            expect(res.data.follow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('You are already following that user.');
        });
    });

    describe('Unfollow', () => {
        it('can unfollow another user', async () => {
            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            const payload = res.data.unfollow;
            const cachedCurrentUser = await getCachedUser(currentUser.id);
            const cachedTargetUser = await getCachedUser(targetUser.id);

            expect(payload.currentUser.id).toEqual(currentUser.id);
            expect(payload.currentUser.following.length).toEqual(0);
            expect(payload.currentUser.followers.length).toEqual(0);

            expect(payload.targetUser.id).toEqual(targetUser.id);
            expect(payload.targetUser.followers.length).toEqual(0);
            expect(payload.targetUser.following.length).toEqual(0);

            expect(cachedCurrentUser).toEqual(currentUser.toJSON());
            expect(cachedTargetUser).toEqual(targetUser.toJSON());
        });

        it('cannot unfollow a user that you are not following', async () => {
            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });

            expect(res.data.unfollow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('You are already not following that user.');
        });
    });
});
