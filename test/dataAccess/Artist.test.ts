import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../src/database';
import { ArtistDocument, ArtistObject } from '../../src/database/models/ArtistModel';
import { findArtistById, findArtistByName, findArtistBySpotifyId } from '../../src/database/dataAccess/Artist';

describe('Artist data access functions', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase(connection);
    });

    it('can find an Artist by his/her name', async () => {
        const artistName = '21 Savage';

        const artistDoc: ArtistDocument = await findArtistByName(artistName);
        const artistObj: ArtistObject = artistDoc.toObject();

        expect(artistObj.name).toEqual(artistName);
    });

    it('can find an Artist by ObjectId', async () => {
        const artistName = '21 Savage';

        let artistDoc: ArtistDocument = await findArtistByName(artistName);
        const artistObjectId = artistDoc.id;
        artistDoc = await findArtistById(artistObjectId);
        const artistObj: ArtistObject = artistDoc.toObject();

        expect(artistObj.id).toEqual(artistObjectId);
    });

    it('can find an Artist by Spotify ID', async () => {
        const artistSpotifyId = '1URnnhqYAYcrqrcwql10ft';

        const artistDoc: ArtistDocument = await findArtistBySpotifyId(artistSpotifyId);
        const artistObj: ArtistObject = artistDoc.toObject();

        expect(artistObj.spotifyId).toEqual(artistSpotifyId);
    });
});
