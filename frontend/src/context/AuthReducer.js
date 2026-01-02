// src/context/AuthReducer.js - UPDATED
const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null,
                token: null,
                isFetching: true,
                error: false
            };
        case "LOGIN_SUCCESS":
            return {
                user: action.payload.user,
                token: action.payload.token,
                isFetching: false,
                error: false
            };
        case "LOGIN_FAILURE":
            return {
                user: null,
                token: null,
                isFetching: false,
                error: action.payload
            };
        case "LOGOUT":
            return {
                user: null,
                token: null,
                isFetching: false,
                error: false
            };
        case "UPDATE_USER":
            return {
                ...state,
                user: action.payload
            };
        case "SET_TOKEN":
            return {
                ...state,
                token: action.payload
            };
        default:
            return state;
    }
}

export default AuthReducer;