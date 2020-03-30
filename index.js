/**
 * 引入扩展
 */
const fs        = require("fs");
const path      = require('path');
const shell     = require('shelljs');
const tree_cli  = require('tree-node-cli');
//Tree 数字索引
const tree_pin  = 'pro_';
//Tree 备注'//'
const tree_notice  = '\/\/';
/**
 * 异常捕获
 * @param {[]} data //数据
 * @param callable  //回调函数
 * @returns {boolean|*}
 */
let my_try_catch = function(data, callable) {
    try {
        return callable(data);
    } catch (e) {
        return false;
    }
};
//打印log
let log = function($obj) {
    console.log($obj);
};
//程序终止
let exit = function($notice = false) {
    if ($notice) {
        log($notice);
    }
    process.exit();
};
/**
 * 参数捕捉
 * @type    [] arguments //环境名 和 文件名
 * @example [ 'dev', 'lidi' ]
 */
let arguments = process.argv.splice(2);
if (arguments.length < 1) {
    log('\n请输入： 扫描的绝对目录 + tree文件名(默认zz-tree-pro-目录名) + 环境(默认dev)\n' +
        '\n' +
        'Example: node index.js   D:\\tree-pro\\test test dev 或 D:\\tree-pro\\test lidi  dev'); exit();
}
//扫描的绝对目录
let scan_file_dir  =  arguments[0];
let scan_dir_arr   =  scan_file_dir.split('/');
//兼容windows
if (scan_dir_arr[0] === scan_file_dir) {
    scan_dir_arr   =  scan_file_dir.split('\\');
}
let tree_right_pin =  scan_dir_arr.pop();
//Tree文件名
let tree_file_name =  arguments[1] ? arguments[1] : 'zz-tree-pro-' + tree_right_pin;
//当前环境
let env_name       =  arguments[2] ? arguments[2] : 'dev';
/**
 * 全局配置文件
 */
let global_config_path = path.resolve(__dirname, 'config/index.' + env_name);
/**
 * 文件是否存在
 * @type {boolean|*}
 */
let is_exit = my_try_catch(global_config_path, function (config_path) {
    let config_info = fs.statSync(config_path);
    return config_info.isFile();
});
if (!is_exit) {
    log('配置文件不存在: ' + global_config_path); exit();
}
/**
 * 同步读取：配置文件信息
 * @type {[]} config_Obj
 * @notice 配置信息全局化
 */
const config_Obj = JSON.parse(fs.readFileSync(global_config_path).toString());
/**
 * 同步读取:目标Tree文件
 */
let tree_file_path = path.resolve(__dirname, scan_file_dir + '/' + tree_file_name + '.md');
//log(tree_file_path);exit();
let tree_file_data = my_try_catch(tree_file_path, function (real_file_path){
    return fs.readFileSync(real_file_path).toString();
});
// init zz-tree-pro.md
if (!tree_file_data) {
    log('文件:' + tree_file_path + ' 为空或不存在!');
    let new_str_data = my_try_catch(scan_file_dir, function (real_path){
        let new_str = tree_cli((real_path), {
            allFiles: false,
            exclude: [/node_modules/, /lcov/],
            maxDepth: 2,
        });
        let deal_new_str = new_str.split('\n');
        for (let q=0; q < deal_new_str.length; ++q) {
            //同步的追加
            fs.appendFileSync(tree_file_path, deal_new_str[q] + ' //' + '\n');
            log(deal_new_str[q] + ' //');
        }
        return true;
    });
    if (!new_str_data) {
        log('警告:绝对路径('+scan_file_dir+')出错或不存在，请核查一次后重试!'); exit();
    }
    log('请注意:已经自动，帮你初始化Tree!'); exit();
}
/**
 * Start 处理 Tree
 * 0、Tree文件：tree_file_data: 字符串索引old_tree 和  notice_arr索引数组'//*'(字符串索引,)
 * 1、扫描绝对目录：字符串索引new_tree
 * 2、old_num > new_num: 插入逻辑; old_num < new_num: 删除逻辑  old_num = new_num：更新逻辑
 * 3、for 循环 最大的num, 执行相应逻辑
 * 4、组装最后数据 ok
 * 5、覆盖写入Tree文件
 */
//0、Tree文件：tree_file_data: 字符串索引old_tree 和  notice_arr索引数组'//*'(字符串索引,)
let new_file_data = tree_file_data.split('\n');
//移除为空的元素
new_file_data = new_file_data.filter(function (s) {
    return s && s.trim();
});
//初始化
let notice_arr = [], old_tree = [], old_keys = [];
for (let i=0; i < new_file_data.length; ++i) {
    let split_arr = new_file_data[i].split(tree_notice);
    let old_key   = split_arr[0].split(' ').join('');
    old_keys[i]   = old_key;
    old_tree[old_key]   = split_arr[0];
    notice_arr[old_key] = split_arr[1] ? split_arr[1] : '';
}//exit(old_keys);//log(old_tree);//exit(notice_arr);
//1、扫描绝对目录：字符串索引new_tree
let new_str = tree_cli((scan_file_dir), {
    allFiles: false,
    exclude: [/node_modules/, /lcov/],
    maxDepth: 2,
});
let new_tree = new_str.split('\n');
//2、old > new: 删除逻辑; old < new:插入逻辑  old = new：更新逻辑
//数据调度: 映射
let redux_map = {
     '=': 'e',
     '>': 'gt',
     '<': 'lt',
};
let redux_flag = '=';
if (Object.keys(old_tree).length > Object.keys(new_tree).length) {
    redux_flag = '>';
} else if (Object.keys(old_tree).length < Object.keys(new_tree).length){
    redux_flag = '<';
}//log(old_tree);//exit(new_tree);
//数据调度：策略&安全
//3、for 循环 最大的num, 执行相应逻辑 //4、组装最后数据
let map_res = redux_map[`${redux_flag}`];
//重新处理数组
let tmp_new_tree = [], new_keys = [];
for (let p=0; p < new_tree.length; ++p) {
    let new_key  = new_tree[p].split(' ').join('');
    new_keys[p]  = new_key;
    tmp_new_tree[new_key] = new_tree[p];
}
new_tree = tmp_new_tree; //log(old_keys);exit(new_keys);
new_keys = Object.values(new_keys);
old_keys = Object.values(old_keys); //exit(new_tree);
if (map_res) {
    switch (map_res) {
        case 'gt':
            //大于: 删除逻辑
            //log(new_tree);exit(old_tree);log(notice_arr);
            let del_items = [];
            for (let m=0; m < old_keys.length; ++m) {
                if (new_keys.indexOf(old_keys[m]) === -1) {
                    //收集删除的元素
                    del_items[m] = old_keys[m] + ' : ' + notice_arr[`${old_keys[m]}`];
                } else {
                    //组装备注
                    new_tree[old_keys[m]] = new_tree[old_keys[m]] + ' //' + notice_arr[`${old_keys[m]}`];
                }
            }
            log("请留意: 以下文件被删除");
            log(Object.values(del_items));
            old_tree = new_tree;
            break;
        case 'lt':
            //小于: 插入逻辑 exit(old_tree); //exit(notice_arr);
            let add_items = [];
            for (let n=0; n < new_keys.length; ++n) {
                if (old_keys.indexOf(new_keys[n]) === -1) {
                    //收集增加的元素
                    add_items[n] = new_keys[n];
                    new_tree[new_keys[n]] = new_tree[new_keys[n]] + ' //';
                }
                //组装备注
                if (notice_arr[`${old_keys[n]}`] !== undefined) {
                     new_tree[old_keys[n]] = new_tree[old_keys[n]] + ' //' + notice_arr[`${old_keys[n]}`];
                }
            }
            //log(old_keys);exit(new_keys);
            log("请留意: 以下文件是新增");
            log(Object.values(add_items));
            old_tree = new_tree;
            break;
        default:
            //等于:e更新逻辑 //exit(notice_arr);
            let update_items = [];
            for (let k=0; k < new_keys.length; ++k) {
                if (old_keys.indexOf(new_keys[k]) === -1) {
                    //收集更新的元素
                    update_items[k] = new_keys[k];
                    new_tree[new_keys[k]] = new_tree[new_keys[k]] + ' //' + notice_arr[`${old_keys[k]}`];
                }
                //组装备注
                if (new_tree[old_keys[k]] !== undefined) {
                    new_tree[old_keys[k]] = new_tree[old_keys[k]] + ' //' + notice_arr[`${old_keys[k]}`];
                    //1、删除已用的注释
                    delete notice_arr[`${old_keys[k]}`];
                }
            }
            //2、再次替换修改
            if (Object.values(update_items).length > 1) {
                log("请留意: 以下是批量更新文件");
                log(Object.values(update_items));
                exit('Tree-pro友情提示:(v1.00)目前不支持批量更新，请逐一修改.');
            }
            new_tree[Object.values(update_items)[0]] = new_tree[Object.values(update_items)[0]].split('//')[0] + ' //' + Object.values(notice_arr).pop();
            //log(Object.values(update_items));exit(new_tree);
            log("请留意: 以下文件是更新");
            log(Object.values(update_items));
            old_tree = new_tree;
    }
} else {
    exit("非法数据，调度，请注意！");
}
//5、覆盖写入Tree文件
let old_to_new = Object.values(old_tree);
//清空文件//要写入的文件   要写入的内容       a追加|w写入（默认）|r（读取）
fs.writeFileSync(tree_file_path, "", [{ encoding: "utf8"}]);
for (let z=0; z < old_to_new.length; ++z) {
    //同步的追加
    fs.appendFileSync(tree_file_path, old_to_new[z] + '\n'); //log(old_to_new[z]);
}
console.log("循环追加写入,成功!");








