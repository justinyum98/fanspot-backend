import { ApolloServer, gql } from 'apollo-server-express';
import { ApolloServerTestClient, createTestClient } from 'apollo-server-testing';
import faker from 'faker';
import mongoose from 'mongoose';
import { closeDatabase, connectDatabase } from '../../src/database';
import { findAlbumById } from '../../src/database/dataAccess/Album';
import { findArtistById } from '../../src/database/dataAccess/Artist';
import { createComment, findCommentById } from '../../src/database/dataAccess/Comment';
import { createPost, findPostById } from '../../src/database/dataAccess/Post';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { AlbumDocument, AlbumModel } from '../../src/database/models/AlbumModel';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { CommentDocument, CommentModel } from '../../src/database/models/CommentModel';
import { PostDocument, PostModel } from '../../src/database/models/PostModel';
import { TrackDocument, TrackModel } from '../../src/database/models/TrackModel';
import { UserDocument, UserModel } from '../../src/database/models/UserModel';
import { createTestServer } from '../../src/graphql';
import {
    LikeOrDislikePostMutationResponse,
    LikeOrDislikeCommentMutationResponse,
    LikeArtistMutationResponse,
    LikeAlbumMutationResponse,
} from '../../src/graphql/types';
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

    describe('Comments', () => {
        const LIKE_OR_DISLIKE_COMMENT = gql`
            mutation LikeOrDislikeComment($commentId: ID!, $action: LikeAction!) {
                likeOrDislikeComment(commentId: $commentId, action: $action) {
                    code
                    success
                    message
                    commentLikes
                    commentDislikes
                }
            }
        `;

        const UNDO_LIKE_OR_DISLIKE_COMMENT = gql`
            mutation UndoLikeOrDislikeComment($commentId: ID!, $action: LikeAction!) {
                undoLikeOrDislikeComment(commentId: $commentId, action: $action) {
                    code
                    success
                    message
                    commentLikes
                    commentDislikes
                }
            }
        `;

        it('can like a comment', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the comment.',
                commentLikes: 1,
                commentDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedComments.length).toEqual(1);
            expect(commentDoc.likes).toEqual(1);
            expect(commentDoc.likers.length).toEqual(1);
        });

        it('cannot like a comment that the user has already liked', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The comment is already liked by this user.',
                commentLikes: null,
                commentDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedComments.length).toEqual(1);
            expect(commentDoc.likes).toEqual(1);
            expect(commentDoc.likers.length).toEqual(1);
        });

        it('can undo liking a comment', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unliked the comment.',
                commentLikes: 0,
                commentDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedComments.length).toEqual(0);
            expect(commentDoc.likes).toEqual(0);
            expect(commentDoc.likers.length).toEqual(0);
        });

        it('cannot undo liking a comment that the user has not liked', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'like',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not liked the comment.',
                commentLikes: null,
                commentDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedComments.length).toEqual(0);
            expect(commentDoc.likes).toEqual(0);
            expect(commentDoc.likers.length).toEqual(0);
        });

        it('can dislike a comment', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully disliked the comment.',
                commentLikes: 0,
                commentDislikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(1);
            expect(commentDoc.dislikes).toEqual(1);
            expect(commentDoc.dislikers.length).toEqual(1);
        });

        it('cannot dislike a comment that the user already disliked', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The comment is already disliked by this user.',
                commentLikes: null,
                commentDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(1);
            expect(commentDoc.dislikes).toEqual(1);
            expect(commentDoc.dislikers.length).toEqual(1);
        });

        it('can undo disliking a comment', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully undisliked the comment.',
                commentLikes: 0,
                commentDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(0);
            expect(commentDoc.dislikes).toEqual(0);
            expect(commentDoc.dislikers.length).toEqual(0);
        });

        it('cannot undo disliking a comment that the user has not disliked', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'dislike',
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.undoLikeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not disliked the comment.',
                commentLikes: null,
                commentDislikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(0);
            expect(commentDoc.dislikes).toEqual(0);
            expect(commentDoc.dislikers.length).toEqual(0);
        });

        it('can like a comment that the user has disliked', async () => {
            // ARRANGE
            // First, dislike the post as the user.
            const likeCommentRes = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: {
                    commentId: commentDoc.id,
                    action: 'dislike',
                },
            });
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            expect(likeCommentRes.data.likeOrDislikeComment.success).toEqual(true);

            expect(currentUser.dislikedComments.length).toEqual(1);
            expect(commentDoc.dislikes).toEqual(1);
            expect(commentDoc.dislikers.length).toEqual(1);

            expect(currentUser.likedComments.length).toEqual(0);
            expect(commentDoc.likes).toEqual(0);
            expect(commentDoc.likers.length).toEqual(0);

            // ACT
            // Now, like the comment that is disliked.
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: {
                    commentId: commentDoc.id,
                    action: 'like',
                },
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the comment.',
                commentLikes: 1,
                commentDislikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(0);
            expect(commentDoc.dislikes).toEqual(0);
            expect(commentDoc.dislikers.length).toEqual(0);
            expect(currentUser.likedComments.length).toEqual(1);
            expect(commentDoc.likes).toEqual(1);
            expect(commentDoc.likers.length).toEqual(1);
        });

        it('can dislike a comment that the user has liked', async () => {
            // ARRANGE
            const requiredData = {
                commentId: commentDoc.id,
                action: 'dislike',
            };

            // ACT
            // Now, like the comment that is disliked.
            const res = await client.mutate({
                mutation: LIKE_OR_DISLIKE_COMMENT,
                variables: requiredData,
            });
            const payload = res.data.likeOrDislikeComment;
            currentUser = await findUserById(currentUser.id);
            commentDoc = await findCommentById(commentDoc.id);

            // ASSERT
            const expectedPayload: LikeOrDislikeCommentMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully disliked the comment.',
                commentLikes: 0,
                commentDislikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.dislikedComments.length).toEqual(1);
            expect(commentDoc.dislikes).toEqual(1);
            expect(commentDoc.dislikers.length).toEqual(1);
            expect(currentUser.likedComments.length).toEqual(0);
            expect(commentDoc.likes).toEqual(0);
            expect(commentDoc.likers.length).toEqual(0);
        });
    });

    describe('Artists', () => {
        const LIKE_ARTIST = gql`
            mutation LikeArtist($artistId: ID!) {
                likeArtist(artistId: $artistId) {
                    code
                    success
                    message
                    artistLikes
                }
            }
        `;

        const UNDO_LIKE_ARTIST = gql`
            mutation UndoLikeArtist($artistId: ID!) {
                undoLikeArtist(artistId: $artistId) {
                    code
                    success
                    message
                    artistLikes
                }
            }
        `;

        it('can like an artist', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.likeArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: LikeArtistMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the artist.',
                artistLikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedArtists.length).toEqual(1);
            expect(artistDoc.likes).toEqual(1);
            expect(artistDoc.likers.length).toEqual(1);
        });

        it('cannot like an artist that the user has already liked', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.likeArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: LikeArtistMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The artist is already liked by this user.',
                artistLikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedArtists.length).toEqual(1);
            expect(artistDoc.likes).toEqual(1);
            expect(artistDoc.likers.length).toEqual(1);
        });

        it('can undo liking an artist', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: LikeArtistMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unliked the artist.',
                artistLikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedArtists.length).toEqual(0);
            expect(artistDoc.likes).toEqual(0);
            expect(artistDoc.likers.length).toEqual(0);
        });

        it('cannot undo liking an artist that the user has not liked', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.undoLikeArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: LikeArtistMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not liked the artist.',
                artistLikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedArtists.length).toEqual(0);
            expect(artistDoc.likes).toEqual(0);
            expect(artistDoc.likers.length).toEqual(0);
        });
    });

    describe('Albums', () => {
        const LIKE_ALBUM = gql`
            mutation LikeAlbum($albumId: ID!) {
                likeAlbum(albumId: $albumId) {
                    code
                    success
                    message
                    albumLikes
                }
            }
        `;

        const UNDO_LIKE_ALBUM = gql`
            mutation UndoLikeAlbum($albumId: ID!) {
                undoLikeAlbum(albumId: $albumId) {
                    code
                    success
                    message
                    albumLikes
                }
            }
        `;

        it('can like an album', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.likeAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: LikeAlbumMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully liked the album.',
                albumLikes: 1,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedAlbums.length).toEqual(1);
            expect(albumDoc.likes).toEqual(1);
            expect(albumDoc.likers.length).toEqual(1);
        });

        it('cannot like an album that the user has already liked', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: LIKE_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.likeAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: LikeAlbumMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The album is already liked by this user.',
                albumLikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedAlbums.length).toEqual(1);
            expect(albumDoc.likes).toEqual(1);
            expect(albumDoc.likers.length).toEqual(1);
        });

        it('can undo liking an album', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.undoLikeAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: LikeAlbumMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unliked the album.',
                albumLikes: 0,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedAlbums.length).toEqual(0);
            expect(albumDoc.likes).toEqual(0);
            expect(albumDoc.likers.length).toEqual(0);
        });

        it('cannot undo liking an album that the user has not liked', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNDO_LIKE_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.undoLikeAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: LikeAlbumMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: The user has not liked the album.',
                albumLikes: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.likedAlbums.length).toEqual(0);
            expect(albumDoc.likes).toEqual(0);
            expect(albumDoc.likers.length).toEqual(0);
        });
    });
});
