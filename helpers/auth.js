module.exports = {

  adminOnly: function(req, res, next) {
    if (!req.isAuthenticated()) {
      res.redirect('/users/login');
    } else {
      if (req.user.isAdmin) {
        return next();
      } else {
        res.redirect('/builds');
      }
    }
  },

  ensureAuthenticated: function(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect('/users/login');
  },

  ensureGuest: function(req, res, next){
    if(req.isAuthenticated()){
      res.redirect('/builds');
    } else {
      return next();
    }
  }
}