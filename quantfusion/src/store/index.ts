import { configureStore } from '@reduxjs/toolkit';
import tickerReducer from './tickerSlice';
import modelReducer from './modelSlice';
import portfolioReducer from './portfolioSlice';

export const store = configureStore({
    reducer: {
        ticker: tickerReducer,
        models: modelReducer,
        portfolio: portfolioReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
