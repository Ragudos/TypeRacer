import { Arrow, Content, Root, Trigger } from "@radix-ui/react-popover";
import { toast } from "react-hot-toast";
import React from "react";

import useRoomInfo from "@/hooks/useRoomInfo";
import useUserInfo from "@/hooks/useUserInfo";

import { mapRoomTypeToUserFriendly } from "@server/consts";
import "@/styles/change-room-type.css";
import { socket } from "@/lib/socket";

export default function ChangeRoomType() {
	const { roomInfo, setRoomInfo } = useRoomInfo();
	const userInfo = useUserInfo();
	const [isLoading, setIsLoading] = React.useState(false);
	const [isOpen, setIsOpen] = React.useState(false);

	/**
	 * @param {import("@server/enums.mjs").SocketRoomType} chosenType
	 */
	function selectType(chosenType) {
		if (!roomInfo || !userInfo) {
			return;
		}

		if (isLoading || chosenType === roomInfo.room_type) {
			return;
		}

		setIsLoading(true);
		const toastId = toast.loading("Changing room type...");

		new Promise((resolve, reject) => {
			socket.emit(
				"change_room_type",
				roomInfo.room_id,
				userInfo.userId,
				chosenType,
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
					room_type: chosenType,
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
		<Root
			open={isOpen}
			onOpenChange={(currentState) => {
				setIsOpen(currentState);
			}}
		>
			<Trigger
				className="btn-accent"
				aria-label="Change who can join the room"
			>
				{mapRoomTypeToUserFriendly[roomInfo.room_type]}
			</Trigger>
			<Content
				style={{ zIndex: "20" }}
				className="dialog__slideup"
				sideOffset={5}
			>
				<Arrow className="dialog-arrow" />
				<div className="change-room-type__body">
					{Object.entries(mapRoomTypeToUserFriendly).map(
						([key, value]) => (
							<button
								key={key}
								name="room-type"
								onClick={(e) => {
									selectType(e.currentTarget.value);
									setIsOpen(false);
								}}
								className="btn-accent change-room-type__btn"
								value={key}
								aria-busy={isLoading}
								aria-selected={roomInfo.room_type === key}
								disabled={roomInfo.room_type === key}
							>
								{value}
							</button>
						),
					)}
				</div>
			</Content>
		</Root>
	);
}
