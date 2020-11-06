import mongoose from 'mongoose';
import faker from 'faker';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument } from '../../src/database/models/UserModel';
import { PostModel, PostDocument } from '../../src/database/models/PostModel';
import { CommentModel, CommentDocument } from '../../src/database/models/CommentModel';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { createPost, findPostById } from '../../src/database/dataAccess/Post';
import { createComment, findCommentById, deleteComment } from '../../src/database/dataAccess/Comment';

describe('Comment data access methods', () => {
    let connection: mongoose.Connection;
    let firstUser: UserDocument;
    let secondUser: UserDocument;
    let artist: ArtistDocument;
    let postDoc: PostDocument;
    let parentComment: CommentDocument;
    let replyComment: CommentDocument;

    beforeAll(async () => {
        connection = await connectDatabase();
        firstUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
        secondUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
        artist = new ArtistModel({
            name: 'YOONii',
        });
        await artist.save();
        const [newPost, user, entity] = await createPost(
            firstUser.id,
            faker.lorem.sentence(),
            'artist',
            artist.id,
            'text',
            faker.lorem.paragraph(),
        );
        postDoc = newPost;
        firstUser = user;
        artist = entity as ArtistDocument;
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await ArtistModel.findByIdAndDelete(artist.id).exec();
        await PostModel.deleteMany({}).exec();
        await CommentModel.deleteMany({}).exec();
        await closeDatabase(connection);
    });

    it("can add a user's comment to a post", async () => {
        // ARRANGE
        const requiredCommentData = {
            postId: postDoc.id,
            commenterId: secondUser.id,
            content: faker.lorem.sentence(),
        };

        // ACT
        const [newComment, post, commenter] = await createComment(
            requiredCommentData.postId,
            requiredCommentData.commenterId,
            requiredCommentData.content,
        );
        parentComment = newComment;
        postDoc = post;
        secondUser = commenter;

        // ASSERT
        expect(parentComment.post.toString()).toEqual(postDoc.id);
        expect(parentComment.poster.toString()).toEqual(secondUser.id);
        expect(parentComment.content).toEqual(requiredCommentData.content);
        expect(parentComment.likes).toEqual(0);
        expect(parentComment.dislikes).toEqual(0);
        expect(parentComment.likers.length).toEqual(0);
        expect(parentComment.dislikers.length).toEqual(0);
        expect(parentComment.parent).toBeNull();
        expect(parentComment.children.length).toEqual(0);
        expect(parentComment.isDeleted).toEqual(false);

        expect(postDoc.comments.length).toEqual(1);
        expect(postDoc.comments[0].toString()).toEqual(parentComment.id);

        expect(secondUser.comments.length).toEqual(1);
        expect(secondUser.comments[0].toString()).toEqual(parentComment.id);
    });

    it('can find a comment by id', async () => {
        // ARRANGE

        // ACT
        const foundComment = await findCommentById(parentComment.id);

        // ASSERT
        expect(foundComment).toBeDefined();
        expect(foundComment.toObject()).toEqual(parentComment.toObject());
    });

    it('can reply to another comment', async () => {
        // ARRANGE
        const requiredCommentData = {
            postId: postDoc.id,
            commenterId: firstUser.id,
            content: faker.lorem.sentence(),
            parent: parentComment.id,
        };

        // ACT
        const [newComment, post, commenter] = await createComment(
            requiredCommentData.postId,
            requiredCommentData.commenterId,
            requiredCommentData.content,
            requiredCommentData.parent,
        );
        parentComment = await findCommentById(parentComment.id);
        replyComment = newComment;
        postDoc = post;
        firstUser = commenter;

        // ASSERT
        expect(replyComment.parent.toString()).toEqual(parentComment.id);
        expect(parentComment.children.length).toEqual(1);
        expect(parentComment.children[0].toString()).toEqual(replyComment.id);
        expect(post.comments.length).toEqual(2);
        expect(firstUser.comments.length).toEqual(1);
    });

    it('can delete comments', async () => {
        // ARRANGE

        // ACT
        const deletedComment = await deleteComment(parentComment.id, secondUser.id);
        postDoc = await findPostById(postDoc.id);
        firstUser = await findUserById(firstUser.id);
        replyComment = await findCommentById(replyComment.id);

        // ASSERT
        expect(deletedComment.isDeleted).toEqual(true);

        expect(postDoc.comments.length).toEqual(2);

        expect(firstUser.comments.length).toEqual(1);

        expect(replyComment.parent.toString()).toEqual(deletedComment.id);
    });
});
