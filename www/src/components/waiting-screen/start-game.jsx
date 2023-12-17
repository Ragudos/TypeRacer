import useRoomId from "@/hooks/useRoomId";
import useRoomInfo from "@/hooks/useRoomInfo";
import useUserInfo from "@/hooks/useUserInfo";
import { socket } from "@/lib/socket";
import { SOCKET_ROOM_STATUS } from "@server/enums.mjs";
import { toast } from "react-hot-toast";

export default function StartGame() {
	const { roomInfo, setRoomInfo } = useRoomInfo();
	const { roomId } = useRoomId();
	const userInfo = useUserInfo();

	function startGame() {
		if (!userInfo || !roomId) {
			return;
		}
		
		if (roomInfo?.users.length < 2) {
			toast.error("You need at least 2 players to start the game.");
			return;
		}

		// We dont need to use a Promise because we are not 
		socket.emit("start_game", roomId, userInfo.userId, (status, _data, message) => {
			if (status != 200) {
				toast.error(message);
				console.error(message);
				return;
			}

			setRoomInfo((prevRoomInfo) => {
				if (!prevRoomInfo) {
					return undefined;
				}

				return {
					...prevRoomInfo,
					room_status: SOCKET_ROOM_STATUS.COUNTDOWN
				};
			});
		});
	}

	return (
		<button	
			type="button"
			className="btn-primary start-game__button"
			onClick={startGame}
			disabled={roomInfo?.users.length < 2}
		>
			{roomInfo?.users.length < 2 ? "Waiting for players..." : "Start Game"}
		</button>
	);
}

