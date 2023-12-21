import useRoomInfo from "@/hooks/useRoomInfo";
import useUserInfo from "@/hooks/useUserInfo";
import { socket } from "@/lib/socket";

export default function BackToLobbyButton() {
	const { roomInfo } = useRoomInfo();
	const { userId } = useUserInfo();

	function backToLobby() {
		socket.emit("back_to_lobby", roomInfo.room_id, userId);
	}

	return (
		<button
			type="button"
			className="btn-primary"
			aria-label="Back to lobby"
			onClick={backToLobby}
		>
			Back to lobby
		</button>
	);
}
