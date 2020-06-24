import mongoose from 'mongoose';
import faker = require('faker');
import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import { createTestServer } from '../../src/graphql';
import { Follower, FollowMutationPayload } from '../../src/graphql/types';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserDocument } from '../../src/database/models/UserModel';
import { closeRedis } from '../../src/redis/actions';
import { generateJWT } from '../../src/utils/jwt';
import { createUser, findUserById } from '../../src/database/dataAccess/User';

describe('Follow feature', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await closeRedis();
        await connection.dropDatabase();
        await closeDatabase(connection);
    });

    describe('Mutation Follow', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;
        let targetUser: UserDocument;

        const FOLLOW_USER = gql`
            mutation FollowUser($targetUserId: String!) {
                follow(targetUserId: $targetUserId) {
                    currentUserFollowing
                    targetUserFollowers
                }
            }
        `;

        const UNFOLLOW_USER = gql`
            mutation UnfollowUser($targetUserId: String!) {
                unfollow(targetUserId: $targetUserId) {
                    currentUserFollowing
                    targetUserFollowers
                }
            }
        `;

        beforeAll(async () => {
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            targetUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
            const token = generateJWT(currentUser.id, currentUser.username);
            const context = { token };
            server = createTestServer(context);
            client = createTestClient(server);
        });

        beforeEach(async () => {
            currentUser = await findUserById(currentUser.id);
            targetUser = await findUserById(targetUser.id);
        });

        afterAll(async () => {
            await connection.dropDatabase();
        });

        it('can follow another user', async () => {
            const expectedPayload: FollowMutationPayload = {
                currentUserFollowing: [targetUser.id],
                targetUserFollowers: [currentUser.id],
            };

            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            const payload = res.data.follow;

            expect(payload).toEqual(expectedPayload);
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

            const expectedPayload: FollowMutationPayload = {
                currentUserFollowing: [],
                targetUserFollowers: [],
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

    describe('Query Follow', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;
        let targetUser: UserDocument;

        const GET_CURRENT_USER_FOLLOWING = gql`
            query GetCurrentUserFollowing {
                getCurrentUserFollowing {
                    id
                    username
                    profilePictureUrl
                }
            }
        `;

        const GET_CURRENT_USER_FOLLOWERS = gql`
            query GetCurrentUserFollowers {
                getCurrentUserFollowers {
                    id
                    username
                    profilePictureUrl
                }
            }
        `;

        const GET_USER_FOLLOWING = gql`
            query GetUserFollowing($userId: String!) {
                getUserFollowing(userId: $userId) {
                    id
                    username
                    profilePictureUrl
                }
            }
        `;

        const GET_USER_FOLLOWERS = gql`
            query GetUserFollowers($userId: String!) {
                getUserFollowers(userId: $userId) {
                    id
                    username
                    profilePictureUrl
                }
            }
        `;

        beforeAll(async () => {
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            targetUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
            const token = generateJWT(currentUser.id, currentUser.username);
            server = createTestServer({ token });
            client = createTestClient(server);
        });

        afterAll(async () => {
            await connection.dropDatabase();
        });

        it("can get current user's list of followers", async () => {
            // Make targetUser follow currentUser
            targetUser.following.push(currentUser.id);
            await targetUser.save();
            // Update currentUser's followers
            currentUser.followers.push(targetUser.id);
            await currentUser.save();
            const expectedPayload: Follower[] = [
                {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePictureUrl: targetUser.profilePictureUrl,
                },
            ];

            // Retreive currentUser's followers
            const res = await client.query({
                query: GET_CURRENT_USER_FOLLOWERS,
            });
            const payload = res.data.getCurrentUserFollowers;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get current user's list of following", async () => {
            // Make currentUser follow targetUser
            currentUser.following.push(targetUser.id);
            await currentUser.save();
            // Update targetUser's followers
            targetUser.followers.push(currentUser.id);
            await targetUser.save();
            const expectedPayload: Follower[] = [
                {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePictureUrl: targetUser.profilePictureUrl,
                },
            ];

            // Retrieve currentUser's following
            const res = await client.query({
                query: GET_CURRENT_USER_FOLLOWING,
            });
            const payload = res.data.getCurrentUserFollowing;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get another user's list of following", async () => {
            // Set follow privacy setting to public
            targetUser.privacy.follow = true;
            await targetUser.save();

            const expectedPayload: Follower[] = [
                {
                    id: currentUser.id,
                    username: currentUser.username,
                    profilePictureUrl: currentUser.profilePictureUrl,
                },
            ];

            const res = await client.query({
                query: GET_USER_FOLLOWING,
                variables: {
                    userId: targetUser.id,
                },
            });
            const payload = res.data.getUserFollowing;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get another user's list of followers", async () => {
            const expectedPayload: Follower[] = [
                {
                    id: currentUser.id,
                    username: currentUser.username,
                    profilePictureUrl: currentUser.profilePictureUrl,
                },
            ];

            const res = await client.query({
                query: GET_USER_FOLLOWERS,
                variables: {
                    userId: targetUser.id,
                },
            });
            const payload = res.data.getUserFollowers;

            expect(payload).toEqual(expectedPayload);
        });

        it("cannot get another user's list of followers if follow privacy setting is private", async () => {
            targetUser.privacy.follow = false;
            await targetUser.save();

            const res = await client.query({
                query: GET_USER_FOLLOWERS,
                variables: {
                    userId: targetUser.id,
                },
            });
            console.log(res);

            expect(res.data).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual("User's follow setting is set to private.");
        });

        it("cannot get another user's list of following if follow privacy setting is private", async () => {
            const res = await client.query({
                query: GET_USER_FOLLOWING,
                variables: {
                    userId: targetUser.id,
                },
            });
            console.log(res);

            expect(res.data).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual("User's follow setting is set to private.");
        });
    });
});
