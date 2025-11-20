// 【重要】注意这里的路径层级！
// 你的插件目录是：/public/scripts/extensions/st-uno-game/
// extensions.js 在：/public/scripts/extensions.js
// 所以只需要两层 "../" 
import { extension_settings, getContext } from "../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";

const EXTENSION_NAME = "st-uno-game";

jQuery(async () => {
    console.log("🚀 [UNO] 插件正在初始化...");

    // 1. 手动加载 CSS
    // 获取当前脚本的路径，并把 index.js 替换为 style.css
    const currentUrl = import.meta.url; 
    const cssUrl = currentUrl.replace('index.js', 'style.css');
    $('head').append(`<link rel="stylesheet" type="text/css" href="${cssUrl}">`);

    // 2. 初始化设置
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {};
    }

    // 3. 创建一个简单的测试按钮
    const btnHtml = `
        <div id="uno-test-btn" class="menu_button" style="margin: 5px; border: 1px solid gold;">
            UNO 测试
        </div>
    `;

    // 尝试插入到顶部扩展菜单栏
    const menu = $('#extensions_menu');
    if (menu.length) {
        menu.after(btnHtml);
    } else {
        $('body').append(btnHtml);
        $('#uno-test-btn').css({position:'fixed', top:'10px', right:'10px', zIndex:9999});
    }

    // 4. 绑定点击事件
    $(document).on('click', '#uno-test-btn', function() {
        // 获取当前角色名
        const context = getContext();
        const charName = context.characterId ? context.characters[context.characterId].name : "无角色";
        
        alert(`✅ 插件运行成功！\n当前对话角色: ${charName}`);
    });
    
    console.log("✅ [UNO] 插件加载完成");
});
