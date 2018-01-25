const fs = require('fs');

function deleteFile(path) {
  fs.unlink(path, (err) => {
    if (err) {
      console.log('Error deleting file', JSON.stringify(err));
    }

    console.log('Deleted file => ', path);
  });
}

module.exports = {
  deleteFile
}