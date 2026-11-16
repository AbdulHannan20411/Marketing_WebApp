/**
 * Videos and downloads shown on the site. Change the IDs here to swap the video or the
 * playlist; the thumbnail, the player and the playlist link all follow.
 */
export const productVideo = {
  /** First video, played in the page: https://youtu.be/j5_7nJajhw8 */
  videoId: "j5_7nJajhw8",
  /** The player continues through this playlist after the first video. */
  playlistId: "PLa87TrVtxwlo",
} as const;

export const playlistUrl = `https://www.youtube.com/playlist?list=${productVideo.playlistId}`;

/** Served from public/downloads. `fileName` is what the visitor's browser saves it as. */
export const investorDeck = {
  href: "/downloads/investor-deck.pdf",
  fileName: "GrowBusinesss-Investor-Deck.pdf",
  sizeMb: 3.7,
} as const;
