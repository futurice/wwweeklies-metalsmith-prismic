var Handlebars = require('handlebars');

module.exports = function() {
  var helpers = {
    json: function(value, indentation) {
      return JSON.stringify(value, null, indentation);
    },
    striptags: function( txt ){
      // exit now if text is undefined
      if(typeof txt == "undefined") return;
      return txt.replace(/<[^>]+>/g, '');
    }
  };

  for(var key in helpers) {
    if(helpers.hasOwnProperty(key)) {
      Handlebars.registerHelper(key, helpers[key]);
    }
  }

  return function(files, metalsmith, done) {
    done();
  };
};
