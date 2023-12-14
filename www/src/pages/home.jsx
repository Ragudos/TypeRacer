import React from "react";
import useUserInfo from "../hooks/useUserInfo";
import useSocketConnection from "../hooks/useSocketConnection";
import useRoomId from "../hooks/useRoomId";
import { socket } from "../lib/socket";
import { toast } from "react-hot-toast";

export default function HomePage() {
	const { setIsConnected } = useSocketConnection();
	const { setUsername, username, avatar, setAvatar } = useUserInfo();
	const roomId = useRoomId();
	const [transition, startTransition] = React.useTransition();
	
	/**
	 * @type {React.MutableRefObject<(_param: any) => void>}
	 */
	const resolvePromise = React.useRef();
	/**
	 * @type {React.MutableRefObject<(_error: unknown) => void>}
	 */
	const rejectPromise = React.useRef();

	function handleConnectError() {
		console.error("Failed connecting to server");
		socket.off("connect", handleConnectOnPlay);
		socket.off("connect", handleConnectOnRoomCreation);
		rejectPromise.current?.(new Error("Failed to connect to server"));
	}

	function handleConnectOnPlay() {
		console.log("Successfully connected to server. Joing room...");
		socket.emit("join_room", roomId);
		socket.off("connect_error", handleConnectError);
		resolvePromise.current?.();
	}

	function handleConnectOnRoomCreation() {
		console.log("Successfully connected to server. Creating room...");
		socket.emit("create_room");
		socket.off("connect_error", handleConnectError);
		resolvePromise.current?.();
	}

	function handlePlay() {
		if (!username) {
			toast.error("Username is required");
			return;
		}

		startTransition(() => {
			new Promise((resolve, reject) => {
				resolvePromise.current = resolve;
				rejectPromise.current = reject;

				socket.once("connect", handleConnectOnPlay);
				socket.once("connect_error", handleConnectError);

				socket.auth = { username, avatar };
				socket.connect();

				setUsername("");
			}).then(() => {
				setIsConnected(true);
			}).catch((err) => {
				toast.error(err instanceof Error ? err.message : err);
			}).finally(() => {
				resolvePromise.current = undefined;
				rejectPromise.current = undefined;
			});
		});
	}

	function handleCreateRoom() {
		if (!username) {
			toast.error("Username is required");
			return;
		}

		startTransition(() => {
			new Promise((resolve, reject) => {
				resolvePromise.current = resolve;
				rejectPromise.current = reject;

				socket.once("connect", handleConnectOnRoomCreation);
				socket.once("connect_error", handleConnectError);

				socket.auth = { username, avatar };
				socket.connect();

				setUsername("");
			}).then(() => {
				setIsConnected(true);
			}).catch((err) => {
				toast.error(err instanceof Error ? err.message : err);
			}).finally(() => {
				resolvePromise.current = undefined;
				rejectPromise.current = undefined;
			});
		});
	}

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
							disabled={transition}
						/>
					</div>
					<button
						type="button"
						className="btn btn-primary"
						onClick={handlePlay}
						disabled={transition}
					>
						Play
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={handleCreateRoom}
						disabled={transition}
					>
						Create Private Room
					</button>
				</div>
			</div>
		</React.Fragment>
	);
}

