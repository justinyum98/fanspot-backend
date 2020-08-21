import { TrackModel, TrackDocument } from '../models/TrackModel';

/**
 * Retrieves a Track by ObjectId.
 *
 * @export
 * @param {TrackDocument['_id']} id - the Track's id
 * @returns {Promise<TrackDocument>}
 */
export async function findTrackById(id: TrackDocument['_id']): Promise<TrackDocument> {
    let track: TrackDocument;
    try {
        track = await TrackModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return track;
}

/**
 * Retrieves a Track by it's title.
 *
 * @export
 * @param {TrackDocument['title']} title - the Track's title
 * @returns {Promise<TrackDocument>}
 */
export async function findTrackByTitle(title: TrackDocument['title']): Promise<TrackDocument> {
    let track: TrackDocument;
    try {
        track = await TrackModel.findOne({ title }).exec();
    } catch (error) {
        throw error;
    }
    return track;
}

/**
 * Retrieves a Track by it's Spotify ID.
 *
 * @export
 * @param {TrackDocument['spotifyId']} spotifyId - the Track's Spotify ID
 * @returns {Promise<TrackDocument>}
 */
export async function findTrackBySpotifyId(spotifyId: TrackDocument['spotifyId']): Promise<TrackDocument> {
    let track: TrackDocument;
    try {
        track = await TrackModel.findOne({ spotifyId }).exec();
    } catch (error) {
        throw error;
    }
    return track;
}
