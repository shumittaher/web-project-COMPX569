function verifyAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/account/login");
    }
}

module.exports = { verifyAuthenticated };