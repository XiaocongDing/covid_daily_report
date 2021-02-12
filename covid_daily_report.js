const puppeteer = require('puppeteer');
const config = require('./config');

function preload(){ 
    // 浏览器伪装
    //在每个新页面打开前执行以下脚本
    const newProto = navigator.__proto__;
    delete newProto.webdriver;  //删除navigator.webdriver字段
    navigator.__proto__ = newProto;
    // Object.defineProperty(navigator, 'webdriver', {
    //         get: () => undefined,
    // });
    window.chrome = {};  //添加window.chrome字段，为增加真实性还需向内部填充一些值
    window.chrome.app = {"InstallState":"hehe", "RunningState":"haha", "getDetails":"xixi", "getIsInstalled":"ohno"};
    window.chrome.csi = function(){};
    window.chrome.loadTimes = function(){};
    window.chrome.runtime = function(){};
    Object.defineProperty(navigator, 'userAgent', {  //userAgent在无头模式下有headless字样，所以需覆写
            get: () => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
    });
    Object.defineProperty(navigator, 'plugins', {  //伪装真实的插件信息
            get: () => [{"description": "Portable Document Format",
                        "filename": "internal-pdf-viewer",
                        "length": 1,
                        "name": "Chrome PDF Plugin"}]
    });
    Object.defineProperty(navigator, 'languages', { //添加语言
            get: () => ["zh-CN", "zh", "en"],
    });
    const originalQuery = window.navigator.permissions.query; //notification伪装
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
};

var sleep =async function(time) {
    var startTime = new Date().getTime() + parseInt(time, 10);
    while(new Date().getTime() < startTime) {}
};

function login_bypass(config){
    // 参考@onion-rai/uestc_health_report的绕过脚本
    var casLoginForm = document.getElementById("casLoginForm");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    username.value = config.user_id;
    password.value = config.passwd;
    _etd2(password.value, document.getElementById("pwdDefaultEncryptSalt").value);
    casLoginForm.submit();
}

async function report() {
    console.log(new Date().toString() + ": ▶程序开始");
    const browser = await puppeteer.launch({
        executablePath: config.chrome_exepath,
        ignoreDefaultArgs: ["--enable-automation"],
        headless:config.headless
    });

    const page = await browser.newPage();
    try{
        const app_ver = await page.evaluate(()=> navigator.appVersion.split(' ')[10] < 'Chrome/88.0');
        if(!app_ver){
            throw new Error('Chrome 版本过高，请选择87.*及以下')
        }
        await page.evaluateOnNewDocument(preload);
        await page.goto('https://eportal.uestc.edu.cn/jkdkapp/sys/lwReportEpidemicStu/index.do?#/dailyReport', {
            waitUntil:"networkidle0"
        });

        await page.evaluate(login_bypass, config);
        
        await page.waitForNavigation({waitUntil:"networkidle0"});
        const user_id = await page.evaluate(()=>USER_INFO.info[0]);
        if (user_id == config.user_id) {
            console.log("✔登陆成功！登陆用户："+user_id);
        }
        else{
            throw new Error("登陆失败");
        }
        await page.waitForSelector('div[data-action="add"]');
        await page.click('div[data-action="add"]');
        await page.waitForTimeout(2000);
        await page.evaluate(()=>{
            $('#save').click();
        });
        await page.waitForTimeout(2000);
        await page.evaluate(()=>{
            $('a.bh-dialog-btn.bh-bg-primary.bh-color-primary-5').click();
        });
        await page.waitForTimeout(1000);
        await page.waitForSelector('div[data-action="add"]');
        await page.click('div[data-action="add"]');
        await page.waitForTimeout(2000);
        today_status = await page.evaluate(()=>document.querySelector('.content').innerText);
        if (today_status == "今日已填报！") {
            console.log("✔填报成功");
        }
        await page.goto('https://eportal.uestc.edu.cn/jkdkapp/sys/lwReportEpidemicStu/index.do?#/tempReport', {
            waitUntil:"networkidle0"
        });
        await page.waitForSelector('div[data-action="add"]');
        await page.click('div[data-action="add"]');
        await page.waitForTimeout(2000)
        
        await page.waitForSelector('input[data-name="TEMPERATURE"]')
        await page.type('input[data-name="TEMPERATURE"]','36.5')
        await page.waitForTimeout(2000)
        await page.click('div[data-action="save"]');

    }
    catch(e){
        console.log("✖Error:"+e);
        return -1
    }
    finally{
        browser.close();
    }
}

//report();
async function exec() {
    while(true){
        await report();
        await sleep(30000) //30s
        await sleep(14400000) //4hours
    }
}

exec()
