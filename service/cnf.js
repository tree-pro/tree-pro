/**
 *
 * @param {[]} conf_pin
 * @param env_name
 * @param fs
 * @param path
 * @param my_try_catch
 * @param tree
 * @returns { {} }
 */
let get_config = (conf_pin, env_name, fs, path, my_try_catch, tree) => {
    /**
     * 全局配置文件
     */
    let global_config_path = path.resolve(__dirname, '../'+conf_pin + env_name);

    /**
     * 文件是否存在
     * @type {boolean|*}
     */
    let is_exit = my_try_catch(global_config_path, function (config_path) {
        let config_info = fs.statSync(config_path);
        return config_info.isFile();
    });
    if (!is_exit) {
        tree.log('配置文件不存在: ' + global_config_path); tree.exit();
    }
    /**
     * 同步读取：配置文件信息
     * @type {[]} config_Obj
     * @notice 配置信息全局化
     */
    return JSON.parse(fs.readFileSync(global_config_path).toString());
};

/**
 * 导出
 * @type {{get_config: *}}
 */
module.exports = {
    get_config
};