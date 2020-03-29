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
    log('\n请输入： 扫描的绝对目录 + tree文件名(默认tree-pro-目录名) + 环境(默认dev)\n' +
        '\n' +
        'Example: node index.js   D:\\tree-pro\\test test dev 或 D:\\tree-pro\\test lidi  dev'); exit();
}
//扫描的绝对目录
let scan_file_dir  =  arguments[0];
let scan_dir_arr   =  scan_file_dir.split('\\');
let tree_right_pin =  scan_dir_arr.pop();
//Tree文件名
let tree_file_name =  arguments[1] ? arguments[1] : 'tree-pro-' + tree_right_pin;
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
let tree_file_path = path.resolve(__dirname, scan_file_dir + '\\' + tree_file_name + '.md');
//log(tree_file_path);exit();
let tree_file_data = my_try_catch(tree_file_path, function (real_file_path){
    return fs.readFileSync(real_file_path).toString();
});
// init tree-pro.md
if (!tree_file_data) {
    log('文件:' + tree_file_path + ' 为空或不存在!');
    let new_str_data = my_try_catch(scan_file_dir, function (real_path){
        let new_str = tree_cli((real_path), {
            allFiles: true,
            exclude: [/node_modules/, /lcov/],
            maxDepth: 4,
        });
        log(new_str);
        fs.appendFileSync(tree_file_path, new_str);
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
 * 4、组装最后数据
 * 5、覆盖写入Tree文件
 */
//0、Tree文件：tree_file_data: 字符串索引old_tree 和  notice_arr索引数组'//*'(字符串索引,)
let new_file_data = tree_file_data.split('\n');
//移除为空的元素
new_file_data = new_file_data.filter(function (s) {
    return s && s.trim();
});
//初始化
let notice_arr = [], old_tree = [], real_old_tree = [];
for (let i=0; i < new_file_data.length; ++i) {
    let split_arr = new_file_data[i].split(tree_notice);
    real_old_tree[i]         = split_arr[0];
    old_tree[tree_pin + i]   = split_arr[0];
    notice_arr[tree_pin + i] = split_arr[1] ? split_arr[1] : '';
}
//log(old_tree);//exit(notice_arr);
//1、扫描绝对目录：字符串索引new_tree
let new_str = tree_cli((scan_file_dir), {
    allFiles: true,
    exclude: [/node_modules/, /lcov/],
    maxDepth: 4,
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
}
//log(old_tree);//exit(new_tree);
//数据调度：策略&安全
//3、for 循环 最大的num, 执行相应逻辑 //4、组装最后数据
let old_keys = Object.keys(old_tree);
let map_res = redux_map[`${redux_flag}`];
//重新处理数组
let deal_new_tree = new_tree.map(x => { return x.split(' ').pop(); });
let deal_old_tree = real_old_tree.map(x => { return x.split(' ').pop(); });
if (map_res) {
    switch (map_res) {
        case 'gt':
            //大于: 删除逻辑 //exit(deal_old_tree);
            for (let m=0; m < old_keys.length; ++m) {
                //找出待删除的元素
                if (deal_new_tree.indexOf(deal_old_tree[m]) === -1) {
                    delete old_tree[`${old_keys[m]}`];
                } else {
                    //组装备注
                    if (new_tree[m]) {
                        old_tree[`${old_keys[m]}`] = new_tree[m] + '//' + notice_arr[`${old_keys[m]}`];
                    }
                }
            }
            break;
        case 'lt':
            //小于: 插入逻辑 //log(new_tree);
            for (let n=0; n < deal_new_tree.length; ++n) {
                //找出待插入的元素
                if (deal_old_tree.indexOf(deal_new_tree[n]) === -1) {
                    deal_old_tree.splice(n,0, new_tree[n] + '//');
                    deal_new_tree[n] = new_tree[n] + '//';
                } else {
                    deal_old_tree[n] = new_tree[n] + '//' + (notice_arr[`${old_keys[n]}`] ? notice_arr[`${old_keys[n]}`] : '');
                }
            }
            old_tree = deal_old_tree;//exit(old_tree);
            break;
        default:
            //等于:e更新逻辑
            for (let k=0; k < old_keys.length; ++k) {
                let old_tree_value = old_tree[`${old_keys[k]}`];
                let new_tree_value = new_tree[k];
                if (old_tree_value !== new_tree_value) {
                    old_tree[`${old_keys[k]}`] = new_tree_value;
                }
                //组装备注
                old_tree[`${old_keys[k]}`] = old_tree[`${old_keys[k]}`] + '//' + notice_arr[`${old_keys[k]}`]; //exit(old_tree);
            }
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
    fs.appendFileSync(tree_file_path, old_to_new[z] + '\n');
    log(old_to_new[z]);
}
console.log("循环追加写入,成功!");








