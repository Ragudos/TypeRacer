import { Root, Trigger, Content } from "@radix-ui/react-popover";
import React from "react";
import { socket } from "../lib/socket";
import useRoomId from "../hooks/useRoomId";
import useUserInfo from "../hooks/useUserInfo";
import useRoomInfo from "../hooks/useRoomInfo";

/**
 * @typedef {import("../../../server/src/adapters/in-memory.mjs").Chat} Chat
 */

const Chat = React.memo(function () {
	const [sendMessageError, setSendMessageError] = React.useState("");
	/** @type [Chat[], React.Dispatch<React.SetStateAction<Chat[]>>]  */
	const [chats, setChats] = React.useState([]);
	const [message, setMessage] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	const { roomId } = useRoomId();
	const userInfo = useUserInfo();
	const { roomInfo } = useRoomInfo();

	const canSendNewMessage = React.useRef(true);
	/**
	 * @type {NodeJS.Timeout}
	 */
	const timerToPreventSpam = React.useRef();

	/**
	 * @param {React.FormEvent<HTMLFormElement>} e
	 */
	function handleSubmit(e) {
		e.preventDefault();

		if (!roomId || !userInfo.userId) {
			return;
		}

		if (!message) {
			setSendMessageError("Message cannot be empty.");
			return;
		}

		setIsLoading(true);

		// We do this, so we can wait for the server to send our message to other clients.
		/**
		 * @type {Promise<Chat>}
		 */
		new Promise((resolve, reject) => {
			// Prevent spamming messages.
			if (!canSendNewMessage.current) {
				reject("You are sending messages too fast.");
				return;
			}

			canSendNewMessage.current = false;

			if (timerToPreventSpam.current) {
				clearTimeout(timerToPreventSpam.current);
			}

			timerToPreventSpam.current = setTimeout(() => {
				canSendNewMessage.current = true;
			}, 1000);

			socket.emit(
				"send_message",
				roomId,
				userInfo.userId,
				message,
				(status, data, error) => {
					if (status === 500) {
						reject(error);
						return;
					}

					resolve(data);
				},
			);
		})
			.then((data) => {
				setChats((prevChats) => [...prevChats, data]);
				setMessage("");
				setSendMessageError("");
			})
			.catch((err) => {
				setSendMessageError(err);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}

	/**
	 * @param {Chat} message
	 */
	const receiveUserMessage = React.useCallback((message) => {
		setChats((prevChats) => [...prevChats, message]);
	}, []);

	React.useEffect(() => {
		if (!roomId) {
			return;
		}

		socket.emit("request_chats_in_room", roomId, (status, chats) => {
			if (status === 500) {
				console.error(chats);
				return;
			}

			if (!chats) {
				return;
			}

			setChats(chats);
		});

		socket.on("user_sent_message", receiveUserMessage);
		return () => {
			socket.off("user_sent_message", receiveUserMessage);
		};
	}, [roomId, receiveUserMessage]);

	/**
	 * @param {HTMLElement} node
	 */
	const scrollToRef = React.useCallback((node) => {
		if (!node) {
			return;
		}

		node.scrollIntoView(false);
	}, []);

	return (
		<div className="chat-box">
			<div className="chat-content">
				{chats.length === 0 && <p>No messages yet.</p>}
				{chats.map((chat, idx) => {
					const didUserLeave =
						roomInfo?.users.findIndex(
							(user) => user.user_id === chat.user_id,
						) === -1;

					return (
						<p
							style={
								didUserLeave ? { opacity: "0.5" } : undefined
							}
							ref={
								idx === chats.length - 1
									? scrollToRef
									: undefined
							}
							key={chat.user_id + chat.created_at}
						>
							<b>{chat.username}:</b>&nbsp;
							<span>{chat.message}</span>
							{didUserLeave && (
								<small>&nbsp;&#40;left&#41;</small>
							)}
						</p>
					);
				})}
			</div>
			<form action=" " method="POST" onSubmit={handleSubmit}>
				<label htmlFor="message" className="sr-only">
					Message
				</label>
				<small id="chat-errormessage">{sendMessageError}</small>
				<input
					value={message}
					onChange={(e) => {
						setMessage(e.target.value);
						setSendMessageError("");
					}}
					type="text"
					title="Enter message"
					className="form-control"
					id="message"
					placeholder="Enter message"
					aria-errormessage="chat-errormessage"
				/>
				<button
					disabled={isLoading}
					type="submit"
					className="btn-primary btn-icon"
					aria-label="Send message"
					title="Send message"
				>
					<svg
						className="icon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
					</svg>
				</button>
			</form>
		</div>
	);
});

Chat.displayName = "Chat";

export default Chat;
