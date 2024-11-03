import type { User } from "../../models/userTypes";
import { Role, Action } from "../../models/userEnums";

const rolePermissions: Record<Role, Action[]> = {
	[Role.User]: [Action.read_own, Action.edit_own, Action.delete_own],
	[Role.Editor]: [
		Action.read,
		Action.write,
		Action.edit_own,
		Action.delete_own,
		Action.read_own,
	],
	[Role.Admin]: [
		Action.read,
		Action.write,
		Action.delete,
		Action.edit_own,
		Action.delete_own,
		Action.read_own,
	],
	[Role.SuperAdmin]: [
		Action.read,
		Action.write,
		Action.delete,
		Action.grant,
		Action.edit_own,
		Action.delete_own,
		Action.read_own,
	],
};

export function canPerformAction(
	user: User,
	action: Action,
	ownerId?: string | number
): boolean {
	if (rolePermissions[user.role]?.includes(action)) {
		return true;
	}
	// Allow if the user is performing an action on their own account
	if (action === Action.edit_own || Action.delete_own || Action.read_own) {
		return user.userId === ownerId;
	}

	console.warn(`Role ${user.role} not found in rolePermissions.`);
	return true;
}
