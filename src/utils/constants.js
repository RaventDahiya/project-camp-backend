export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TasksStatusEnum = {
  TODO: "todo",
  IN_PROCESS: "in_process",
  DONE: "done",
};

export const AvailableTasksStatus = Object.values(TasksStatusEnum);
