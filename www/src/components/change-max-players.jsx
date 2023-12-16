// Desc: Change the max players in the room

import React from "react";
import { toast } from "react-hot-toast";
import useRoomInfo from "../hooks/useRoomInfo";
import useUserInfo from "../hooks/useUserInfo";
import { socket } from "../lib/socket";
import { Root, Trigger, Content, Arrow } from "@radix-ui/react-popover";

import "../styles/change-max-players.css";

const arr = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ChangeMaxPlayers() {
	const { roomInfo, setRoomInfo } = useRoomInfo();
	const userInfo = useUserInfo();
	const [isLoading, setIsLoading] = React.useState(false);

	/**
	 * @param {number} maxPlayers
	 */
	function selectMaxPlayers(maxPlayers) {
		if (!roomInfo || !userInfo) {
			return;
		}

		if (isLoading || maxPlayers === roomInfo.max_players) {
			return;
		}

		setIsLoading(true);
		const toastId = toast.loading("Changing max players...");

		new Promise((resolve, reject) => {
			socket.emit(
				"change_max_players",
				roomInfo.room_id,
				userInfo.userId,
				maxPlayers,
				(status, _data, message) => {
					if (status != 200) {
						reject(message);
						return;
					}

					resolve(message);
				},
			);
		})
			.then((message) => {
				toast.success(message);
				setRoomInfo((prev) => ({
					...prev,
					max_users: maxPlayers,
				}));
			})
			.catch((err) => {
				console.error(err);
				toast.error(err);
			})
			.finally(() => {
				setIsLoading(false);
				toast.dismiss(toastId);
			});
	}

	return (
		<Root modal={true}>
			<Trigger
				className="btn-accent"
				aria-label="Change the maximum amount of players who can join the room"
			>
				{roomInfo.max_users} players
			</Trigger>
			<Content
				className="dialog__slideright"
				style={{ zIndex: "20" }}
				sideOffset={10}
				side="right"
			>
				<Arrow className="dialog-arrow" />
				<div className="change-max-players__body">
					{arr.map((maxPlayers) => (
						<button
							key={maxPlayers}
							className="btn-accent"
							onClick={() => selectMaxPlayers(maxPlayers)}
							aria-busy={isLoading}
							disabled={roomInfo.max_users === maxPlayers}
							aria-selected={roomInfo.max_users === maxPlayers}
						>
							{maxPlayers} players
						</button>
					))}
				</div>
			</Content>
		</Root>
	);
}
