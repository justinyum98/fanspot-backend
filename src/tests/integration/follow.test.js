const faker = require('faker');
const { createTestClient } = require('apollo-server-testing');
const { gql } = require('apollo-server-express');
const { createTestServer } = require('../../graphql');
const { connectTestDatabase, closeTestDatabase } = require('../../database');
const { closeRedis } = require('../../redis/actions');
const { generateJWT } = require('../../utils/jwt');
const { createUser, findUserById } = require('../../database/dataAccess/User');

const FOLLOW_USER = gql`
    mutation FollowUser($targetUserId: String!) {
        follow(targetUserId: $targetUserId) {
            currentUser {
                id
                username
                email
                following {
                    id
                }
                followers {
                    id
                }
            }
            targetUser {
                id
                username
                email
                following {
                    id
                }
                followers {
                    id
                }
            }
        }
    }
`;

const UNFOLLOW_USER = gql`
    mutation UnfollowUser($targetUserId: String!) {
        unfollow(targetUserId: $targetUserId) {
            currentUser {
                id
                username
                email
                following {
                    id
                }
                followers {
                    id
                }
            }
            targetUser {
                id
                username
                email
                following {
                    id
                }
                followers {
                    id
                }
            }
        }
    }
`;

describe('Follow feature', () => {
    let connection;
    let server;
    let client;
    let currentUser;
    let targetUser;

    beforeAll(async () => {
        connection = await connectTestDatabase();
        currentUser = await createUser({
            username: faker.internet.userName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
        });
        targetUser = await createUser({
            username: faker.internet.userName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
        });
        const token = generateJWT(currentUser.id, currentUser.username);
        const context = { token };
        server = createTestServer(context);
        client = createTestClient(server);
    });

    afterAll(async () => {
        await closeRedis();
        await closeTestDatabase(connection);
    });

    describe('Follow', () => {
        beforeEach(async () => {
            currentUser = await findUserById(currentUser.id);
            targetUser = await findUserById(targetUser.id);
        });

        it('can follow another user', async () => {
            const expectedPayload = {
                currentUser: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    following: [{ id: targetUser.id }],
                    followers: [],
                },
                targetUser: {
                    id: targetUser.id,
                    username: targetUser.username,
                    email: targetUser.email,
                    following: [],
                    followers: [{ id: currentUser.id }],
                },
            };

            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            const payload = res.data.follow;

            expect(payload).toEqual(expectedPayload);

            expect(payload.currentUser.id).toEqual(currentUser.id);
            expect(payload.currentUser.following.length).toEqual(1);
            expect(payload.currentUser.following[0].id).toEqual(payload.targetUser.id);
            expect(payload.currentUser.followers.length).toEqual(0);

            expect(payload.targetUser.id).toEqual(targetUser.id);
            expect(payload.targetUser.following.length).toEqual(0);
            expect(payload.targetUser.followers.length).toEqual(1);
            expect(payload.targetUser.followers[0].id).toEqual(payload.currentUser.id);
        });

        it('cannot follow a user that you are already following', async () => {
            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            currentUser = await findUserById(currentUser.id);
            targetUser = await findUserById(targetUser.id);

            expect(res.data.follow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Already following user.');

            expect(currentUser.following.length).toEqual(1);
            expect(targetUser.followers.length).toEqual(1);
        });

        it('can unfollow another user', async () => {
            expect(currentUser.following.length).toEqual(1);
            expect(targetUser.followers.length).toEqual(1);

            const expectedPayload = {
                currentUser: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    following: [],
                    followers: [],
                },
                targetUser: {
                    id: targetUser.id,
                    username: targetUser.username,
                    email: targetUser.email,
                    following: [],
                    followers: [],
                },
            };

            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser._id.toString(),
                },
            });

            const payload = res.data.unfollow;

            expect(payload).toEqual(expectedPayload);
        });

        it('cannot unfollow user you are not following', async () => {
            expect(currentUser.following.length).toEqual(0);
            expect(targetUser.followers.length).toEqual(0);

            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser._id.toString(),
                },
            });

            expect(res.data.unfollow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Already not following user.');
        });
    });
});
