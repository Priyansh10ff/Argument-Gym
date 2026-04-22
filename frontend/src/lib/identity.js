// Generates and persists an anonymous UUID for ELO tracking
export function getUserId() {
  let id = localStorage.getItem('arg_gym_uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('arg_gym_uid', id);
  }
  return id;
}

export function getUserName() {
  return localStorage.getItem('arg_gym_name') || '';
}

export function saveUserName(name) {
  localStorage.setItem('arg_gym_name', name);
}
