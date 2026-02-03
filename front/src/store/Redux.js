import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import storage from "redux-persist/lib/storage";
import sessionStorage from "redux-persist/lib/storage/session";

import authReducer from "./authSlice";
import cartReducer from "./cartSlice";
import checkoutReducer from "./checkoutSlice";


const authPersistConfig = {
  key: "auth",
  storage: sessionStorage,
};


const rootPersistConfig = {
  key: "root",
  storage,
  blacklist: ["auth"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  cart: cartReducer,
  checkout: checkoutReducer,
});

const persistedReducer = persistReducer(
  rootPersistConfig,
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
