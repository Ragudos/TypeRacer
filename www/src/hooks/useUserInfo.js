import React from "react";
import { UserInfoContext } from "../contexts/user-info";

export default function useUserInfo() {
	return React.useContext(UserInfoContext);
}

