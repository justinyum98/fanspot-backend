import mongoose from 'mongoose';
import faker from 'faker';
import { connectDatabase, closeDatabase } from '../../src/database';
import { ApolloServer, gql } from 'apollo-server-express';
import { ApolloServerTestClient, createTestClient } from 'apollo-server-testing';
import { UserDocument, UserModel } from '../../src/database/models/UserModel';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { generateJWT } from '../../src/utils/jwt';
import { createTestServer } from '../../src/graphql';
import { PostDocument, PostModel } from '../../src/database/models/PostModel';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { createPost, findPostById } from '../../src/database/dataAccess/Post';
import { CommentDocument, CommentModel } from '../../src/database/models/CommentModel';
import { findCommentById, createComment } from '../../src/database/dataAccess/Comment';
import { AddCommentMutationResponse } from '../../src/graphql/types';

describe('Comment feature', () => {
    let connection: mongoose.Connection;
    let server: ApolloServer;
    let client: ApolloServerTestClient;
    let currentUser: UserDocument;
    let otherUser: UserDocument;
    let artistDoc: ArtistDocument;
    let postDoc: PostDocument;
    let parentComment: CommentDocument;
    let firstChildComment: CommentDocument;
    let secondChildComment: CommentDocument;

    beforeAll(async () => {
        connection = await connectDatabase();
        // Create the current user.
        currentUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());

        // Create the other user.
        otherUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());

        // Create the artist.
        artistDoc = new ArtistModel({
            name: 'YOONii',
        });
        await artistDoc.save();

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

        // Set up server and client.
        const token = generateJWT(currentUser.id, currentUser.username);
        server = createTestServer({ token });
        client = createTestClient(server);
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await PostModel.deleteMany({}).exec();
        await ArtistModel.findByIdAndDelete(artistDoc.id).exec();
        await CommentModel.deleteMany({}).exec();
        await closeDatabase(connection);
    });

    const ADD_COMMENT = gql`
        mutation AddComment($postId: ID!, $content: String!, $parentId: ID) {
            addComment(postId: $postId, content: $content, parentId: $parentId) {
                code
                success
                message
                comment {
                    id
                    post
                    poster
                    content
                    likes
                    dislikes
                    likers
                    dislikers
                    parent
                    children
                    isDeleted
                    createdAt
                    updatedAt
                }
            }
        }
    `;

    it('can add a comment as a user', async () => {
        // ARRANGE
        const requiredCommentData = {
            postId: postDoc.id,
            content: faker.lorem.sentence(),
        };

        // ACT
        // Add the comment with the currentUser.
        const res = await client.mutate({
            mutation: ADD_COMMENT,
            variables: requiredCommentData,
        });
        const payload = res.data.addComment;
        parentComment = await findCommentById(payload.comment.id);
        // Update the current user and post.
        currentUser = await findUserById(currentUser.id);
        postDoc = await findPostById(postDoc.id);

        // ASSERT
        const expectedPayload: AddCommentMutationResponse = {
            code: '201',
            success: true,
            message: 'Successfully created comment.',
            comment: {
                id: parentComment.id,
                post: requiredCommentData.postId,
                poster: currentUser.id,
                content: requiredCommentData.content,
                likes: 0,
                dislikes: 0,
                parent: null,
                children: [],
                isDeleted: false,
                createdAt: parentComment.createdAt,
                updatedAt: parentComment.updatedAt,
            },
        };
        expect(payload).toMatchObject(expectedPayload);

        expect(currentUser.comments.length).toEqual(1);
        expect(postDoc.comments.length).toEqual(1);
    });

    it('can reply to a comment', async () => {
        // ARRANGE
        // secondChildComment -replies-> firstChildComment -replies-> parentComment
        // The other user will reply to the parent comment.
        const [newComment, post, commenter] = await createComment(
            postDoc.id,
            otherUser.id,
            faker.lorem.sentence(),
            parentComment.id,
        );
        firstChildComment = newComment;
        postDoc = post;
        otherUser = commenter;
        // Set up required data to create comment.
        const requiredCommentData = {
            postId: postDoc.id,
            content: faker.lorem.sentence(),
            parentId: firstChildComment.id,
        };

        // ACT
        const res = await client.mutate({
            mutation: ADD_COMMENT,
            variables: requiredCommentData,
        });
        const payload = res.data.addComment;
        secondChildComment = await findCommentById(payload.comment.id);
        // Update the current user, comments and post
        currentUser = await findUserById(currentUser.id);
        postDoc = await findPostById(postDoc.id);
        parentComment = await findCommentById(parentComment.id);
        firstChildComment = await findCommentById(firstChildComment.id);

        // ASSERT
        const expectedPayload: AddCommentMutationResponse = {
            code: '201',
            success: true,
            message: 'Successfully created comment.',
            comment: {
                id: secondChildComment.id,
                post: requiredCommentData.postId,
                poster: currentUser.id,
                content: requiredCommentData.content,
                likes: 0,
                dislikes: 0,
                likers: [],
                dislikers: [],
                parent: requiredCommentData.parentId,
                children: [],
                isDeleted: false,
                createdAt: secondChildComment.createdAt,
                updatedAt: secondChildComment.updatedAt,
            },
        };
        expect(payload).toMatchObject(expectedPayload);

        expect(postDoc.comments.length).toEqual(3);

        expect(parentComment.children.length).toEqual(1);
        expect(firstChildComment.parent.toString()).toEqual(parentComment.id);
        expect(firstChildComment.children.length).toEqual(1);
        expect(secondChildComment.parent.toString()).toEqual(firstChildComment.id);
        expect(secondChildComment.children.length).toEqual(0);

        expect(currentUser.comments.length).toEqual(2);
        expect(otherUser.comments.length).toEqual(1);
    });

    const DELETE_COMMENT = gql`
        mutation DeleteComment($commentId: ID!) {
            deleteComment(commentId: $commentId) {
                code
                success
                message
                deletedCommentId
            }
        }
    `;

    it('can delete a comment', async () => {
        // ARRANGE
        const commentId = parentComment.id;

        // ACT
        const res = await client.mutate({
            mutation: DELETE_COMMENT,
            variables: {
                commentId,
            },
        });
        const payload = res.data.deleteComment;
        parentComment = await findCommentById(commentId);

        // ASSERT
        const expectedPayload = {
            code: '200',
            success: true,
            message: 'Successfully deleted comment.',
            deletedCommentId: commentId,
        };
        expect(payload).toMatchObject(expectedPayload);
        expect(parentComment).toBeDefined();
        expect(parentComment.isDeleted).toEqual(true);
    });

    const GET_POST_COMMENTS = gql`
        query GetPostComments($postId: ID!) {
            getPostComments(postId: $postId) {
                id
                poster {
                    id
                    username
                    profilePictureUrl
                }
                content
                likes
                dislikes
                parent
                children
                isDeleted
                createdAt
                updatedAt
            }
        }
    `;

    it("can get a post's comments", async () => {
        // ARRANGE
        const postId = postDoc.id;

        // ACT
        const res = await client.query({
            query: GET_POST_COMMENTS,
            variables: { postId },
        });
        const payload = res.data.getPostComments;

        // ASSERT
        expect(payload.length).toEqual(3);
    });
});
