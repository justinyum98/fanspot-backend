import { ArtistModel, ArtistDocument } from '../models/ArtistModel';

/**
 * Retrieves an Artist by ObjectId.
 *
 * @export
 * @param {ArtistDocument['_id']} id - ObjectId of the Artist
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistById(id: ArtistDocument['_id']): Promise<ArtistDocument> {
    let artist: ArtistDocument;
    try {
        artist = await ArtistModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return artist;
}

/**
 * Retrieves Artist by his/her name.
 *
 * @export
 * @param {ArtistDocument['name']} name
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistByName(name: ArtistDocument['name']): Promise<ArtistDocument> {
    let artist: ArtistDocument;
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
 * @param {ArtistDocument['spotifyId']} spotifyId - Spotify ID of the Artist
 * @returns {Promise<ArtistDocument>}
 */
export async function findArtistBySpotifyId(spotifyId: ArtistDocument['spotifyId']): Promise<ArtistDocument> {
    let artist: ArtistDocument;
    try {
        artist = await ArtistModel.findOne({ spotifyId }).exec();
    } catch (error) {
        throw error;
    }
    return artist;
}
