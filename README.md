# 每日疫情上报脚本

使用`Puppetree`控制Chrome实现自动每日疫情上报和晚点名，点击规则请自己修改，都是简单的JQuery选择器语法

## 介绍

config.js: 配置信息，填写chrome.exe启动路径，姓名，学号 

covid_daily_report.js：每日疫情上报


## 使用方法
1. 安装`Node.js`和`cnpm`，`cnpm`安装参考[菜鸟教程](https://www.runoob.com/nodejs/nodejs-npm.html)
2. `cnpm install puppeteer`
3. 在[此处](https://npm.taobao.org/mirrors/chromium-browser-snapshots/Win_x64/)下载 Chrome，要求版本低于87.*,高于78.\* ，将chrome.exe的路径写入`config.js`
4. 填写 `config.js`中的学号和密码
5. 运行`node covid_daily_report.js`

