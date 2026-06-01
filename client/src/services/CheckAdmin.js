export function checkAdmin() {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    return false;
  } else {
    return adminToken;
  }
}