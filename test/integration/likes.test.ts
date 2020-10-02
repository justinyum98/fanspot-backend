import { ApolloServer, gql } from 'apollo-server-express';
import { ApolloServerTestClient, createTestClient } from 'apollo-server-testing';
import faker from 'faker';
import mongoose from 'mongoose';
import { closeDatabase, connectDatabase } from '../../src/database';
import { createComment } from '../../src/database/dataAccess/Comment';
import { createPost, findPostById } from '../../src/database/dataAccess/Post';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { AlbumDocument, AlbumModel } from '../../src/database/models/AlbumModel';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { CommentDocument, CommentModel } from '../../src/database/models/CommentModel';
import { PostDocument, PostModel } from '../../src/database/models/PostModel';
import { TrackDocument, TrackModel } from '../../src/database/models/TrackModel';
import { UserDocument, UserModel } from '../../src/database/models/UserModel';
import { createTestServer } from '../../src/graphql';
import { LikeOrDislikePostMutationResponse } from '../../src/graphql/types';
import { generateJWT } from '../../src/utils/jwt';

describe('Likes feature', () => {
    let connection: mongoose.Connection;
    let server: ApolloServer;
    let client: ApolloServerTestClient;
    let currentUser: UserDocument;
    let otherUser: UserDocument;
    let postDoc: PostDocument;
    let commentDoc: CommentDocument;
    let artistDoc: ArtistDocument;
    let albumDoc: AlbumDocument;
    let trackDoc: TrackDocument;

    beforeAll(async () => {
        connection = await connectDatabase();

        // Create the current user.
        currentUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());

        // Create the other user. This user will create the post and comment.
        otherUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());

        // Create the artist.
        artistDoc = new ArtistModel({ name: faker.internet.userName() });
        await artistDoc.save();

        // Create the album.
        albumDoc = new AlbumModel({ title: faker.lorem.words(2), albumType: 'album', releaseDate: new Date() });
        await albumDoc.save();

        // Create the track.
        trackDoc = new TrackModel({
            title: faker.lorem.word(),
            explicit: false,
            trackNumber: 1,
            duration: 1000,
            album: albumDoc.id,
        });
        await trackDoc.save();

        // Create the post.
        const [newPost, user, entity] = await createPost(
            otherUser.id,
            faker.lorem.sentence(),
            'artist',
            artistDoc.id,
            'text',
            faker.lorem.paragraph(),
        );
        postDoc = newPost;
        otherUser = user;
        artistDoc = entity as ArtistDocument;

        // Comment on the post.
        const [newComment, post, commenter] = await createComment(postDoc.id, otherUser.id, faker.lorem.sentence());
        commentDoc = newComment;
        postDoc = post;
        otherUser = commenter;

        // Set up server and test client.
        const token = generateJWT(currentUser.id, currentUser.username);
        server = createTestServer({ token });
        client = createTestClient(server);
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await ArtistModel.findByIdAndDelete(artistDoc.id).exec();
        await AlbumModel.findByIdAndDelete(albumDoc.id).exec();
        await TrackModel.findByIdAndDelete(trackDoc.id).exec();
        await PostModel.deleteMany({}).exec();
        await CommentModel.deleteMany({}).exec();
        await closeDatabase(connection);
    });

    describe('Posts', () => {
        const LIKE_OR_DISLIKE_POST = gql`
            mutation LikeOrDislikePost($postId: ID!, $action: LikeAction!) {
                likeOrDislikePost(postId: $postId, action: $action) {
                    code
                    success
                    message
                    postLikes
                    postDislikes
                }
            }
        `;

        const UNDO_LIKE_OR_DISLIKE_POST = gql`
            mutation UndoLikeOrDislikePost($postId: ID!, $action: LikeAction!) {
                undoLikeOrDislikePost(postId: $postId, action: $action) {
                    code
                    success
                    message
                    postLikes
                    postDislikes
                }
            }
        `;

        it('can like a post', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the post.',
                postLikes: 1,
                postDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.likedPosts.length).toEqual(1);
            expect(postDoc.likes).toEqual(1);
            expect(postDoc.likers.length).toEqual(1);
        });

        it('cannot like a post that the user already liked', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The post is already liked by this user.',
                postLikes: null,
                postDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.likedPosts.length).toEqual(1);
            expect(postDoc.likes).toEqual(1);
            expect(postDoc.likers.length).toEqual(1);
        });

        it('can undo liking a post', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unliked the post.',
                postLikes: 0,
                postDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.likedPosts.length).toEqual(0);
            expect(postDoc.likes).toEqual(0);
            expect(postDoc.likers.length).toEqual(0);
        });

        it('cannot undo liking a post that the user has not liked', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not liked the post.',
                postLikes: null,
                postDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.likedPosts.length).toEqual(0);
            expect(postDoc.likes).toEqual(0);
            expect(postDoc.likers.length).toEqual(0);
        });

        it('can dislike a post', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully disliked the post.',
                postLikes: 0,
                postDislikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(1);
            expect(postDoc.dislikes).toEqual(1);
            expect(postDoc.dislikers.length).toEqual(1);
        });

        it('cannot dislike a post that the user already disliked', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The post is already disliked by this user.',
                postLikes: null,
                postDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(1);
            expect(postDoc.dislikes).toEqual(1);
            expect(postDoc.dislikers.length).toEqual(1);
        });

        it('can undo disliking a post', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully undisliked the post.',
                postLikes: 0,
                postDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(0);
            expect(postDoc.dislikes).toEqual(0);
            expect(postDoc.dislikers.length).toEqual(0);
        });

        it('cannot undo disliking a post that the user has not disliked', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not disliked the post.',
                postLikes: null,
                postDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(0);
            expect(postDoc.dislikes).toEqual(0);
            expect(postDoc.dislikers.length).toEqual(0);
        });

        it('can like a post that the user has disliked', async () => {
            // ARRANGE
            // First, dislike the post as the user.
            const likePostRes = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: {
                    postId: postDoc.id,
                    action: 'dislike',
                },
            });
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            expect(likePostRes.data.likeOrDislikePost.success).toEqual(true);

            expect(currentUser.dislikedPosts.length).toEqual(1);
            expect(postDoc.dislikes).toEqual(1);
            expect(postDoc.dislikers.length).toEqual(1);

            expect(currentUser.likedPosts.length).toEqual(0);
            expect(postDoc.likes).toEqual(0);
            expect(postDoc.likers.length).toEqual(0);

            // ACT
            // Now, like the post that is disliked.
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: {
                    postId: postDoc.id,
                    action: 'like',
                },
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the post.',
                postLikes: 1,
                postDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(0);
            expect(postDoc.dislikes).toEqual(0);
            expect(postDoc.dislikers.length).toEqual(0);

            expect(currentUser.likedPosts.length).toEqual(1);
            expect(postDoc.likes).toEqual(1);
            expect(postDoc.likers.length).toEqual(1);
        });

        it('can dislike a post that the user has liked', async () => {
            // ARRANGE
            const requiredData = {
                postId: postDoc.id,
                action: 'dislike',
            };

            // ACT
            // Now, like the post that is disliked.
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_POST,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikePost;
            currentUser = await findUserById(currentUser.id);
            postDoc = await findPostById(postDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikePostMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully disliked the post.',
                postLikes: 0,
                postDislikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);

            expect(currentUser.dislikedPosts.length).toEqual(1);
            expect(postDoc.dislikes).toEqual(1);
            expect(postDoc.dislikers.length).toEqual(1);

            expect(currentUser.likedPosts.length).toEqual(0);
            expect(postDoc.likes).toEqual(0);
            expect(postDoc.likers.length).toEqual(0);
        });
    });
});
