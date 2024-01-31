/**
 * @type {{ [Property in import("../../../server/src/enums.mjs").SocketRoomType]: string }}
 */
export const mapRoomTypeToUserFriendly = {
	public: "Anyone can join",
	private: "Only people with the link",
	closed: "No one can join",
};

export const MAX_USERNAME_LENGTH = 20;
export const COUNTDOWN_COUNT = 3;
export const COUNTDOWN_SPEED = 1000;
export const MAX_PLAYERS_IN_ROOM = 6;
export const RACE_TIMER_COUNT = 80;
