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
        let fakePost: PostDocument;

        beforeAll(async () => {
            fakeUsers = await createMultipleFakeUsers(3);
            fakePost = await createFakePost(fakeUsers[0].id);
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
                    author
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
            expect(payload[0].author).toBeNull();
            expect(payload[0].pictureUrl).toEqual(fakeUser.profilePictureUrl);
            expect(payload[0].type).toEqual('user');
        });

        it('should be able to search for posts', async () => {
            // Arrange

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
            expect(payload[0].author).toEqual(fakeUsers[0].username);
            expect(payload[0].pictureUrl).toBeNull();
            expect(payload[0].type).toEqual('post');
        });

        it('should be able to search for artists', async () => {
            // Arrange
            const artistName = '21 Savage';

            // Act
            const res = await client.query({
                query: SEARCH,
                variables: { queryStr: artistName },
            });
            const payload = res.data.search;

            // Assert
            expect(payload.length).toEqual(32);
            expect(payload[0].id).toBeDefined();
            expect(payload[0].name).toEqual(artistName);
            expect(payload[0].author).toBeNull();
            expect(payload[0].pictureUrl).toBeDefined();
            expect(payload[0].type).toEqual('artist');
        });

        it('should be able to search for albums', async () => {
            // Arrange
            const albumName = 'i am > i was';

            // Act
            const res = await client.query({
                query: SEARCH,
                variables: { queryStr: albumName },
            });
            const payload = res.data.search;

            // Assert
            // "3" because there's the deluxe and non-explicit versions.
            expect(payload.length).toEqual(3);
            expect(payload[0].id).toBeDefined();
            expect(payload[0].name).toEqual(albumName + ' (Deluxe)');
            expect(payload[0].author).toEqual('21 Savage');
            expect(payload[0].pictureUrl).toBeDefined();
            expect(payload[0].type).toEqual('album');
        });

        it('should be able to search for various entries', async () => {
            // Arrange
            const trackName = 'a lot';

            // Act
            const res = await client.query({
                query: SEARCH,
                variables: { queryStr: trackName },
            });
            const payload = res.data.search;

            // Assert
            // "6" because there's a lot of entities with "a lot" (case-insensitive) in them.
            expect(payload.length).toEqual(7);
            expect(payload[0].id).toBeDefined();
            expect(payload[0].name).toEqual('Been Thru a Lot');
            expect(payload[0].author).toEqual('Young Thug');
            expect(payload[0].pictureUrl).toBeDefined();
            expect(payload[0].type).toEqual('album');
        });
    });
});
