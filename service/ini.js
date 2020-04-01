/**
 * Tree-pro 初始化
 * @param tree_md_file_path
 * @param scan_file_dir
 * @param scan_deep
 * @param fs
 * @param tree_cli
 * @param my_try_catch
 * @param tree
 * @returns {[]}
 */
let ini_tree = (tree_md_file_path, scan_file_dir, scan_deep, fs, tree_cli, my_try_catch, tree) => {
    /**
     * 读取文件
     */
    let tree_md_file_data = my_try_catch(tree_md_file_path, function (real_file_path){
        return fs.readFileSync(real_file_path).toString();
    });
    /**
     * 初始化: zz-tree-pro.md
     */
    if (!tree_md_file_data) {
        tree.log('文件:' + tree_md_file_path + ' 为空或不存在!');
        let new_str_data = my_try_catch(scan_file_dir, function (real_path){
            let new_str = tree_cli((real_path), {
                allFiles: false,
                exclude: [/node_modules/, /lcov/],
                maxDepth: scan_deep,
            });
            let deal_new_str = new_str.split('\n');
            for (let q=0; q < deal_new_str.length; ++q) {
                //同步的追加
                fs.appendFileSync(tree_md_file_path, deal_new_str[q] + ' //' + '\n');
                tree.log(deal_new_str[q] + ' //');
            }
            return true;
        });
        if (!new_str_data) {
            tree.log('警告:绝对路径('+scan_file_dir+')出错或不存在，请核查一次后重试!'); tree.exit();
        }
        tree.log('请注意:tree-pro已经自动，帮你初始化Tree^_^'); tree.exit();
    }

    /**
     * Start Tree
     */
    let old_tree_file_data = tree_md_file_data.split('\n');

    /** 移除空元素 **/
    return  old_tree_file_data.filter(function (s) {
        return s && s.trim();
    });
};

/**
 * 导出
 * @type {{ini_tree: *}}
 */
module.exports = {
    ini_tree
};