(function(ST, $) {
    console.log("🚀 UNO v17.0 (Web Component) 启动");

    const TRIGGER_KEYWORD = "【yellows game】";
    const SAVE_KEY = "st_uno_save_data_v17";

    // --- 1. 定义自定义元素 <uno-game> ---
    class UnoGameElement extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' }); // Shadow DOM 隔离样式
            this.state = { deck: [], pHand: [], aHand: [], top: null, turn: 'player' };
        }

        connectedCallback() {
            this.loadState();
            if (!this.state.top) this.initGame();
            this.render();
        }

        // --- 核心逻辑 ---
        initGame() {
            const colors = ['red', 'blue', 'green', 'yellow'];
            const types = ['0','1','2','3','4','5','6','7','8','9','skip','draw2'];
            let deck = [];
            colors.forEach(c => types.forEach(t => {
                let n = (t==='0')?1:2; 
                for(let i=0;i<n;i++) deck.push({col:c, val:t, type:(isNaN(t)?t:'num')});
            }));
            deck.sort(()=>Math.random()-0.5);
            
            this.state.deck = deck;
            this.state.pHand = this.draw(7);
            this.state.aHand = this.draw(7);
            this.state.top = this.draw(1)[0];
            while(this.state.top.type !== 'num') {
                this.state.deck.push(this.state.top);
                this.state.top = this.draw(1)[0];
            }
            this.state.turn = 'player';
            this.saveState();
        }

        draw(n) {
            let d = [];
            for(let i=0; i<n; i++) {
                if(this.state.deck.length===0) this.initGame(); // 简单重置
                d.push(this.state.deck.pop());
            }
            return d;
        }

        canPlay(c) { return c.col === this.state.top.col || c.val === this.state.top.val; }

        // --- 渲染 ---
        render() {
            const s = this.state;
            // 获取头像
            const charAvatar = this.getAvatar('char');
            const userAvatar = this.getAvatar('user');
            
            // 生成手牌 HTML
            const handHtml = s.pHand.map((c, i) => {
                let val = c.val;
                if(val==='skip') val='🚫'; if(val==='draw2') val='+2';
                const disabled = s.turn !== 'player' || !this.canPlay(c);
                return `<div class="card c-${c.col} ${disabled?'disabled':''}" onclick="this.getRootNode().host.playCard(${i})">${val}</div>`;
            }).join('');

            // 中间牌
            let topVal = s.top.val;
            if(topVal==='skip') topVal='🚫'; if(topVal==='draw2') topVal='+2';

            this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; height: 450px; font-family: sans-serif; user-select: none; }
                .board { 
                    height: 100%; background: #2c3e50; border-radius: 12px; 
                    display: flex; flex-direction: column; padding: 10px; box-sizing: border-box;
                    border: 2px solid #444; position: relative;
                }
                .header { display:flex; justify-content:space-between; color:#f1c40f; font-weight:bold; padding-bottom:5px; border-bottom:1px solid #555; }
                .table { flex:1; background: radial-gradient(#2ecc71, #27ae60); border-radius:8px; margin:5px 0; position:relative; }
                
                .zone { display:flex; align-items:center; padding:10px; gap:10px; }
                .zone.ai { color: #fff; }
                .zone.player { flex-direction: row-reverse; position:absolute; bottom:0; right:0; width:100%; }
                
                .avatar { width:50px; height:50px; border-radius:50%; border:2px solid #fff; object-fit:cover; background:#333; }
                .bubble { background:#fff; color:#000; padding:5px 10px; border-radius:10px; font-size:12px; max-width:120px; }
                
                .center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); display:flex; gap:20px; }
                .card { 
                    width:45px; height:65px; background:#fff; border-radius:4px; 
                    display:flex; align-items:center; justify-content:center; 
                    font-weight:bold; font-size:18px; cursor:pointer; box-shadow:2px 2px 5px rgba(0,0,0,0.3);
                }
                .c-red { background:#e74c3c; color:#fff; }
                .c-blue { background:#3498db; color:#fff; }
                .c-green { background:#2ecc71; color:#fff; }
                .c-yellow { background:#f1c40f; color:#000; }
                .c-back { background:#34495e; border:2px solid #fff; color:transparent; }
                
                .hand { display:flex; gap:5px; overflow-x:auto; padding:5px; position:absolute; bottom:60px; left:10px; right:10px; }
                .card.disabled { opacity:0.5; pointer-events:none; }
                .card:hover { transform:translateY(-5px); }

                #mask { position:absolute; inset:0; background:rgba(0,0,0,0.5); color:white; display:${s.turn==='ai'?'flex':'none'}; justify-content:center; align-items:center; z-index:10; border-radius:8px; }
            </style>

            <div class="board">
                <div id="mask">AI 思考中...</div>
                <div class="header">
                    <span>UNO</span>
                    <span style="font-size:12px; cursor:pointer" onclick="this.getRootNode().host.resetGame()">重置</span>
                </div>
                
                <div class="table">
                    <div class="zone ai">
                        <img src="${charAvatar}" class="avatar">
                        <div class="bubble" id="ai-msg">${s.aiMsg || "..."}</div>
                        <span style="font-size:12px; margin-left:auto">AI: ${s.aHand.length}</span>
                    </div>

                    <div class="center">
                        <div class="card c-${s.top.col}">${topVal}</div>
                        <div class="card c-back" onclick="this.getRootNode().host.drawCard()">UNO</div>
                    </div>

                    <div class="zone player">
                        <img src="${userAvatar}" class="avatar">
                        <div class="bubble" id="user-msg">${s.userMsg || "..."}</div>
                    </div>

                    <div class="hand">
                        ${handHtml}
                    </div>
                </div>
            </div>
            `;
        }

        // --- 交互 ---
        async playCard(idx) {
            const c = this.state.pHand[idx];
            this.state.pHand.splice(idx, 1);
            this.state.top = c;
            this.state.userMsg = `出 ${c.col} ${c.val}`;
            
            if(c.type === 'draw2') { this.state.aHand.push(...this.draw(2)); this.state.aiMsg = "(被+2)"; }
            if(c.type === 'skip') { 
                this.state.aiMsg = "(跳过)"; 
                this.render(); this.saveState(); return; 
            }

            this.state.turn = 'ai';
            this.render();
            this.saveState();
            await this.aiMove();
        }

        async drawCard() {
            if(this.state.turn !== 'player') return;
            const c = this.draw(1)[0];
            this.state.pHand.push(c);
            this.state.userMsg = "摸牌";
            
            if(this.canPlay(c)) {
                if(window.toastr) toastr.info("摸到的牌能出！");
            } else {
                this.state.turn = 'ai';
                await new Promise(r=>setTimeout(r,500));
                await this.aiMove();
            }
            this.render();
            this.saveState();
        }

        async aiMove() {
            // 模拟 AI 思考 (这里可以接入 LLM)
            await new Promise(r=>setTimeout(r, 1000));
            
            const valid = this.state.aHand.filter(c => this.canPlay(c));
            if(valid.length > 0) {
                const c = valid[Math.floor(Math.random()*valid.length)];
                const idx = this.state.aHand.indexOf(c);
                this.state.aHand.splice(idx, 1);
                this.state.top = c;
                this.state.aiMsg = `出 ${c.val}`;
                
                if(c.type === 'draw2') this.state.pHand.push(...this.draw(2));
                if(c.type === 'skip') {
                    this.render(); this.saveState();
                    await new Promise(r=>setTimeout(r, 1000));
                    await this.aiMove(); // 连动
                    return;
                }
            } else {
                this.state.aHand.push(...this.draw(1));
                this.state.aiMsg = "摸牌...";
            }
            
            this.state.turn = 'player';
            this.render();
            this.saveState();
        }

        resetGame() {
            if(confirm("重开？")) {
                this.state.top = null; // 触发重新 init
                this.connectedCallback();
            }
        }

        // --- 状态管理 ---
        saveState() {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
        }
        loadState() {
            try {
                const d = JSON.parse(localStorage.getItem(SAVE_KEY));
                if(d && d.deck) this.state = d;
            } catch(e){}
        }

        getAvatar(type) {
            const ctx = ST.getContext();
            if(!ctx) return "";
            if(type==='user') return ctx.userAvatar ? `/User Avatars/${ctx.userAvatar}` : '';
            if(type==='char') return ctx.characterId ? `/characters/${ctx.characters[ctx.characterId].avatar}` : '';
            return "";
        }
    }

    // 注册组件
    if(!customElements.get('uno-game')) {
        customElements.define('uno-game', UnoGameElement);
    }

    // --- 2. 扫描器 (Scanner) ---
    function scan() {
        $('.mes_text').each(function() {
            if($(this).text().includes(TRIGGER_KEYWORD) && $(this).find('uno-game').length === 0) {
                $(this).html('<uno-game></uno-game>'); // 直接替换文本为组件
            }
        });
    }

    // 启动扫描
    setInterval(scan, 1000); // 每秒检查一次，最稳妥
    
})(window.SillyTavern, window.jQuery);
