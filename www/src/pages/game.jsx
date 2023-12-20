import useUserInfo from "@/hooks/useUserInfo";
import useRoomInfo from "@/hooks/useRoomInfo";
import "@/styles/game.css";
import Chat from "@/components/chat.jsx";
import MainScreen from "@/components/main-screen";

export default function GamePage() {
	const { roomInfo } = useRoomInfo();
	const userInfo = useUserInfo();

	if (!roomInfo) {
		return null;
	}

	return (
		<div className="container">
			<div className="game-grid">
				<MainScreen />
				<Chat />
				<ul>
					{roomInfo.users.map((user) => (
						<li key={user.user_id} className="player">
							{user.avatar && (
								<img
									src={user.avatar}
									alt={`${user.username}'s avatar`}
									className="icon"
									loading="eager"
								/>
							)}
							<span>
								{user.user_id === roomInfo.host_id && (
									<small>👑</small>
								)}
								{user.user_id === userInfo.userId && (
									<small style={{ wordBreak: "keep-all" }}>
										&#40;you&#41;
									</small>
								)}
								&nbsp;<b>{user.username}</b>
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
