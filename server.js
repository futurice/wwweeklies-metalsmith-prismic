#!/usr/bin/env node
'use strict';

// Setup env variables from local .env file. After this call, all variables
// from .env file can be access via `process.env`.
var dotEnvLoaded = require('dotenv').config({
    silent: true,
});
console.log('.env file loaded:', dotEnvLoaded);

var autoprefixer = require('metalsmith-autoprefixer');
var beautify = require('metalsmith-beautify');
var ignore = require('metalsmith-ignore');
var layouts = require('metalsmith-layouts');
var markdown = require('metalsmith-markdown');
var sass = require('metalsmith-sass');

var metalsmithPrismicServer = require('metalsmith-prismic-server');

var handlebarsHelpers = require('./plugins/handlebars-helpers');
var utils = require('./utils/utils.js');

var argv = require('process').argv;

var config = {
  // See src/config.js in metalsmith-prismic-server for all options

  /**
   * Configure metalsmith-prismic linkResolver
   * Generates prismic links and paths for the files in a prismic collections
   *
   * E.g. The paths for each blog-post in the blog-post.md collection will be generated as:
   *      /blog-post/my-second-blog-post/index.html
   *
   * E.g. The paths for prismic author links will be generated as:
   *      /author/bob/
   *
   * Note: the linkResolver does not affect single prismic files
   *
   */
  prismicLinkResolver (ctx, doc) {
    if (doc.isBroken) {
      return;
    }

    // For prismic collection files append 'index.html'
    // Leave it out for prismic link paths
    var filename = doc.data ? 'index.html' : '';
    switch (doc.type) {
      case 'home':
        return '/' + filename;
      default:
        return '/' + doc.type + '/' +  (doc.uid || doc.slug) + '/' + filename;
    }
  },

  // Metalsmith plugins passed to metalsmithPrismicServer
  plugins: {
    common: [
      markdown(),
      // Register handlebars helpers
      handlebarsHelpers(),
      // Render with handlebars templates
      layouts({
        engine: 'handlebars',
        directory: 'layouts',
        partials: 'partials',
        pattern: '**/*.html'
      }),
      // Style using sass
      sass({
        outputDir: 'style/'
      }),
      // Autoprefix styles
      autoprefixer({
        // Support browsers based on these versions
        browsers: ['last 2 versions',
                   '> 5%']
      }),
      // Prettify output
      beautify({
        indent_size: 2,
        indent_char: ' ',
        wrap_line_length: 0,
        end_with_newline: true,
        css: true,
        html: true
      }),
      // Ignore some files
      ignore([
        '**/*.scss'
      ])
    ],
    deploy: [
      function (files, metalsmith, done) {
        for (var fileName in files) {
          var file = files[fileName];
          var pathDepth = (fileName.match(/\//g) || []).length;
          var pathPrefix = '.';
          while (pathDepth-- > 0) {
            pathPrefix = '../' + pathPrefix
          }
          file.contents = new Buffer(file.contents.toString().replace(/href="\//g, 'href="' + pathPrefix + '/'));
        }

        done();
      }
    ]
  }
};

function run() {
  // Start server
  switch (argv[2]) {
    case 'dev':
      metalsmithPrismicServer.dev(config);
      break;
    case 'prod':
      metalsmithPrismicServer.prod(config);
      break;
    case 'build':
      metalsmithPrismicServer.build(config, ['deploy'], () => null);
      break;
    default:
      console.error(`invalid command '${argv[2]}'`);
  }
}

if (require.main === module) {
  // Only run server if run from script
  run();
}
