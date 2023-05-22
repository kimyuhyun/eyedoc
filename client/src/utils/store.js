import axios from "axios";

export const listor = async (url) => {
    if (!url) {
        return {};
    }
    const token = await tokenIssue();
    const { data } = await axios({
        url,
        method: "GET",
        headers: { token },
    });
    return data;
};

export const reader = async (params) => {
    if (!params || !params.idx || !params.table) {
        return {};
    }
    const token = await tokenIssue();
    const url = `/crud/read?idx=${params.idx}&table=${params.table}`;
    console.log(url);
    const { data } = await axios({
        url,
        method: "GET",
        headers: { token },
    });
    return data;
};

export const writer = async (obj) => {
    console.log("writer", obj);
    if (!obj || !obj.table) {
        return {};
    }
    const token = await tokenIssue();
    const url = `/crud/write`;
    console.log(url);
    const { data } = await axios({
        url,
        method: "POST",
        data: obj,
        headers: { token },
    });
    if (obj.idx) {
        return obj;
    } else {
        const result = {
            idx: eval(data.insertId),
            ...obj,
        };
        return result;
    }
};

export const uploader = async (formData) => {
    if (!formData) {
        return {};
    }

    if (
        formData.get("filename0") &&
        formData.get("filename1") &&
        formData.get("filename2") &&
        formData.get("filename3") &&
        formData.get("filename4") &&
        formData.get("filename5") &&
        formData.get("filename6") &&
        formData.get("filename7") &&
        formData.get("filename8") &&
        formData.get("filename9")
    ) {
        return {};
    }

    const token = await tokenIssue();

    const url = `https://eyedocapi.com/upload/local`;
    // const url = `/upload/local`;
    const { data } = await axios({
        url,
        method: "POST",
        data: formData,
        headers: { token },
    });
    return data;
};

export const tokenIssue = async () => {
    const url = `/token/issue`;
    const { data } = await axios({
        url,
        method: "POST",
    });
    return data.token;
};
