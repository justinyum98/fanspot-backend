import mongoose from 'mongoose';
import faker from 'faker';
import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import { createTestServer } from '../../src/graphql';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument } from '../../src/database/models/UserModel';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { PostModel, PostDocument, PostObject } from '../../src/database/models/PostModel';
import { findPostById, createPost } from '../../src/database/dataAccess/Post';
import { generateJWT } from '../../src/utils/jwt';
import { CreatePostMutationResponse, DeletePostMutationResponse } from '../../src/graphql/types';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { findArtistById } from '../../src/database/dataAccess/Artist';

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
        let artist: ArtistDocument;

        beforeAll(async () => {
            // Create the current user.
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            const token = generateJWT(currentUser.id, currentUser.username);
            server = createTestServer({ token });
            client = createTestClient(server);

            // Create the artist.
            artist = new ArtistModel({
                name: 'YOONii',
            });
            await artist.save();
        });

        afterAll(async () => {
            await UserModel.deleteMany({}).exec();
            await PostModel.deleteMany({}).exec();
            await ArtistModel.findByIdAndDelete(artist.id).exec();
        });

        const CREATE_POST = gql`
            mutation CreatePost(
                $title: String!
                $postType: PostType!
                $entityId: ID!
                $contentType: ContentType!
                $content: String!
            ) {
                createPost(
                    title: $title
                    postType: $postType
                    entityId: $entityId
                    contentType: $contentType
                    content: $content
                ) {
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
                        artist
                        album
                        track
                        contentType
                        content
                        comments
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
                    artist
                    album
                    track
                    contentType
                    content
                    comments
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
                    artist
                    album
                    track
                    contentType
                    content
                    comments
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
            // ARRANGE
            const requiredData = {
                title: faker.lorem.words(6),
                postType: 'artist',
                entityId: artist.id,
                contentType: 'text',
                content: faker.lorem.paragraph(),
            };

            // ACT
            // Create a post
            const res = await client.mutate({
                mutation: CREATE_POST,
                variables: requiredData,
            });
            const payload = res.data.createPost;
            // Retrieve updated current user and actual post
            currentUser = await findUserById(currentUser.id);
            createdPost = await findPostById(payload.post.id);
            artist = await findArtistById(artist.id);
            // Convert post to object.
            const postObj: PostObject = createdPost.toObject();

            // ASSERT
            const expectedPayload: CreatePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Post successfully created.',
                post: {
                    id: createdPost.id,
                    poster: currentUser.id,
                    title: requiredData.title,
                    likes: 0,
                    dislikes: 0,
                    likers: [],
                    dislikers: [],
                    postType: requiredData.postType,
                    artist: artist.id,
                    album: null,
                    track: null,
                    contentType: requiredData.contentType,
                    content: requiredData.content,
                    comments: [],
                    createdAt: postObj.createdAt,
                    updatedAt: postObj.updatedAt,
                },
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.posts.length).toEqual(1);
            expect(artist.posts.length).toEqual(1);
        });

        it("can get the current user's posts", async () => {
            // ARRANGE

            // ACT
            const res = await client.query({
                query: GET_CURRENT_USER_POSTS,
            });
            const payload = res.data.getCurrentUserPosts;
            const postObj = createdPost.toObject();

            // ASSERT
            const expectedPayload: [PostObject] = [postObj];
            expect(payload).toMatchObject(expectedPayload);
        });

        it("can get the user's posts from the public resolver getUserPosts", async () => {
            // ARRANGE

            // ACT
            const res = await client.query({
                query: GET_USER_POSTS,
                variables: {
                    userId: currentUser.id,
                },
            });
            const payload = res.data.getUserPosts;
            const postObj = createdPost.toObject();

            // ASSERT
            const expectedPayload: [PostObject] = [postObj];
            expect(payload).toMatchObject(expectedPayload);
        });

        it("can delete the current user's post", async () => {
            // ARRANGE
            const createdPostId = createdPost.id;

            // ACT
            // Delete the post.
            const res = await client.mutate({
                mutation: DELETE_POST,
                variables: {
                    postId: createdPostId,
                },
            });
            const payload = res.data.deletePost;
            // Retrieve updated currentUser and artist.
            currentUser = await findUserById(currentUser.id);
            artist = await findArtistById(artist.id);

            // ASSERT
            const expectedPayload: DeletePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Post successfully deleted.',
                deletedPostId: createdPostId,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.posts.length).toEqual(0);
            expect(artist.posts.length).toEqual(0);
        });

        it("cannot delete a post that doesn't belong to the current user", async () => {
            // ARRANGE
            // Create new user
            let newUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            // Create new post with that new user
            let [newPost] = await createPost(
                newUser.id,
                faker.lorem.words(6),
                'artist',
                artist.id,
                'text',
                faker.lorem.paragraphs(2),
            );

            // ACT
            // Try to delete that post as current user.
            const res = await client.mutate({
                mutation: DELETE_POST,
                variables: {
                    postId: newPost.id,
                },
            });
            // Retrieve updated user, post, and artist.
            newUser = await findUserById(newUser.id);
            newPost = await findPostById(newPost.id);
            artist = await findArtistById(artist.id);

            // ASSERT
            expect(res.data.deletePost).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Not authorized to delete post');
            expect(newUser.posts.length).toEqual(1);
            expect(newPost).not.toEqual(null);
            expect(artist.posts.length).toEqual(1);
        });
    });
});
