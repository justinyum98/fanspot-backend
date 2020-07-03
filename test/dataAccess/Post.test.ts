import mongoose from 'mongoose';
import faker from 'faker';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserDocument } from '../../src/database/models/UserModel';
import { createUser } from '../../src/database/dataAccess/User';
import { PostDocument, PostObject } from '../../src/database/models/PostModel';
import { createPost, findPostById } from '../../src/database/dataAccess/Post';

describe('Post data access methods', () => {
    let connection: mongoose.Connection;
    let userDoc: UserDocument;
    let textPost: PostDocument;
    let mediaPost: PostDocument;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await closeDatabase(connection);
    });

    it('can create a new text Post', async () => {
        // Need to create a poster (User) first
        userDoc = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
        const requiredPostData = {
            poster: userDoc.id,
            title: faker.lorem.words(6),
            postType: 'ARTIST',
            contentType: 'TEXT',
            content: faker.lorem.paragraphs(2),
        };

        // Create text post
        textPost = await createPost(
            requiredPostData.poster,
            requiredPostData.title,
            requiredPostData.postType,
            requiredPostData.contentType,
            requiredPostData.content,
        );
        const postObject: PostObject = textPost.toObject();

        expect(postObject.id).toBeDefined();
        expect(postObject.poster).toEqual(requiredPostData.poster);
        expect(postObject.title).toEqual(requiredPostData.title);
        expect(postObject.likes).toEqual(0);
        expect(postObject.dislikes).toEqual(0);
        expect(postObject.likers).toEqual([]);
        expect(postObject.dislikers).toEqual([]);
        expect(postObject.postType).toEqual(requiredPostData.postType);
        expect(postObject.contentType).toEqual(requiredPostData.contentType);
        expect(postObject.content).toEqual(requiredPostData.content);
        expect(postObject.createdAt).toBeDefined();
        expect(postObject.updatedAt).toBeDefined();
    });

    it('can create a new media Post', async () => {
        const requiredPostData = {
            poster: userDoc.id,
            title: faker.lorem.words(6),
            postType: 'MEDIA',
            contentType: 'ARTIST',
            content: faker.image.imageUrl(),
        };

        // Create media post
        mediaPost = await createPost(
            requiredPostData.poster,
            requiredPostData.title,
            requiredPostData.postType,
            requiredPostData.contentType,
            requiredPostData.content,
        );
        const postObject: PostObject = mediaPost.toObject();

        expect(postObject.id).toBeDefined();
        expect(postObject.poster).toEqual(requiredPostData.poster);
        expect(postObject.title).toEqual(requiredPostData.title);
        expect(postObject.likes).toEqual(0);
        expect(postObject.dislikes).toEqual(0);
        expect(postObject.likers).toEqual([]);
        expect(postObject.dislikers).toEqual([]);
        expect(postObject.postType).toEqual(requiredPostData.postType);
        expect(postObject.contentType).toEqual(requiredPostData.contentType);
        expect(postObject.content).toEqual(requiredPostData.content);
        expect(postObject.createdAt).toBeDefined();
        expect(postObject.updatedAt).toBeDefined();
    });

    it('can find a post by id', async () => {
        const foundPost = await findPostById(textPost.id);
        const actualPost = foundPost.toObject();
        const expectedPost = textPost.toObject();

        expect(actualPost).toEqual(expectedPost);
    });
});
