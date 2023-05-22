import BeatLoader from "react-spinners/BeatLoader";

export default () => {
    return (
        <>
            <div className="axios-loading">
                <div className="axios-loading-indicator">
                    <BeatLoader color={"white"} loading={true} size={40} />
                </div>
            </div>
            <style jsx="true">{`
                .axios-loading {
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    overflow: auto;
                    display: block;
                    position: fixed !important;
                    background-color: rgba(0, 0, 0, 0.3);
                }
                .axios-loading-indicator {
                    top: 45%;
                    left: calc(50% - 75px);
                    position: fixed;
                }
            `}</style>
        </>
    );
};
