export {
  isAccessTokenExpired,
};

function isAccessTokenExpired({ accessToken }: { accessToken: string }) {
  try {
    const token = JSON.parse(atob(accessToken.split('.')[1]));
    return token.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}
