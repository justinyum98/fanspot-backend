import mongoose from 'mongoose';
import faker from 'faker';
import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import { createTestServer } from '../../src/graphql';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument } from '../../src/database/models/UserModel';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { PostModel, PostDocument, PostObject, PostType, ContentType } from '../../src/database/models/PostModel';
import { findPostById, createPost } from '../../src/database/dataAccess/Post';
import { generateJWT } from '../../src/utils/jwt';
import { CreatePostMutationResponse, DeletePostMutationResponse } from '../../src/graphql/types';

describe('Post feature', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await PostModel.deleteMany({}).exec();
        await closeDatabase(connection);
    });

    describe('Private', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;
        let createdPost: PostDocument;

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
            await connection.dropCollection('users');
            await connection.dropCollection('posts');
        });

        const CREATE_POST = gql`
            mutation CreatePost($title: String!, $postType: PostType!, $contentType: ContentType!, $content: String!) {
                createPost(title: $title, postType: $postType, contentType: $contentType, content: $content) {
                    code
                    success
                    message
                    post {
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
            }
        `;

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

        const GET_USER_POSTS = gql`
            query GetUserPosts($userId: ID!) {
                getUserPosts(userId: $userId) {
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

        const DELETE_POST = gql`
            mutation DeletePost($postId: ID!) {
                deletePost(postId: $postId) {
                    code
                    success
                    message
                    deletedPostId
                }
            }
        `;

        it('can create a post', async () => {
            const requiredData = {
                title: faker.lorem.words(6),
                postType: 'ARTIST',
                contentType: 'TEXT',
                content: faker.lorem.paragraph(),
            };

            // Create a post
            const res = await client.mutate({
                mutation: CREATE_POST,
                variables: { ...requiredData },
            });
            const payload = res.data.createPost;
            // Retrieve updated current user and actual post
            currentUser = await findUserById(currentUser.id);
            createdPost = await findPostById(payload.post.id);
            // Convert user and post to objects
            const postObj: PostObject = createdPost.toObject();

            const expectedPayload: CreatePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Post successfully created.',
                post: {
                    id: postObj.id,
                    poster: currentUser.id,
                    title: requiredData.title,
                    likes: 0,
                    dislikes: 0,
                    likers: [],
                    dislikers: [],
                    postType: PostType.Artist,
                    contentType: ContentType.Text,
                    content: requiredData.content,
                    createdAt: postObj.createdAt,
                    updatedAt: postObj.updatedAt,
                },
            };

            expect(payload).toMatchObject(expectedPayload);
        });

        it("can get the current user's posts", async () => {
            const res = await client.query({
                query: GET_CURRENT_USER_POSTS,
            });
            const payload = res.data.getCurrentUserPosts;
            const postObj = createdPost.toObject();

            const expectedPayload: [PostObject] = [
                {
                    id: postObj.id,
                    poster: currentUser.id,
                    title: postObj.title,
                    likes: postObj.likes,
                    dislikes: postObj.dislikes,
                    likers: postObj.likers,
                    dislikers: postObj.dislikers,
                    postType: postObj.postType,
                    contentType: postObj.contentType,
                    createdAt: postObj.createdAt,
                    updatedAt: postObj.updatedAt,
                },
            ];

            expect(payload).toMatchObject(expectedPayload);
        });

        it("can get the user's posts from the public resolver getUserPosts", async () => {
            const res = await client.query({
                query: GET_USER_POSTS,
                variables: {
                    userId: currentUser.id,
                },
            });
            const payload = res.data.getUserPosts;
            const postObj = createdPost.toObject();
            const expectedPayload: [PostObject] = [
                {
                    id: postObj.id,
                    poster: currentUser.id,
                    title: postObj.title,
                    likes: postObj.likes,
                    dislikes: postObj.dislikes,
                    likers: postObj.likers,
                    dislikers: postObj.dislikers,
                    postType: postObj.postType,
                    contentType: postObj.contentType,
                    createdAt: postObj.createdAt,
                    updatedAt: postObj.updatedAt,
                },
            ];

            expect(payload).toMatchObject(expectedPayload);
        });

        it("can delete the current user's post", async () => {
            const createdPostId = createdPost.id;
            const res = await client.mutate({
                mutation: DELETE_POST,
                variables: {
                    postId: createdPostId,
                },
            });
            const payload = res.data.deletePost;
            const expectedPayload: DeletePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Post successfully deleted.',
                deletedPostId: createdPostId,
            };

            expect(payload).toMatchObject(expectedPayload);
        });

        it("cannot delete a post that doesn't belong to the current user", async () => {
            // Create new user
            const newUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            // Create new post with that new user
            const [newPost] = await createPost(
                newUser.id,
                faker.lorem.words(6),
                'ARTIST',
                'TEXT',
                faker.lorem.paragraphs(2),
            );

            // Try to delete that post as current user.
            const res = await client.mutate({
                mutation: DELETE_POST,
                variables: {
                    postId: newPost.id,
                },
            });

            expect(res.data.deletePost).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Not authorized to delete post');
        });
    });
});
