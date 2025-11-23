(function(ST, $) {
    console.log("🧨 UNO v18.0 (暴力注入版) 启动");

    const TRIGGER = "【yellows game】";
    const SAVE_KEY = "st_uno_data_v18";
    
    // --- 1. 头像获取 (简单粗暴) ---
    function getUserAvatar() {
        const ctx = ST.getContext();
        if(!ctx) return 'img/user-default.png';
        let av = ctx.userAvatar;
        // 强制补全路径，参考了参考代码的逻辑
        return av ? (av.indexOf('/') > -1 ? av : `/User Avatars/${av}`) : 'img/user-default.png';
    }
    
    function getCharAvatar() {
        const ctx = ST.getContext();
        if(!ctx || !ctx.characterId) return '';
        let av = ctx.characters[ctx.characterId].avatar;
        return av ? (av.indexOf('/') > -1 ? av : `/characters/${av}`) : '';
    }

    // --- 2. 游戏引擎 (纯逻辑，不含任何 UI) ---
    const Engine = {
        state: { deck:[], pHand:[], aHand:[], top:null, turn:'player' },
        
        init() {
            const colors = ['red','blue','green','yellow'];
            const types = ['0','1','2','3','4','5','6','7','8','9','skip','draw2'];
            let deck = [];
            colors.forEach(c => types.forEach(t => {
                let n = (t==='0')?1:2;
                for(let i=0;i<n;i++) deck.push({col:c, val:t, type:(isNaN(t)?t:'num')});
            }));
            this.state.deck = deck.sort(()=>Math.random()-0.5);
            this.state.pHand = this.draw(7);
            this.state.aHand = this.draw(7);
            this.state.top = this.draw(1)[0];
            while(this.state.top.type !== 'num') {
                this.state.deck.push(this.state.top);
                this.state.top = this.draw(1)[0];
            }
            this.state.turn = 'player';
            this.save();
        },

        draw(n) {
            let d = [];
            for(let i=0;i<n;i++) {
                if(this.state.deck.length===0) this.init(); 
                d.push(this.state.deck.pop());
            }
            return d;
        },

        canPlay(c) { 
            return c.col === this.state.top.col || c.val === this.state.top.val; 
        },

        save() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); },
        
        load() {
            try {
                const d = JSON.parse(localStorage.getItem(SAVE_KEY));
                if(d && d.deck) { this.state = d; return true; }
            } catch(e){}
            return false;
        }
    };

    // --- 3. 渲染器 (直接生成 HTML 字符串) ---
    function renderGameHTML() {
        const s = Engine.state;
        
        // 生成手牌 HTML
        let handHTML = '';
        s.pHand.forEach((c, i) => {
            let val = c.val;
            if(val==='skip') val='🚫'; if(val==='draw2') val='+2';
            // 关键：直接把 onclick 写成 data 属性，让 jQuery 代理
            const playable = s.turn==='player' && Engine.canPlay(c);
            const cls = `uno-card c-${c.col} ${playable?'playable':'disabled'}`;
            handHTML += `<div class="${cls}" data-action="play" data-index="${i}">${val}</div>`;
        });

        let topVal = s.top.val;
        if(topVal==='skip') topVal='🚫'; if(topVal==='draw2') topVal='+2';

        // 这里的 HTML 结构模仿了手机模拟器，直接撑满容器
        return `
        <div class="uno-board">
            <div class="uno-top-bar">
                <span>UNO 对战</span>
                <div class="uno-btn-small" data-action="reset">↺</div>
            </div>
            
            <div class="uno-field">
                <!-- AI 区域 -->
                <div class="uno-row ai-row">
                    <img src="${getCharAvatar()}" class="uno-avatar">
                    <div class="uno-bubble ai-bubble">${s.aiMsg || "..."}</div>
                    <span style="color:white; font-size:12px; margin-left:auto">AI: ${s.aHand.length}</span>
                </div>

                <!-- 中间区域 -->
                <div class="uno-center">
                    <div class="uno-card c-${s.top.col}" style="transform:scale(1.2)">${topVal}</div>
                    <div class="uno-card c-back" data-action="draw">UNO</div>
                </div>

                <!-- 玩家区域 -->
                <div class="uno-row player-row">
                    <div class="uno-bubble user-bubble">${s.userMsg || "..."}</div>
                    <img src="${getUserAvatar()}" class="uno-avatar">
                </div>
                
                <!-- 手牌区域 -->
                <div class="uno-hand">
                    ${handHTML}
                </div>
            </div>
        </div>
        `;
    }

    // --- 4. 注入与绑定 (核心黑科技) ---
    // 模仿参考代码：找到目标容器，暴力替换 innerHTML
    function inject() {
        // 遍历所有消息气泡
        $('.mes_text').each(function() {
            const $msg = $(this);
            // 只有当文本包含关键词，且还没被替换过时
            if ($msg.text().includes(TRIGGER) && $msg.find('.uno-board').length === 0) {
                console.log("⚡ 发现触发词，注入游戏界面...");
                
                // 1. 尝试读档，没有则初始化
                if (!Engine.load()) Engine.init();
                
                // 2. 替换 HTML
                $msg.html(renderGameHTML());
                
                // 3. 强力绑定事件 (使用 jQuery delegate，防止 DOM 变动失效)
                // 先解绑旧的，防止重复触发
                $msg.off('click');
                
                // 绑定出牌
                $msg.on('click', '[data-action="play"]', async function() {
                    const idx = $(this).data('index');
                    await handlePlay(idx, $msg);
                });

                // 绑定摸牌
                $msg.on('click', '[data-action="draw"]', async function() {
                    await handleDraw($msg);
                });

                // 绑定重置
                $msg.on('click', '[data-action="reset"]', function() {
                    if(confirm("重开?")) { Engine.init(); refresh($msg); }
                });
            }
        });
    }

    // --- 5. 交互逻辑 ---
    function refresh($container) {
        Engine.save();
        $container.html(renderGameHTML());
        // 事件绑定依然有效，因为是绑定在 $msg 上的 delegate
    }

    async function handlePlay(idx, $container) {
        const c = Engine.state.pHand[idx];
        Engine.state.pHand.splice(idx, 1);
        Engine.state.top = c;
        Engine.state.userMsg = `出 ${c.val}`;
        
        if(c.type === 'draw2') { Engine.state.aHand.push(...Engine.draw(2)); Engine.state.aiMsg = "(+2)"; }
        if(c.type === 'skip') { Engine.state.aiMsg = "(跳过)"; refresh($container); return; }

        Engine.state.turn = 'ai';
        refresh($container);
        await aiMove($container);
    }

    async function handleDraw($container) {
        if(Engine.state.turn !== 'player') return;
        const c = Engine.draw(1)[0];
        Engine.state.pHand.push(c);
        Engine.state.userMsg = "摸牌";
        
        if(Engine.canPlay(c)) {
            if(window.toastr) toastr.info("能出！");
        } else {
            Engine.state.turn = 'ai';
            refresh($container);
            await new Promise(r=>setTimeout(r, 800));
            await aiMove($container);
        }
        refresh($container);
    }

    async function aiMove($container) {
        // 简单 AI，暂不接 LLM，确保逻辑先跑通
        await new Promise(r=>setTimeout(r, 1000));
        const valid = Engine.state.aHand.filter(c => Engine.canPlay(c));
        
        if(valid.length > 0) {
            const c = valid[Math.floor(Math.random()*valid.length)];
            const idx = Engine.state.aHand.indexOf(c);
            Engine.state.aHand.splice(idx, 1);
            Engine.state.top = c;
            Engine.state.aiMsg = `出 ${c.val}`;
            if(c.type==='draw2') Engine.state.pHand.push(...Engine.draw(2));
            if(c.type==='skip') { refresh($container); await new Promise(r=>setTimeout(r,1000)); await aiMove($container); return; }
        } else {
            Engine.state.aHand.push(...Engine.draw(1));
            Engine.state.aiMsg = "摸牌";
        }
        Engine.state.turn = 'player';
        refresh($container);
    }

    // --- 6. 循环扫描 (参考代码的核心机制) ---
    // 每 500ms 扫描一次页面，看有没有新的关键词出现
    setInterval(inject, 500);
    
    // 立即执行一次
    setTimeout(inject, 1000);

})(window.SillyTavern, window.jQuery);
