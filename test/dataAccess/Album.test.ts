import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../src/database';
import { AlbumDocument, AlbumObject } from '../../src/database/models/AlbumModel';
import { findAlbumById, findAlbumByTitle, findAlbumBySpotifyId } from '../../src/database/dataAccess/Album';

describe('Album data access functions', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase(connection);
    });

    it("can find an Album by it's title", async () => {
        const title = 'i am > i was';

        const albumDoc: AlbumDocument = await findAlbumByTitle(title);

        expect(albumDoc.title).toEqual(title);
    });

    it('can find an Album by ObjectId', async () => {
        const title = 'i am > i was';

        let albumDoc: AlbumDocument = await findAlbumByTitle(title);
        const albumObjectId = albumDoc.id;
        albumDoc = await findAlbumById(albumObjectId);

        expect(albumDoc.id).toEqual(albumObjectId);
        expect(albumDoc.title).toEqual(title);
    });

    it('can find an Album by Spotify ID', async () => {
        const spotifyId = '6guJZpZ52v4MrJKIH7tASl';

        const albumDoc: AlbumDocument = await findAlbumBySpotifyId(spotifyId);

        expect(albumDoc.spotifyId).toEqual(spotifyId);
    });
});
