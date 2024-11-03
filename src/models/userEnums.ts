export enum Role {
	User = "User",
	Editor = "Editor",
	Admin = "Admin",
	SuperAdmin = "SuperAdmin",
}

export enum Action {
	read = "read",
	write = "write",
	delete = "delete",
	grant = "grant",
	edit_own = "edit_own",
	delete_own = "delete_own",
	read_own = "read_own",
}
