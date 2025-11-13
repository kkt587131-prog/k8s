const fs = require('fs');
stat = fs.stat;
const path = require('path');
/**
 * 删除目录下 .DS_Store 文件方法
 * @param  String dir 文件夹名称
 */

const replaceEnv = (targetYaml, image) => {

  fs.readFile(targetYaml, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const updatedData = data.replace(/\${docker\.io}/g, image);
    fs.writeFile(targetYaml, updatedData, 'utf8', (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('文件内容已成功替换。');
      console.log(updatedData);
    });
  });
}

const args = process.argv.slice(2);
replaceEnv(args[0], args[1]);
