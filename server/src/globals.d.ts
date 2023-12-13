interface CustomProperties {
	user_id: string;
	username: string;
	avatar: string;
}

declare module "socket.io" {
	interface Socket extends CustomProperties {}
}

export {};
