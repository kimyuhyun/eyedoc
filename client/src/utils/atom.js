import { atom } from "recoil";

export const paramsState = atom({
    key: "paramsState",
    default: {
        board_id: "",
        search_column: "",
        search_value: "",
        orderby: "idx DESC",
        page: 1,
    },
});

export const modalState = atom({
    key: "modalState",
    default: {},
});

export const replyArrayState = atom({
    key: "replyArrayState",
    default: [],
});

export const fileObjectState = atom({
    key: "fileObjectState",
    default: {
        filename0: "",
        filename1: "",
        filename2: "",
        filename3: "",
        filename4: "",
        filename5: "",
        filename6: "",
        filename7: "",
        filename8: "",
    },
});

export const replyParamsState = atom({
    key: "replyParamsState",
    default: {
        modal: false,
        page: 1,
        sort1: "time",
    },
});

export const toastState = atom({
    key: "toastState",
    default: {
        toast: false,
        message: "",
    },
});

export const loadingState = atom({
    key: "loadingState",
    default: false,
});
