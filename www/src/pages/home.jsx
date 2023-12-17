import React from "react";
import { toast } from "react-hot-toast";

import useRoomInfo from "@/hooks/useRoomInfo";
import useUserInfo from "@/hooks/useUserInfo";
import useSocketConnection from "@/hooks/useSocketConnection";
import useRoomId from "@/hooks/useRoomId";
import { socket } from "@/lib/socket";

import { MAX_USERNAME_LENGTH } from "@server/consts";

export default function HomePage() {
	const { setIsConnected } = useSocketConnection();
	const { setUsername, username, avatar, setAvatar } = useUserInfo();
	const { roomId, setRoomId } = useRoomId();
	const { setRoomInfo } = useRoomInfo();
	const [isLoading, setIsLoading] = React.useState(false);

	/**
	 * @type {React.MutableRefObject<(_param: string) => void>}
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
		socket.emit("join_room", roomId, (status, data, message) => {
			if (status === 500) {
				rejectPromise.current?.(message);
				return;
			}

			setRoomInfo(data);
			setRoomId(data.room_id);

			resolvePromise.current?.(message);
		});
		socket.off("connect_error", handleConnectError);
	}

	function handleConnectOnRoomCreation() {
		socket.emit("create_room", (status, data, message) => {
			if (status === 500) {
				rejectPromise.current?.(message);
				return;
			}

			console.log("Successfully connected to server. Creating room.");

			setRoomInfo(data);
			setRoomId(data.room_id);

			resolvePromise.current?.(message);
		});
		socket.off("connect_error", handleConnectError);
	}

	function handlePlay() {
		if (isLoading) {
			return;
		}

		if (!username) {
			toast.error("Username is required");
			return;
		}

		if (username.length > MAX_USERNAME_LENGTH) {
			toast.error(
				`Username cannot be longer than ${MAX_USERNAME_LENGTH} characters`,
			);
			return;
		}

		setIsLoading(true);
		const toastId = toast.loading("Connecting to server...");

		// We use a promise because we need to turn off either of the listeners when either is fired.
		new Promise((resolve, reject) => {
			resolvePromise.current = resolve;
			rejectPromise.current = reject;

			socket.once("connect", handleConnectOnPlay);
			socket.once("connect_error", handleConnectError);

			socket.auth = { username, avatar };
			socket.connect();
		})
			.then((message) => {
				toast.success(message);
				setIsConnected(true);
			})
			.catch((err) => {
				toast.error(err instanceof Error ? err.message : err);
				socket.disconnect();
			})
			.finally(() => {
				resolvePromise.current = undefined;
				rejectPromise.current = undefined;
				toast.dismiss(toastId);
				setIsLoading(false);
			});
	}

	function handleCreateRoom() {
		if (isLoading) {
			return;
		}

		if (!username) {
			toast.error("Username is required");
			return;
		}

		if (username.length > MAX_USERNAME_LENGTH) {
			toast.error(
				`Username cannot be longer than ${MAX_USERNAME_LENGTH} characters`,
			);
			return;
		}

		setIsLoading(true);

		const toastId = toast.loading("Connecting to server...");

		new Promise((resolve, reject) => {
			resolvePromise.current = resolve;
			rejectPromise.current = reject;

			socket.once("connect", handleConnectOnRoomCreation);
			socket.once("connect_error", handleConnectError);

			socket.auth = { username, avatar };
			socket.connect();
		})
			.then((message) => {
				toast.success(message);
				setIsConnected(true);
			})
			.catch((err) => {
				toast.error(err instanceof Error ? err.message : err);
				socket.disconnect();
			})
			.finally(() => {
				resolvePromise.current = undefined;
				rejectPromise.current = undefined;
				toast.dismiss(toastId);
				setIsLoading(false);
			});
	}

	return (
		<React.Fragment>
			<div className="card">
				<div className="card-body">
					<div className="form-group" style={{ width: "100%" }}>
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
					<div style={{ width: "100%" }}>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handlePlay}
							disabled={isLoading}
							style={{ width: "100%", marginBottom: "0.5rem" }}
						>
							Play
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={handleCreateRoom}
							disabled={isLoading}
							style={{ width: "100%" }}
						>
							Create Private Room
						</button>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}
