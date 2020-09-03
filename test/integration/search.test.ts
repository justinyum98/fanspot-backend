import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument } from '../../src/database/models/UserModel';
import { PostModel, PostDocument } from '../../src/database/models/PostModel';
import { ApolloServer, gql } from 'apollo-server-express';
import { ApolloServerTestClient, createTestClient } from 'apollo-server-testing';
import { createTestServer } from '../../src/graphql';
import { createMultipleFakeUsers, createFakePost } from '../testUtils';

describe('Search feature', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await PostModel.deleteMany({}).exec();
        await closeDatabase(connection);
    });

    describe('Public', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let fakeUsers: Array<UserDocument>;
        const fakePosts: Array<PostDocument> = [];

        beforeAll(async () => {
            fakeUsers = await createMultipleFakeUsers(3);
            fakeUsers.forEach(async (fakeUser) => {
                const fakePost = await createFakePost(fakeUser.id);
                fakePosts.push(fakePost);
            });
            server = createTestServer();
            client = createTestClient(server);
        });

        afterAll(async () => {
            await UserModel.deleteMany({}).exec();
            await PostModel.deleteMany({}).exec();
        });

        const SEARCH = gql`
            query Search($queryStr: String!) {
                search(queryStr: $queryStr) {
                    id
                    name
                    pictureUrl
                    type
                }
            }
        `;

        it('should be able to search for users', async () => {
            // Arrange
            const fakeUser = fakeUsers[0];

            // Act
            const res = await client.query({
                query: SEARCH,
                variables: { queryStr: fakeUser.username },
            });
            const payload = res.data.search;

            // Assert
            expect(payload.length).toEqual(1);
            expect(payload[0].id).toEqual(fakeUser.id);
            expect(payload[0].name).toEqual(fakeUser.username);
            expect(payload[0].pictureUrl).toEqual(fakeUser.profilePictureUrl);
            expect(payload[0].type).toEqual('user');
        });

        it('should be able to search for posts', async () => {
            // Arrange
            const fakePost = fakePosts[0];

            // Act
            const res = await client.query({
                query: SEARCH,
                variables: { queryStr: fakePost.title },
            });
            const payload = res.data.search;

            // Assert
            expect(payload.length).toEqual(1);
            expect(payload[0].id).toEqual(fakePost.id);
            expect(payload[0].name).toEqual(fakePost.title);
            expect(payload[0].pictureUrl).toEqual(null);
            expect(payload[0].type).toEqual('post');
        });
    });
});
