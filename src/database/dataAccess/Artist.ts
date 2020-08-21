import { ArtistModel, ArtistDocument } from '../models/ArtistModel';

/**
 * Retrieves an Artist by ObjectId.
 *
 * @export
 * @param {ArtistDocument['_id']} id - ObjectId of the Artist
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistById(id: ArtistDocument['_id']): Promise<ArtistDocument> {
    let artist;
    try {
        artist = await ArtistModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return artist;
}

/**
 * Retrieves an Artist by their name.
 *
 * @export
 * @param {string} name - Name of the Artist
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistByName(name: string): Promise<ArtistDocument> {
    let artist;
    try {
        artist = await ArtistModel.findOne({ name }).exec();
    } catch (error) {
        throw error;
    }
    return artist;
}

/**
 * Retrieves an Artist by Spotify ID.
 *
 * @export
 * @param {string} spotifyId
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistBySpotifyId(spotifyId: string): Promise<ArtistDocument> {
    let artist;
    try {
        artist = await ArtistModel.findOne({ spotifyId }).exec();
    } catch (error) {
        throw error;
    }
    return artist;
}
