import mongoose from 'mongoose';
import faker from 'faker';
import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import { createTestServer } from '../../src/graphql';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserDocument, UserObject } from '../../src/database/models/UserModel';
import { createUser } from '../../src/database/dataAccess/User';
import { PostDocument, PostObject } from '../../src/database/models/PostModel';
import { createPost } from '../../src/database/dataAccess/Post';
import { generateJWT } from '../../src/utils/jwt';

describe('Post feature', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await closeDatabase(connection);
    });

    describe('Private', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;

        beforeAll(async () => {
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            const token = generateJWT(currentUser.id, currentUser.username);
            server = createTestServer({ token });
            client = createTestClient(server);
        });

        afterAll(async () => {
            await connection.dropDatabase();
        });

        const GET_CURRENT_USER_POSTS = gql`
            query GetCurrentUserPosts {
                getCurrentUserPosts {
                    id
                    poster
                    title
                    likes
                    dislikes
                    likers
                    dislikers
                    postType
                    contentType
                    content
                    createdAt
                    updatedAt
                }
            }
        `;

        it("can get the current user's posts", async () => {
            // Create a post
            const [newPost, user]: [PostDocument, UserDocument] = await createPost(
                currentUser.id,
                faker.lorem.words(5),
                'ARTIST',
                'TEXT',
                faker.lorem.paragraphs(),
            );

            const res = await client.query({
                query: GET_CURRENT_USER_POSTS,
            });
            const payload = res.data.getCurrentUserPosts;
            const postObject: PostObject = newPost.toObject();
            const userObject: UserObject = user.toObject();

            const expectedPayload: [PostObject] = [
                {
                    id: postObject.id,
                    poster: userObject.id,
                    title: postObject.title,
                    likes: postObject.likes,
                    dislikes: postObject.dislikes,
                    likers: postObject.likers,
                    dislikers: postObject.dislikers,
                    postType: postObject.postType,
                    contentType: postObject.contentType,
                    createdAt: postObject.createdAt,
                    updatedAt: postObject.updatedAt,
                },
            ];

            expect(payload).toMatchObject(expectedPayload);
        });
    });
});
