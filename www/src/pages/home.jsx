import React from "react";
import useUserInfo from "../hooks/useUserInfo";
import useSocketConnection from "../hooks/useSocketConnection";
import { socket } from "../lib/socket";
import { toast } from "react-hot-toast";

export default function HomePage() {
	const { setIsConnected } = useSocketConnection();
	const { setUsername, username, avatar, setAvatar } = useUserInfo();
	
	const handlePlay = React.useCallback(
		() => {
			if (!username) {
				toast.error("Username is required");
				return;
			}

			socket.auth = { username, avatar };
			socket.connect();
			setIsConnected(true);
		},
		[username, avatar, setIsConnected]
	);

	const handleCreateRoom = React.useCallback(
		() => {
			if (!username) {
				toast.error("Username is required");
				return;
			}

			socket.auth = { username, avatar };
			socket.connect();
			setIsConnected(true);
		},
		[username, avatar, setIsConnected]
	);

	return (
		<React.Fragment>
			<div className="card">
				<div className="card-body">
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							type="text"
							className="form-control"
							id="username"
							placeholder="Enter username"
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
							}}
						/>
					</div>
					<button
						type="button"
						className="btn btn-primary"
						onClick={handlePlay}
					>
						Play
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={handleCreateRoom}
					>
						Create Private Room
					</button>
				</div>
			</div>
		</React.Fragment>
	);
}

