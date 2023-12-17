/**
 * @type {{ [Property in import("../../../server/src/enums.mjs").SocketRoomType]: string }}
 */
export const mapRoomTypeToUserFriendly = {
	public: "Anyone can join",
	private: "Only people with the link",
	closed: "No one can join",
};

export const MAX_USERNAME_LENGTH = 20;
export const COUNTDOWN_COUNT = 10;
export const COUNTDOWN_SPEED = 1000;

