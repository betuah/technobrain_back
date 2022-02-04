const { ValidationError } = require("express-json-validator-middleware")

module.exports = (err, req, res, next) => {
    if(req.get("Content-Type") == "application/json") { 
        if (err instanceof ValidationError) {
            const resError = {
                status_code: 400,
                status_message: err.validationErrors.body[0].message,
                validation_message: err.validationErrors.body[0].params,
                dataPath: err.validationErrors.body[0].dataPath
            }

            res.status(400).json(resError)
            // next();
        } else {
            next(err)
        }
    } else {
        res.status(401).send("Invalid header format")
    }
}