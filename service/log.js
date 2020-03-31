/**
 * 捕获 try
 * @param {[]} data //数据
 * @param callable  //回调函数
 * @returns {boolean|*}
 */
let my_try_catch = (data, callable) => {
    try {
        return callable(data);
    } catch (e) {
        return false;
    }
};

/**
 * 打印 log
 * @param $obj
 */
let log = ($obj) => {
    console.log($obj);
};

/**
 * 终止 exit
 * @param $notice
 */
let exit = ($notice = false) => {
    if ($notice) {
        log($notice);
    }
    process.exit();
};

/**
 * 导出
 * @type {{my_try_catch: *, exit: *, log: *}}
 */
module.exports = {
    my_try_catch,
    log,
    exit
};