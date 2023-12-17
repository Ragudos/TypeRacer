import React from "react";
import { socket } from "../lib/socket.js";

/**
 * @typedef {Object} SocketReqResParams
 * @property {(data: T, message: string) => void} successFn
 * @property {(err: unknown) => void} errorFn
 * @template T
 */

/**
 * @typedef {keyof import("../../../server/src/server.mjs").ClientToServerEventNameToCbMap} EventToEmit
 */

/**
 * Abstraction in using acknowledgement callbacks in socket.io.
 * How to use:
 * ```ts
 *
 * const { roomInfo, setRoomInfo } = useRoomInfo();
 *
 * const { EmitEvent } = useSocketReqRes({
 *		successFn: (data, message) => {
 *			toast.success(message);
 *			setRoomInfo((prevRoomInfo) => {
 *				if (!prevRoomInfo) {
 *					return undefined;
 *				}
 *
 *				return {
 *					...prevRoomInfo,
 *					players: prevRoomInfo.players.filter((player) => player.id != data),
 *				}
 *			});
 *		},
 *		errorFn: (err) => { toast.error(err); },
 * });
 *
 * function kickPlayer(userIdToKick) {
 *		 EmitEvent("kick-player", roomId, userIdToKick);
 * }
 *
 * ```ts
 *
 * @template T
 * @param {SocketReqResParams<T>} params
 */
export default function useSocketReqRes(params) {
	const [isLoading, setIsLoading] = React.useState(false);

	/**
	 * @template {EventToEmit} K
	 *
	 * @type {(eventToEmit: K, ...args: Parameters<import("../../../server/src/server.mjs").ClientToServerEventNameToCbMap[K]>) => void)}
	 */
	const EmitEvent = React.useCallback(
		(eventToEmit, ...args) => {
			setIsLoading(true);

			new Promise((resolve, reject) => {
				socket.emit(eventToEmit, ...args, (status, data, message) => {
					if (status != 200) {
						reject(message);
						return;
					}

					resolve(data, message);
				});
			})
				.then(params.successFn)
				.catch(params.errorFn)
				.finally(() => {
					setIsLoading(false);
				});
		},
		[params],
	);

	return {
		isLoading,
		EmitEvent,
	};
}
