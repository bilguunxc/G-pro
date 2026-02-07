import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useRouter } from "next/router";
import { NotificationProvider } from "../context/NotificationContext";
import NotificationContainer from "../components/NotificationContainer";
import { loginSuccess, logout } from "../store/authSlice";
import { setCartUser } from "../store/cartSlice";
import { persistor, store } from "../store/Redux";
import "../styles/index.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";

function AuthGate({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );
  const [checkingSession, setCheckingSession] =
    useState(true);

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  useEffect(() => {
    let ignore = false;

    if (isPublicRoute) {
      setCheckingSession(false);
      return () => {
        ignore = true;
      };
    }

    if (isAuthenticated) {
      setCheckingSession(false);
      return () => {
        ignore = true;
      };
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          dispatch(logout());

          const nextPath =
            typeof router.asPath === "string"
              ? router.asPath
              : "/";
          router.replace(
            `/login?next=${encodeURIComponent(
              nextPath
            )}`
          );
          return;
        }

        const data = await res.json();

        if (ignore) return;

        if (data?.user) {
          dispatch(loginSuccess({ user: data.user }));
          dispatch(setCartUser(data.user.id));
        }
      } catch {
        dispatch(logout());

        const nextPath =
          typeof router.asPath === "string"
            ? router.asPath
            : "/";
        router.replace(
          `/login?next=${encodeURIComponent(
            nextPath
          )}`
        );
      } finally {
        if (!ignore) setCheckingSession(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [dispatch, isAuthenticated, isPublicRoute, router]);

  if (isPublicRoute) return children;
  if (checkingSession) return null;
  if (!isAuthenticated) return null;
  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <NotificationProvider>
          <AuthGate>
            <Component {...pageProps} />
          </AuthGate>
          <NotificationContainer />
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
}
