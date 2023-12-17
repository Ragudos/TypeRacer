import React from "react";
import useRoomInfo from "@/hooks/useRoomInfo";
import useUserInfo from "@/hooks/useUserInfo";
import CopyBox from "@/components/ui/copy-box";
import { mapRoomTypeToUserFriendly } from "@server/consts";

const ChangeRoomType = React.lazy(() => import("./change-room-type"));
const ChangeMaxPlayers = React.lazy(() => import("./change-max-players"));

const WaitingScreen = React.memo(function () {
	const { roomInfo } = useRoomInfo();
	const userInfo = useUserInfo();

	const isUserHost = React.useMemo(() => {
		if (!roomInfo || !userInfo) {
			return false;
		}

		return roomInfo.host_id === userInfo.userId;
	}, [roomInfo, userInfo]);

	return (
		<div className="waiting-screen">
			<article className="waiting-screen__room-id">
				<h2>Invite your friends</h2>
				<CopyBox
					stringToCopy={
						window.location.origin + "/?roomId=" + roomInfo.room_id
					}
				/>
			</article>
			<article className="waiting-screen__room-info">
				<h3>Room Info</h3>
				<ul>
					<li>
						<b>Who can join?&nbsp;</b>
						{!isUserHost && (
							<span>
								{mapRoomTypeToUserFriendly[roomInfo.room_type]}
							</span>
						)}

						{isUserHost && (
							<React.Suspense
								fallback={
									<span>
										{
											mapRoomTypeToUserFriendly[
												roomInfo.room_type
											]
										}
									</span>
								}
							>
								<ChangeRoomType />
							</React.Suspense>
						)}
					</li>
					<li>
						<b>What is the room capacity?</b>&nbsp;
						{!isUserHost && (
							<span>{roomInfo.max_users} players</span>
						)}
						{isUserHost && (
							<React.Suspense
								fallback={<span>{roomInfo.max_users}</span>}
							>
								<ChangeMaxPlayers />
							</React.Suspense>
						)}
					</li>
				</ul>
			</article>
			<div>
				{}
			</div>
		</div>
	);
});

WaitingScreen.displayName = "WaitingScreen";

export default WaitingScreen;
