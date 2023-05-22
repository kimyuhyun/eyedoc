import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { toastState } from "../utils/atom";   

export default () => {
    const [toast, setToast] = useRecoilState(toastState);

    useEffect(() => {
        const timer = setTimeout(() => setToast({ isToast: false }), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
            <div className="toast" style={{ display: "block" }}>
                <div className="toast-header">
                    <strong className="me-auto">알림</strong>
                    {/* <small>방금</small> */}
                    <button type="button" className="btn-close" onClick={() => setToast({ isToast: false })}></button>
                </div>
                <div className="toast-body">{toast.message}</div>
            </div>
        </div>
    );
};
