import { useState, useEffect } from "react";
import axios from "axios";
import { fileObjectState } from "../utils/atom";
import { useRecoilState } from "recoil";

export default ({ index, filename }) => {
    const [fileObject, setFileObject] = useRecoilState(fileObjectState);

    const [className, setClassName] = useState("");
    const [image, setImage] = useState("/no-img2.png");
    const [isShow, setShowImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (filename) {
            setImage(filename);
        } else {
            setImage("/no-img2.png");
        }
    }, [filename]);

    const dragEnter = (i, e) => {
        // console.log(i, "드래그 요소가 들어왔을떄", e);
        setClassName("bg-dark");
    };

    const dragLeave = (i, e) => {
        // console.log(i, "드래그 요소가 나갔을때", e);
        setClassName("img-thumbnail");
    };
    const dragOver = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const drop = async (i, e) => {
        // console.log(i, "드래그한 항목을 떨어뜨렸을때", e);
        setShowImage(false);
        setClassName("");
        setIsUploading(true);
        e.preventDefault();

        var urlLink = "";
        try {
            const imageUrl = e.dataTransfer.getData("text/html");
            const rex = /src="?([^"\s]+)"?\s*/;
            const url = rex.exec(imageUrl);
            urlLink = url[1];
        } catch (e) {}

        if (urlLink) {
            const result = await axios({
                url: `/upload/get_base64`,
                method: "POST",
                data: { url_link: urlLink },
            });
            const data = result.data;
            setImage(data.base64);

            //base64 to file
            const arr = data.base64.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            var n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], data.filename, { type: mime });
            // console.log(file);
            setFileObject({
                ...fileObject,
                [`filename${index}`]: file,
            });
        } else {
            const files = [...e.dataTransfer.files];
            if (files[0]) {
                setFileObject({
                    ...fileObject,
                    [`filename${index}`]: files[0],
                });
                const reader = new FileReader();
                reader.readAsDataURL(files[0]);
                reader.onload = function () {
                    // console.log(reader.result);
                    setImage(reader.result);
                };
            }
        }
        setIsUploading(false);
    };

    const onFileRemove = () => {
        if (window.confirm("삭제 하시겠습니까?")) {
            setFileObject({
                ...fileObject,
                [`filename${index}`]: "del",
            });
            console.log(fileObject);

            setImage("/no-img2.png");
        }
    };

    return (
        <>
            <div
                className="me-3 mt-3 position-relative"
                style={{ width: "80px", height: "80px" }}
                onDragEnter={(e) => dragEnter(index, e)}
                onDragLeave={(e) => dragLeave(index, e)}
                onDragOver={(e) => dragOver(e)}
                onDrop={(e) => drop(index, e)}
            >
                <img src={image} style={{ objectFit: "cover" }} className={`img-thumbnail rounded w-100 h-100 ${className}`} onClick={() => setShowImage(true)} />
                {image != "/no-img2.png" && (
                    <img src={"/photo_x.png"} className="position-absolute" style={{ cursor: "pointer", top: "-10px", right: "-9px" }} width={25} height={25} onClick={onFileRemove} />
                )}

                {isUploading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}
            </div>
            {isShow && image != "/no-img2.png" && (
                <div 
                    className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" 
                    style={{ zIndex: "999" }}>
                    <img 
                        src={image} 
                        style={{ objectFit: "cover" }}
                        className={`rounded ${className}`} 
                        onClick={() => setShowImage(false)} />
                </div>
            )}
        </>
    );
};
