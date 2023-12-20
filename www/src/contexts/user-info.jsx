// @ts-check
import React from "react";
import { socket } from "../lib/socket";

/**
 * @typedef {Object} UserInfoContextType
 * @property {string} username
 * @property {string} avatar
 * @property {string} userId
 * @property {React.Dispatch<React.SetStateAction<string>>} setUsername
 * @property {React.Dispatch<React.SetStateAction<string>>} setAvatar
 * @property {React.Dispatch<React.SetStateAction<string>>} setUserId must only be used when the user is disconnected and resetting the client state
 */

/**
 * @type {React.Context<UserInfoContextType>}
 */
export const UserInfoContext = React.createContext({
	username: "",
	avatar: "",
	userId: "",
	setUsername: (_username) => {},
	setAvatar: (_avatar) => {},
	setUserId: (_userId) => {},
});

/**
 * @param {{ children: React.ReactNode }} props
 */
export const UserInfoContextProvider = (props) => {
	const [username, setUsername] = React.useState("");
	const [avatar, setAvatar] = React.useState("");
	const [userId, setUserId] = React.useState("");

	/**
	 * @type {(userInfo: import("./room-info").UserInfo) => void}
	 */
	const receiveUserInfo = React.useCallback(
		(userInfo) => {
			setUsername(userInfo.username);
			setAvatar(userInfo.avatar);
			setUserId(userInfo.user_id);
		},
		[setUsername, setAvatar],
	);

	React.useEffect(() => {
		socket.on("send_user_info", receiveUserInfo);
		return () => {
			socket.off("send_user_info", receiveUserInfo);
		};
	}, [receiveUserInfo]);

	return (
		<UserInfoContext.Provider
			value={{
				username,
				setUsername,
				avatar,
				setAvatar,
				userId,
				setUserId,
			}}
		>
			{props.children}
		</UserInfoContext.Provider>
	);
};
