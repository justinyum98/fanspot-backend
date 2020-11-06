import mongoose from 'mongoose';
import faker from 'faker';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument, UserObject } from '../../src/database/models/UserModel';
import { createUser } from '../../src/database/dataAccess/User';
import { PostModel, PostDocument, PostObject } from '../../src/database/models/PostModel';
import { createPost, findPostById, deletePostById } from '../../src/database/dataAccess/Post';
import { ArtistModel, ArtistDocument, ArtistObject } from '../../src/database/models/ArtistModel';

describe('Post data access methods', () => {
    let connection: mongoose.Connection;
    let userDoc: UserDocument;
    let artistDoc: ArtistDocument;
    let postDoc: PostDocument;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await UserModel.deleteMany({}).exec();
        await PostModel.deleteMany({}).exec();
        await ArtistModel.findByIdAndDelete(artistDoc.id).exec();
        await closeDatabase(connection);
    });

    it('can create a new Post for an Artist', async () => {
        // ARRANGE
        // Need to create a poster (User) first
        userDoc = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
        // Next, need to create the Artist.
        artistDoc = new ArtistModel({
            name: 'YOONii',
        });
        await artistDoc.save();

        // ACT
        // Now, create the text post.
        const requiredPostData = {
            poster: userDoc.id,
            title: faker.lorem.words(6),
            postType: 'artist',
            entityId: artistDoc.id,
            contentType: 'text',
            content: faker.lorem.paragraphs(2),
        };
        const [newPost, user, entity] = await createPost(
            requiredPostData.poster,
            requiredPostData.title,
            requiredPostData.postType,
            requiredPostData.entityId,
            requiredPostData.contentType,
            requiredPostData.content,
        );
        postDoc = newPost;
        userDoc = user;
        artistDoc = entity as ArtistDocument;
        const postObject: PostObject = postDoc.toObject();
        const userObject: UserObject = userDoc.toObject();
        const artistObject: ArtistObject = artistDoc.toObject();

        // ASSERT
        const expectedPost: PostObject = {
            id: postObject.id,
            poster: userObject.id,
            title: requiredPostData.title,
            likes: 0,
            dislikes: 0,
            likers: [],
            dislikers: [],
            postType: requiredPostData.postType,
            artist: requiredPostData.entityId,
            album: null,
            track: null,
            contentType: requiredPostData.contentType,
            content: requiredPostData.content,
            createdAt: postObject.createdAt,
            updatedAt: postObject.updatedAt,
        };
        expect(postObject).toMatchObject(expectedPost);
        expect(userObject.posts.length).toEqual(1);
        expect(userObject.posts[0]).toEqual(postObject.id);
        expect(artistObject.posts.length).toEqual(1);
        expect(artistObject.posts[0]).toEqual(postObject.id);
    });

    it('can find a post by id', async () => {
        const foundPost = await findPostById(postDoc.id);
        const actualPost = foundPost.toObject();
        const expectedPost = postDoc.toObject();

        expect(actualPost).toEqual(expectedPost);
    });

    it('can delete a post by id', async () => {
        // ARRANGE

        // ACT
        const [deletedPostId, poster, entity] = await deletePostById(postDoc.id);
        const foundPost = await findPostById(deletedPostId);
        userDoc = poster;
        artistDoc = entity;

        // ASSERT
        expect(foundPost).toBeNull();
        expect(userDoc.posts.length).toEqual(0);
        expect(artistDoc.posts.length).toEqual(0);
    });
});
