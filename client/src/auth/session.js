const STORAGE_KEY = "skillbridge_session";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return safeParse(window.localStorage.getItem(STORAGE_KEY) || "null");
};

export const getToken = () => getSession()?.token || "";

export const getStoredUser = () => getSession()?.user || null;

export const isAuthenticated = () => Boolean(getToken());

export const storeSession = ({ token, user }) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      user
    })
  );

  window.dispatchEvent(new Event("authChanged"));
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("authChanged"));
};

export const updateStoredUser = (user) => {
  const current = getSession();

  if (!current?.token) {
    return;
  }

  storeSession({
    token: current.token,
    user
  });
};
