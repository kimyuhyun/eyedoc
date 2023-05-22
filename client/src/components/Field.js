

export default ({ title, name1, type, readOnly, required, placeholder, defaultValue, value, handelChange }) => {
    if (type == "textarea") {
        return (
            <div className="row">
                <label className="col-sm-2 col-form-label">{title}</label>
                <div className="col-sm-10">
                    <textarea
                        className={`form-control${readOnly ? "-plaintext" : ""} form-control-sm`}
                        rows={10}
                        name={name1}
                        type={type}
                        readOnly={readOnly}
                        required={required}
                        placeholder={placeholder}
                        defaultValue={defaultValue}
                    />
                </div>
            </div>
        );
    } else {
        return (
            <div className="row">
                <label className="col-sm-2 col-form-label">{title}</label>
                <div className="col-sm-10">
                    <input
                        className={`form-control${readOnly ? "-plaintext" : ""} form-control-sm`}
                        name={name1}
                        type={type}
                        readOnly={readOnly}
                        required={required}
                        placeholder={placeholder}
                        defaultValue={defaultValue}
                        onChange={handelChange}
                    />
                </div>
            </div>
        );
    }
};
