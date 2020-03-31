/**
 * 数据调度：映射
 * @type {{"<": string, "=": string, ">": string}}
 */
let redux_map = {
    '=': 'e',
    '>': 'gt',
    '<': 'lt',
};

/**
 * 数据调度：策略 & 安全
 * @param old_tree
 * @param new_tree
 * @returns {*}
 */
let map_redux = (old_tree, new_tree) => {
    let redux_flag = '=';
    if (Object.keys(old_tree).length > Object.keys(new_tree).length) {
        redux_flag = '>';
    } else if (Object.keys(old_tree).length < Object.keys(new_tree).length){
        redux_flag = '<';
    }
    return redux_map[`${redux_flag}`];
};

/**
 * tree-pro
 * map redux :删除逻辑
 * @param {[]} old_keys
 * @param {[]} notice_arr
 * @param {[]} new_keys
 * @param {[]} new_tree
 * @param tree
 * @returns {*}
 */
let map_del = (old_keys, notice_arr, new_keys, new_tree, tree) => {
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
    tree.log("请留意: 以下文件被删除");
    tree.log(Object.values(del_items));
    return new_tree;
};

/**
 * tree-pro
 * map redux :增加逻辑
 * @param {[]} old_keys
 * @param {[]} notice_arr
 * @param {[]} new_keys
 * @param {[]} new_tree
 * @param tree
 * @returns {*}
 */
let map_add = (old_keys, notice_arr, new_keys, new_tree, tree) => {
    let add_items = [];
    for (let n=0; n < new_keys.length; ++n) {
        if (old_keys.indexOf(new_keys[n]) === -1) {
            //收集增加的元素
            add_items[n] = new_keys[n];
            new_tree[new_keys[n]] = new_tree[new_keys[n]] + ' //';
        }
        //组装备注
        if (notice_arr[`${old_keys[n]}`] !== undefined && new_tree[old_keys[n]] !== undefined) {
            new_tree[old_keys[n]] = new_tree[old_keys[n]] + ' //' + notice_arr[`${old_keys[n]}`];
        }
    }
    tree.log("请留意: 以下文件是新增");
    tree.log(Object.values(add_items));
    return new_tree;
};

/**
 * tree-pro
 * map redux :更新逻辑
 * @param {[]} old_keys
 * @param {[]} notice_arr
 * @param {[]} new_keys
 * @param {[]} new_tree
 * @param tree
 * @returns {*}
 */
let map_update = (old_keys, notice_arr, new_keys, new_tree, tree) => {
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
        tree.log("请留意: 以下是批量更新文件");
        tree.log(Object.values(update_items));
        tree.exit('Tree-pro友情提示:(v1.00)目前不支持批量更新，请逐一修改.');
    }
    if (Object.values(update_items)[0]) {
        new_tree[Object.values(update_items)[0]] = new_tree[Object.values(update_items)[0]].split('//')[0]
            + '//' + Object.values(notice_arr).pop();
    }
    tree.log("请留意: 以下文件是更新");
    tree.log(Object.values(update_items));
    return new_tree;
};

/**
 * 导出
 * @type {{map_add: *, map_update: *, map_del: *}}
 */
module.exports = {
    map_redux,
    map_del,
    map_add,
    map_update
};