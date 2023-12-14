// @ts-check
import React from "react";

/**
 * @typedef {Object} UserInfoContextType
 * @property {string} username
 * @property {string} avatar
 * @property {string} userId
 * @property {React.Dispatch<React.SetStateAction<string>>} setUsername
 * @property {React.Dispatch<React.SetStateAction<string>>} setAvatar
 * @property {React.Dispatch<React.SetStateAction<string>>} setUserId
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

