import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../src/database';
import { TrackDocument } from '../../src/database/models/TrackModel';
import { findTrackById, findTrackByTitle, findTrackBySpotifyId } from '../../src/database/dataAccess/Track';

describe('Track data access functions', () => {
    let connection: mongoose.Connection;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase(connection);
    });

    it("can find an Track by it's title", async () => {
        const title = 'a lot';

        const trackDoc: TrackDocument = await findTrackByTitle(title);

        expect(trackDoc.title).toEqual(title);
    });

    it('can find an Track by ObjectId', async () => {
        const title = 'a lot';

        let trackDoc: TrackDocument = await findTrackByTitle(title);
        const trackObjectId = trackDoc.id;
        trackDoc = await findTrackById(trackObjectId);

        expect(trackDoc.id).toEqual(trackObjectId);
        expect(trackDoc.title).toEqual(title);
    });

    it('can find an Track by Spotify ID', async () => {
        const spotifyId = '3WXJOVqIyZKSkdLa82PF0L';

        const trackDoc: TrackDocument = await findTrackBySpotifyId(spotifyId);

        expect(trackDoc.spotifyId).toEqual(spotifyId);
    });
});
