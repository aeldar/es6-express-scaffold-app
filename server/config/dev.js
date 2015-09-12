import path from 'path';

// this file is actually located inside <project root>/.tmp/server/config/ for the moment it executes, so be careful counting double dots in paths

export default {
  staticDirs: [
    path.join(__dirname, '/../../client'),
    path.join(__dirname, '/../../../client'), // for orig resources those not compiled into .tmp/client
    path.join(__dirname, '/../../../') // project root for serving bower_components
  ]
};
