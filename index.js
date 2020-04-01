/** Tree 引用 **/
const fs         = require("fs");
const path       = require('path');
const shell      = require('shelljs');
const tree_cli   = require('tree-node-cli');

/** Tree 默认conf **/
const conf_pin  = 'config/tree.';

/** Tree 默认.md **/
const tree_pin  = 'zz-tree-pro-';

/** Tree 备注'//' **/
const tree_notice  = '\/\/';

/** Tree 全局log **/
const {my_try_catch, log, exit} = require('./service/log');

/** Tree 全局config **/
const {get_config} = require('./service/cnf');

/** Tree 全局 ini **/
const {ini_tree} = require('./service/ini');

/** Tree 全局redux **/
const {map_redux, map_del, map_add, map_update} = require('./service/map_redux');

/**
 * 参数捕捉
 * @type    [] arguments
 */
let arguments = process.argv.splice(2);
if (arguments.length < 1) {
    log('\n请输入： 扫描的绝对目录 + 扫描的绝对深度(默认:2级) + tree文件名(默认:zz-tree-pro-目录名) + 环境(默认:dev)\n' +
        '\n' +
        'Example: node index.js   D:\\tree-pro\\test 2 test dev 或 D:\\tree-pro\\test 2 lidi  dev'); exit();
}

/** a、扫描的绝对目录 **/
let scan_file_dir  =  arguments[0];

let scan_dir_arr   =  scan_file_dir.split('/');
/** 兼容windows **/
if (scan_dir_arr[0] === scan_file_dir) {
    scan_dir_arr   =  scan_file_dir.split('\\');
}
let tree_right_pin =  scan_dir_arr.pop();
/** 兼容 根盘符 **/
if (!tree_right_pin) {
    tree_right_pin = scan_dir_arr.pop().split(':')[0];
}

/** b、扫描的绝对深度 **/
let scan_deep      =  arguments[1] ? arguments[1] : 2;

/** c、Tree文件名 **/
let tree_file_name =  arguments[2] ? arguments[2] : tree_pin + tree_right_pin;

/** d、当前环境 **/
let env_name       =  arguments[3] ? arguments[3] : 'dev';

/**
 * @notice 配置信息全局化
 */
const config_Obj = get_config(conf_pin, env_name, fs, path, my_try_catch, {log, exit});

/** 读取 tree md 文件 **/
let tree_md_file_path  = path.resolve(__dirname, scan_file_dir + '/' + tree_file_name + '.md');

/** 初始化 tree-pro **/
let old_tree_file_data = ini_tree(tree_md_file_path, scan_file_dir, scan_deep, fs, tree_cli, my_try_catch, {log, exit});

/** 0、Tree文件：tree_md_file_data: 字符串索引old_tree 和  notice_arr索引数组'//*' **/
let notice_arr = [], old_tree = [], old_keys = [];
for (let i=0; i < old_tree_file_data.length; ++i) {
    let split_arr = old_tree_file_data[i].split(tree_notice);
    let old_key   = split_arr[0].split(' ').join('');
    old_keys[i]   = old_key; old_tree[old_key] = split_arr[0];
    notice_arr[old_key] = split_arr[1] ? split_arr[1] : '';
}

/** 1、扫描目录：new_tree**/
let new_str = tree_cli((scan_file_dir), {
    allFiles: false,
    exclude: [/node_modules/, /lcov/],
    maxDepth: scan_deep,
});
let new_tree = new_str.split('\n');

/** 2、old > new: 删除逻辑; old < new:插入逻辑  old = new：更新逻辑 **/
let map_res  = map_redux(old_tree, new_tree);

/** 3、for 循环 最大的num, 执行相应逻辑, 处理新数组, 组装数据 **/
let tmp_new_tree = [], new_keys = [];
for (let p=0; p < new_tree.length; ++p) {
    let new_key  = new_tree[p].split(' ').join('');
    new_keys[p]  = new_key; tmp_new_tree[new_key] = new_tree[p];
}
new_tree = tmp_new_tree; new_keys = Object.values(new_keys);
old_keys = Object.values(old_keys);

/**
 *  Map 数据调度: 策略 & 安全
 */
if (map_res) {
    switch (map_res) {
        case 'gt':
            /** 大于: 删除逻辑 **/
            old_tree = map_del(old_keys, notice_arr, new_keys, new_tree, {log, exit});
            break;
        case 'lt':
            /** 小于: 插入逻辑 **/
            old_tree = map_add(old_keys, notice_arr, new_keys, new_tree, {log, exit});
            break;
        default:
            /** 等于:e更新逻辑 **/
            old_tree = map_update(old_keys, notice_arr, new_keys, new_tree, {log, exit});
    }
} else { exit("非法数据，调度，请注意！"); }

/** 5、覆盖写入Tree文件 **/
let old_to_new = Object.values(old_tree);
fs.writeFileSync(tree_md_file_path, '', [{ encoding: 'utf8'}]);
for (let z=0; z < old_to_new.length; ++z) {
    fs.appendFileSync(tree_md_file_path, old_to_new[z] + '\n');
}

log("Tree-pro, 自动写入成功^_^");








