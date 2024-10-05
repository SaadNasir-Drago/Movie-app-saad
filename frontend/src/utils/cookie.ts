import Cookies from "js-cookie";

const USER_COOKIE = "user_data";

export const setUserCookie = (user: any) => {
  Cookies.set(USER_COOKIE, JSON.stringify(user), { expires: 7 });
};

export const getUserCookie = () => {
  const user = Cookies.get(USER_COOKIE);
  return user ? JSON.parse(user) : null;
};

export const removeUserCookie = () => {
  Cookies.remove(USER_COOKIE);
};
